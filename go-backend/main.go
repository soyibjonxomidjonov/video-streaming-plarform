package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gotd/td/telegram"
	"github.com/gotd/td/tg"
)

type BotWorker struct {
	ID     int
	Client *telegram.Client
	API    *tg.Client
}

type BotPool struct {
	workers []*BotWorker
	index   uint64
	mu      sync.RWMutex
}

func (bp *BotPool) GetWorker() (*BotWorker, error) {
	bp.mu.RLock()
	defer bp.mu.RUnlock()

	if len(bp.workers) == 0 {
		return nil, fmt.Errorf("ishchi botlar tayyor emas")
	}

	idx := atomic.AddUint64(&bp.index, 1)
	return bp.workers[idx%uint64(len(bp.workers))], nil
}

var (
	appID   int
	appHash string
	port    string
	botPool BotPool

	channelCache  = map[string]*channelInfo{}
	channelCacheM sync.RWMutex

	docCache  = map[string]*docInfo{}
	docCacheM sync.RWMutex
)

type channelInfo struct {
	ID         int64
	AccessHash int64
}

type docInfo struct {
	Doc      *tg.Document
	CachedAt time.Time
}

const docCacheTTL = 20 * time.Minute // file_reference vaqti-vaqti bilan eskiradi, shuning uchun uzoq saqlamaymiz

func main() {
	log.Println("[INIT] 🚀 MTProto Streamer ishga tushmoqda...")

	loadDotEnv(".env")

	var err error
	appID, err = strconv.Atoi(mustEnv("TELEGRAM_APP_ID"))
	if err != nil {
		log.Fatalf("[FATAL] TELEGRAM_APP_ID raqam bo'lishi kerak: %v", err)
	}

	appHash = mustEnv("TELEGRAM_APP_HASH")
	port = getEnv("PORT", "8081")

	tokensRaw := mustEnv("BOT_TOKENS")
	tokens := strings.Split(tokensRaw, ",")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var wg sync.WaitGroup
	log.Printf("[INIT] %d ta bot MTProto tarmog'iga ulanmoqda...", len(tokens))

	for i, token := range tokens {
		t := strings.TrimSpace(token)
		if t == "" {
			continue
		}

		wg.Add(1)
		go func(id int, botToken string) {
			client := telegram.NewClient(appID, appHash, telegram.Options{})

			go func() {
				err := client.Run(ctx, func(ctx context.Context) error {
					status, err := client.Auth().Bot(ctx, botToken)
					if err != nil {
						log.Printf("[ERROR] Bot #%d avtorizatsiya xatosi: %v", id, err)
						wg.Done()
						return err
					}

					username := "noma'lum"
					if u, ok := status.User.(*tg.User); ok {
						username = u.Username
					}
					log.Printf("[SUCCESS] Bot #%d muvaffaqiyatli ulandi: @%s", id, username)

					worker := &BotWorker{
						ID:     id,
						Client: client,
						API:    client.API(),
					}

					botPool.mu.Lock()
					botPool.workers = append(botPool.workers, worker)
					botPool.mu.Unlock()

					wg.Done()

					<-ctx.Done()
					return nil
				})
				if err != nil && !errorsIsCanceled(err) {
					log.Printf("[WARN] Bot #%d ulanishi uzildi: %v", id, err)
				}
			}()
		}(i+1, t)
	}

	waitTimeout(&wg, 15*time.Second)

	botPool.mu.RLock()
	activeBotsCount := len(botPool.workers)
	botPool.mu.RUnlock()

	if activeBotsCount == 0 {
		log.Fatalf("[FATAL] Hech bir bot Telegram MTProto tarmog'iga ulana olmadi!")
	}

	log.Printf("[READY] 🚀 Streamer tayyor! Faol Botlar: %d ta | Port: :%s", activeBotsCount, port)

	mux := http.NewServeMux()
	mux.HandleFunc("/stream", handleStream)
	mux.HandleFunc("/health", handleHealth)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("[FATAL] Server to'xtadi: %v", err)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	botPool.mu.RLock()
	count := len(botPool.workers)
	botPool.mu.RUnlock()

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "OK | Active MTProto Workers: %d\n", count)
}

func handleStream(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range, Content-Type")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// URL Parametrlari: /stream?channel=videos_for_llm2&message_id=11
	channelName := r.URL.Query().Get("channel")
	messageIDStr := r.URL.Query().Get("message_id")

	if channelName == "" || messageIDStr == "" {
		http.Error(w, "channel va message_id parametrlar shart", http.StatusBadRequest)
		return
	}

	messageID, err := strconv.Atoi(messageIDStr)
	if err != nil {
		http.Error(w, "message_id noto'g'ri", http.StatusBadRequest)
		return
	}

	worker, err := botPool.GetWorker()
	if err != nil {
		http.Error(w, "Botlar band", http.StatusServiceUnavailable)
		return
	}

	doc, err := getDocument(r.Context(), worker.API, channelName, messageID)
	if err != nil {
		log.Printf("[ERROR] [Bot #%d] Video topilmadi (channel=%s, message_id=%d): %v", worker.ID, channelName, messageID, err)
		http.Error(w, "Video topilmadi", http.StatusNotFound)
		return
	}

	fileID := doc.ID
	accessHash := doc.AccessHash
	fileRef := doc.FileReference
	fileSize := doc.Size

	// HTTP Range Parser (Pleyer o'tkazgan (seek qilgan) bayt intervali)
	rangeHeader := r.Header.Get("Range")
	var startByte, endByte int64
	chunkSize := int64(1 * 1024 * 1024) // Dynamic Chunk: 1 MB

	if rangeHeader == "" {
		startByte = 0
		endByte = startByte + chunkSize - 1
	} else {
		ranges := strings.Replace(rangeHeader, "bytes=", "", 1)
		parts := strings.Split(ranges, "-")
		startByte, _ = strconv.ParseInt(parts[0], 10, 64)

		if len(parts) > 1 && parts[1] != "" {
			endByte, _ = strconv.ParseInt(parts[1], 10, 64)
		} else {
			endByte = startByte + chunkSize - 1
		}
	}

	if startByte >= fileSize {
		http.Error(w, "Requested Range Not Satisfiable", http.StatusRequestedRangeNotSatisfiable)
		return
	}

	if endByte >= fileSize {
		endByte = fileSize - 1
	}

	contentLength := (endByte - startByte) + 1

	// Telegram MTProto Standard Alignment:
	const alignBlock = 128 * 1024
	alignOffset := (startByte / alignBlock) * alignBlock
	diff := startByte - alignOffset

	const limitBlock = 4 * 1024
	rawLimit := int(contentLength + diff)
	limit := ((rawLimit + limitBlock - 1) / limitBlock) * limitBlock

	if limit > 1024*1024 {
		limit = 1024 * 1024
	}

	location := &tg.InputDocumentFileLocation{
		ID:            fileID,
		AccessHash:    accessHash,
		FileReference: fileRef,
	}

	req := &tg.UploadGetFileRequest{
		Location: location,
		Offset:   alignOffset,
		Limit:    limit,
	}

	res, err := worker.API.UploadGetFile(r.Context(), req)
	if err != nil {
		// file_reference eskirgan bo'lishi mumkin — bir marta yangilab qayta urinamiz
		if strings.Contains(err.Error(), "FILE_REFERENCE_EXPIRED") {
			invalidateDocument(channelName, messageID)
			doc2, err2 := getDocument(r.Context(), worker.API, channelName, messageID)
			if err2 == nil {
				location.FileReference = doc2.FileReference
				res, err = worker.API.UploadGetFile(r.Context(), req)
			}
		}
		if err != nil {
			log.Printf("[ERROR] [Bot #%d] MTProto UploadGetFile error: %v", worker.ID, err)
			http.Error(w, "Telegram'dan yuklab bo'lmadi", http.StatusBadGateway)
			return
		}
	}

	switch chunk := res.(type) {
	case *tg.UploadFile:
		bytesToWrite := chunk.Bytes

		if diff < int64(len(bytesToWrite)) {
			bytesToWrite = bytesToWrite[diff:]
		} else {
			bytesToWrite = []byte{}
		}

		if int64(len(bytesToWrite)) > contentLength {
			bytesToWrite = bytesToWrite[:contentLength]
		}

		actualLen := int64(len(bytesToWrite))
		actualEndByte := startByte + actualLen - 1

		w.Header().Set("Content-Type", "video/mp4")
		w.Header().Set("Accept-Ranges", "bytes")
		w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", startByte, actualEndByte, fileSize))
		w.Header().Set("Content-Length", strconv.FormatInt(actualLen, 10))
		w.WriteHeader(http.StatusPartialContent)

		w.Write(bytesToWrite)

	default:
		log.Printf("[ERROR] [Bot #%d] Kutilmagan Telegram javob turi", worker.ID)
		http.Error(w, "Server xatosi", http.StatusInternalServerError)
	}
}

// ================= MTProto RESOLVE FUNKSIYALARI =================

// resolveChannel — kanal username'ini access_hash'ga aylantiradi, natijani keshlaydi
// (kanal access_hash deyarli hech qachon o'zgarmaydi, shuning uchun uzoq saqlanadi).
func resolveChannel(ctx context.Context, api *tg.Client, username string) (*channelInfo, error) {
	channelCacheM.RLock()
	if ci, ok := channelCache[username]; ok {
		channelCacheM.RUnlock()
		return ci, nil
	}
	channelCacheM.RUnlock()

	resolved, err := api.ContactsResolveUsername(ctx, &tg.ContactsResolveUsernameRequest{
		Username: username,
	})
	if err != nil {
		return nil, fmt.Errorf("contacts.resolveUsername: %w", err)
	}

	for _, c := range resolved.Chats {
		if ch, ok := c.(*tg.Channel); ok {
			ci := &channelInfo{ID: ch.ID, AccessHash: ch.AccessHash}
			channelCacheM.Lock()
			channelCache[username] = ci
			channelCacheM.Unlock()
			return ci, nil
		}
	}

	return nil, fmt.Errorf("kanal topilmadi: %s", username)
}

// getDocument — channel+message_id orqali videoning Document ma'lumotini oladi,
// qisqa muddat (docCacheTTL) keshlaydi, chunki file_reference vaqti-vaqti bilan eskiradi.
func getDocument(ctx context.Context, api *tg.Client, channelName string, messageID int) (*tg.Document, error) {
	cacheKey := fmt.Sprintf("%s:%d", channelName, messageID)

	docCacheM.RLock()
	if di, ok := docCache[cacheKey]; ok && time.Since(di.CachedAt) < docCacheTTL {
		docCacheM.RUnlock()
		return di.Doc, nil
	}
	docCacheM.RUnlock()

	ci, err := resolveChannel(ctx, api, channelName)
	if err != nil {
		return nil, err
	}

	inputChannel := &tg.InputChannel{ChannelID: ci.ID, AccessHash: ci.AccessHash}
	msgs, err := api.ChannelsGetMessages(ctx, &tg.ChannelsGetMessagesRequest{
		Channel: inputChannel,
		ID:      []tg.InputMessageClass{&tg.InputMessageID{ID: messageID}},
	})
	if err != nil {
		return nil, fmt.Errorf("channels.getMessages: %w", err)
	}

	cm, ok := msgs.(*tg.MessagesChannelMessages)
	if !ok || len(cm.Messages) == 0 {
		return nil, fmt.Errorf("xabar topilmadi (message_id=%d)", messageID)
	}

	msg, ok := cm.Messages[0].(*tg.Message)
	if !ok {
		return nil, fmt.Errorf("xabar turi mos emas: %T", cm.Messages[0])
	}

	mediaDoc, ok := msg.Media.(*tg.MessageMediaDocument)
	if !ok || mediaDoc.Document == nil {
		return nil, fmt.Errorf("xabarda video/hujjat yo'q")
	}

	doc, ok := mediaDoc.Document.(*tg.Document)
	if !ok {
		return nil, fmt.Errorf("hujjat turi mos emas: %T", mediaDoc.Document)
	}

	docCacheM.Lock()
	docCache[cacheKey] = &docInfo{Doc: doc, CachedAt: time.Now()}
	docCacheM.Unlock()

	return doc, nil
}

func invalidateDocument(channelName string, messageID int) {
	cacheKey := fmt.Sprintf("%s:%d", channelName, messageID)
	docCacheM.Lock()
	delete(docCache, cacheKey)
	docCacheM.Unlock()
}

// ================= YORDAMCHI FUNKSIYALAR =================

func loadDotEnv(filepath string) {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)
			os.Setenv(key, val)
		}
	}
}

func mustEnv(key string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		log.Fatalf("[FATAL] %s env o'zgaruvchisi belgilanamadi!", key)
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func waitTimeout(wg *sync.WaitGroup, timeout time.Duration) bool {
	c := make(chan struct{})
	go func() {
		defer close(c)
		wg.Wait()
	}()
	select {
	case <-c:
		return false
	case <-time.After(timeout):
		return true
	}
}

func errorsIsCanceled(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "context canceled")
}