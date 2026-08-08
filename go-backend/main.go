package main

import (
	"context"
	"encoding/hex"
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
)

func main() {
	log.Println("[INIT] 🚀 MTProto Streamer ishga tushmoqda...")

	// 1. .env faylini avtomatik yuklash
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

	// 2. MTProto Bot Pool-ni parallel ishga tushirish
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

	// Botlar autentifikatsiyasini kutish (15 soniya timeout)
	waitTimeout(&wg, 15*time.Second)

	botPool.mu.RLock()
	activeBotsCount := len(botPool.workers)
	botPool.mu.RUnlock()

	if activeBotsCount == 0 {
		log.Fatalf("[FATAL] Hech bir bot Telegram MTProto tarmog'iga ulana olmadi!")
	}

	log.Printf("[READY] 🚀 Streamer tayyor! Faol Botlar: %d ta | Port: :%s", activeBotsCount, port)

	// 3. HTTP Server
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
	// CORS Header'lar (Veb pleyerlar va mobil ilovalar uchun)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range, Content-Type")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// URL Parametrlari: /stream?id=123456&access_hash=7891011&size=104857600&file_reference=a1b2...
	fileIDStr := r.URL.Query().Get("id")
	accessHashStr := r.URL.Query().Get("access_hash")
	fileSizeStr := r.URL.Query().Get("size")
	fileRefHex := r.URL.Query().Get("file_reference")

	if fileIDStr == "" || accessHashStr == "" || fileSizeStr == "" {
		http.Error(w, "id, access_hash va size parametrlar shart", http.StatusBadRequest)
		return
	}

	fileID, err1 := strconv.ParseInt(fileIDStr, 10, 64)
	accessHash, err2 := strconv.ParseInt(accessHashStr, 10, 64)
	fileSize, err3 := strconv.ParseInt(fileSizeStr, 10, 64)

	if err1 != nil || err2 != nil || err3 != nil || fileSize <= 0 {
		http.Error(w, "Parametrlar formati noto'g'ri", http.StatusBadRequest)
		return
	}

	var fileRef []byte
	if fileRefHex != "" {
		fileRef, _ = hex.DecodeString(fileRefHex)
	}

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
	// 1. Offset har doim 128 KB (131072) ga karrali bo'lishi shart
	const alignBlock = 128 * 1024
	alignOffset := (startByte / alignBlock) * alignBlock
	diff := startByte - alignOffset

	// 2. Request Limit har doim 4 KB (4096) ga karrali bo'lishi shart
	const limitBlock = 4 * 1024
	rawLimit := int(contentLength + diff)
	limit := ((rawLimit + limitBlock - 1) / limitBlock) * limitBlock

	// 3. Telegram maksimal cheklovi (1 MB)
	if limit > 1024*1024 {
		limit = 1024 * 1024
	}

	location := &tg.InputDocumentFileLocation{
		ID:            fileID,
		AccessHash:    accessHash,
		FileReference: fileRef,
	}

	worker, err := botPool.GetWorker()
	if err != nil {
		http.Error(w, "Botlar band", http.StatusServiceUnavailable)
		return
	}

	req := &tg.UploadGetFileRequest{
		Location: location,
		Offset:   alignOffset,
		Limit:    limit,
	}

	// Telegram MTProto request
	res, err := worker.API.UploadGetFile(r.Context(), req)
	if err != nil {
		log.Printf("[ERROR] [Bot #%d] MTProto UploadGetFile error: %v", worker.ID, err)
		http.Error(w, "Telegram'dan yuklab bo'lmadi", http.StatusBadGateway)
		return
	}

	switch chunk := res.(type) {
	case *tg.UploadFile:
		bytesToWrite := chunk.Bytes

		// Telegram alignment sababli ortiqcha boshlang'ich baytlarni qirqish
		if diff < int64(len(bytesToWrite)) {
			bytesToWrite = bytesToWrite[diff:]
		} else {
			bytesToWrite = []byte{}
		}

		// Kutilgandan ortiqcha baytlar bo'lsa qirqish
		if int64(len(bytesToWrite)) > contentLength {
			bytesToWrite = bytesToWrite[:contentLength]
		}

		actualLen := int64(len(bytesToWrite))
		actualEndByte := startByte + actualLen - 1

		// Header'larni belgilash va faqat muvaffaqiyatli yuklangach status yuborish
		w.Header().Set("Content-Type", "video/mp4")
		w.Header().Set("Accept-Ranges", "bytes")
		w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", startByte, actualEndByte, fileSize))
		w.Header().Set("Content-Length", strconv.FormatInt(actualLen, 10))
		w.WriteHeader(http.StatusPartialContent)

		// Direct Stream: RAM-dan darhol ResponseWriter-ga (0 MB Disk)
		w.Write(bytesToWrite)

	default:
		log.Printf("[ERROR] [Bot #%d] Kutilmagan Telegram javob turi", worker.ID)
		http.Error(w, "Server xatosi", http.StatusInternalServerError)
	}
}

// ================= YORDAMCHI FUNKSIYALAR =================

func loadDotEnv(filepath string) {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return // .env fayli bo'lmasa o'tkazib yuboriladi
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