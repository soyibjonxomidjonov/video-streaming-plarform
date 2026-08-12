 # Ovozli Boshqaruv — To'liq Frontend Hujjati (Final)

Bu — loyihaning **yakuniy, 100% to'ldirilgan** frontend hujjati. Uch qismni birlashtiradi:

1. Ovozli buyruq arxitekturasi (4+1 qatlam, WebSocket, tool dispatcher)
2. Video striming integratsiyasi (Go streamer bilan)
3. **Ovozli rejim vizual indikatori** (Gemini-uslubidagi bottom overlay)

---

## 0. Umumiy arxitektura xaritasi

```
Ovoz → STT → matn
   ↓
QATLAM 0: Tez kalit-so'z filtri (frontend, LLM'siz)
   ↓ (mos kelmasa)
QATLAM 1: WebSocket → backend
   ↓
QATLAM 2: Backend LLM + TOOLS → {tool, params, speak}
   ↓
QATLAM 3: Frontend TOOL_DISPATCH → bajaradi
   ↓
QATLAM 4: Natija — ekran + TTS ovoz
   ↓
QATLAM 5 (YANGI): Butun jarayon davomida — pastki VOICE OVERLAY, holatni vizual ko'rsatadi
```

---

## 1. Ovozli rejim vizual indikatori (Gemini-uslubidagi overlay)

### 1.1 Nima uchun kerak

Hozirgi holatda, foydalanuvchi mikrofon yoqilganmi, tinglayaptimi, javob kutyaptimi — buni **hech qanday vizual belgi orqali bilmaydi**. Sizning yuborgan skrinshotingizdagi Android Gemini overlay'i, aynan shu muammoni hal qiladi: ekran pastida, joriy holatni ko'rsatuvchi, yarim shaffof pastki panel (bottom sheet) paydo bo'ladi.

**Skrinshotdagi dizayn elementlari** (Image 2 asosida):
- Ekran pastida, navigatsiya panelidan tepada, gorizontal joylashgan doira-tugmalar qatori
- Markazda — katta, ko'k-gradient, yorqin **orb** (doira) — bu asosiy "tinglash indikatori"
- Chap tomonda — kichikroq qora-shaffof doira tugmalar (kamera, screenshot/upload)
- O'ng tomonda — mikrofon va yopish (X) tugmalari
- Fon — butun ekranni qoplaydigan, yengil qorong'ilashtirish (dim overlay), asosiy kontent orqada ko'rinib turadi
- Yuqori o'ng burchakda — kichik "history/list" tugmasi

Bizning holatimizda, bu dizaynni **soddalashtirib**, video-striming saytiga mos qilib olamiz: markazda tinglash-orb, yonida "yopish" va "yozib olish holatini almashtirish" tugmalari, tepada esa — foydalanuvchi aytgan matn va Claude/AI javobi (caption) chiqadigan joy.

### 1.2 Holatlar (states)

Overlay, 4 ta aniq holatni vizual ko'rsatishi kerak:

| Holat | Vizual ko'rinish | Qachon |
|---|---|---|
| `idle` | Overlay yashirin | Ovozli rejim o'chiq |
| `listening` | Orb pulsatsiyalanadi (ko'k, kattalashib-kichraydi), pastda "Tinglayapman..." matni | Mikrofon ochiq, foydalanuvchi gapiryapti |
| `thinking` | Orb aylanuvchi gradient-animatsiya bilan, "O'ylayapman..." | Matn WebSocket orqali backend'ga yuborilgan, javob kutilmoqda |
| `speaking` | Orb, TTS ovoz balandligiga mos ravishda "to'lqinlanadi" (waveform), pastda AI javob matni (caption) | TTS orqali javob o'qilyapti |

### 1.3 HTML/CSS — overlay komponenti

```html
<div id="voice-overlay" class="voice-overlay voice-overlay--hidden" data-state="idle">
  <!-- Fon: yengil qorong'ilashtirish -->
  <div class="voice-overlay__scrim"></div>

  <!-- Caption: foydalanuvchi so'zi / AI javobi -->
  <div class="voice-overlay__caption" id="voice-caption"></div>

  <!-- Pastki panel -->
  <div class="voice-overlay__panel">
    <button class="voice-btn voice-btn--secondary" id="voice-btn-camera" aria-label="Ekran skrinshoti">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    </button>

    <div class="voice-orb" id="voice-orb">
      <div class="voice-orb__core"></div>
    </div>

    <button class="voice-btn voice-btn--danger" id="voice-btn-close" aria-label="Yopish">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>

  <div class="voice-overlay__status" id="voice-status">Tinglayapman...</div>
</div>
```

```css
.voice-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.voice-overlay--hidden {
  opacity: 0;
  pointer-events: none;
}

.voice-overlay:not(.voice-overlay--hidden) {
  pointer-events: auto;
}

.voice-overlay__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 30%, transparent 60%);
}

.voice-overlay__caption {
  position: relative;
  margin: 0 24px 16px;
  color: #fff;
  font-size: 15px;
  text-align: center;
  min-height: 20px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

.voice-overlay__panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 12px 24px 8px;
}

.voice-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}
.voice-btn:active { transform: scale(0.92); }
.voice-btn--secondary { background: rgba(255,255,255,0.10); }
.voice-btn--danger { background: rgba(255,255,255,0.10); }
.voice-btn--danger:hover { background: rgba(255,80,80,0.35); }

/* Markaziy orb — asosiy tinglash indikatori */
.voice-orb {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 35% 30%, #8ab4ff, #4285f4 55%, #1a56db 100%);
  box-shadow: 0 4px 24px rgba(66,133,244,0.5);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.voice-orb__core {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  opacity: 0.9;
}

.voice-overlay__status {
  text-align: center;
  color: rgba(255,255,255,0.75);
  font-size: 13px;
  padding-bottom: 18px;
}

/* --- Holat animatsiyalari --- */

/* listening: sekin puls */
.voice-overlay[data-state="listening"] .voice-orb {
  animation: voice-pulse 1.6s ease-in-out infinite;
}
@keyframes voice-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 4px 24px rgba(66,133,244,0.5); }
  50% { transform: scale(1.12); box-shadow: 0 4px 34px rgba(66,133,244,0.75); }
}

/* thinking: aylanuvchi gradient */
.voice-overlay[data-state="thinking"] .voice-orb {
  animation: voice-spin 1.2s linear infinite;
  background: conic-gradient(from 0deg, #4285f4, #8ab4ff, #1a56db, #4285f4);
}
@keyframes voice-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* speaking: tez, kichikroq to'lqin puls (TTS ovoz chiqayotganda) */
.voice-overlay[data-state="speaking"] .voice-orb {
  animation: voice-speak 0.45s ease-in-out infinite alternate;
}
@keyframes voice-speak {
  from { transform: scale(0.95); }
  to { transform: scale(1.08); }
}

/* idle holatida orb tinch turadi, animatsiyasiz */
```

### 1.4 JavaScript — overlay boshqaruvchisi

```javascript
class VoiceOverlay {
  constructor() {
    this.el = document.getElementById("voice-overlay");
    this.orb = document.getElementById("voice-orb");
    this.caption = document.getElementById("voice-caption");
    this.status = document.getElementById("voice-status");

    document.getElementById("voice-btn-close").addEventListener("click", () => this.hide());
    document.getElementById("voice-btn-camera").addEventListener("click", () => this.onScreenshotRequest?.());
  }

  show() {
    this.el.classList.remove("voice-overlay--hidden");
  }

  hide() {
    this.el.classList.add("voice-overlay--hidden");
    this.setState("idle");
    this.onClose?.();
  }

  setState(state, options = {}) {
    // state: "idle" | "listening" | "thinking" | "speaking"
    this.el.dataset.state = state;

    const statusText = {
      idle: "",
      listening: "Tinglayapman...",
      thinking: "O'ylayapman...",
      speaking: "",
    };
    this.status.textContent = options.statusText || statusText[state] || "";
  }

  setCaption(text) {
    this.caption.textContent = text || "";
  }
}

const voiceOverlay = new VoiceOverlay();
```

### 1.5 Voice control oqimi bilan bog'lash

Oldingi bo'limlardagi (`AgentSocket`, `tryFastPath`, TTS) kod bilan, overlay quyidagicha ulanadi:

```javascript
function startVoiceSession() {
  voiceOverlay.show();
  voiceOverlay.setState("listening");
  voiceInput.start();
}

voiceInput.onResult = (text) => {
  voiceOverlay.setCaption(text); // foydalanuvchi aytgan so'zni ko'rsatish

  if (tryConfirmationFastPath(text)) return;

  const fastResult = tryFastPath(text);
  if (fastResult) {
    voiceOverlay.setState("thinking");
    executeToolWithConfirmation(fastResult.tool, fastResult.params);
    voiceOverlay.setState("listening"); // playback/nav tez bajariladi, darrov qaytadi
  } else {
    voiceOverlay.setState("thinking");
    socket.send(text, getCurrentFrontendState());
  }
};

// TTS ovoz chiqqanda, orb "speaking" holatiga o'tadi
function speak(text) {
  if (!text || !ttsEnabled || !synth) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "uz-UZ";
  utterance.onstart = () => {
    voiceOverlay.setState("speaking");
    voiceOverlay.setCaption(text);
  };
  utterance.onend = () => voiceOverlay.setState("listening");
  synth.speak(utterance);
}

// Foydalanuvchi mikrofon tugmasini yopsa, yoki "tinglashni to'xtat" desa
PLAYBACK_HANDLERS.stop_listening = () => {
  voiceInput.stop();
  voiceOverlay.hide();
};
```

> **Eslatma:** Skrinshotdagi kamera/upload tugmalari, Gemini'ning multimodal (rasm yuklash) imkoniyatiga tegishli. Video-striming saytida bunga ehtiyoj yo'q, shuning uchun kamera tugmasi — ixtiyoriy, xohlasangiz "screenshot yuborish" yoki "joriy sahifa haqida savol berish" kabi funksiyaga bog'lash mumkin, yoki umuman olib tashlash mumkin.

---

## 2. WebSocket protokoli (Django Channels)

### 2.1 Frontend → Backend

```json
{
  "type": "user_command",
  "text": "bunga besh baho qo'y",
  "session_id": "a1b2c3d4-...",
  "frontend_state": {
    "content_type": "movie",
    "content_id": 45,
    "content_title": "Men robot emasman",
    "is_playing": true,
    "current_time_seconds": 320
  }
}
```

### 2.2 Backend → Frontend (tool_call)

```json
{
  "type": "tool_call",
  "tool": "rate_content",
  "params": { "stars": 5, "title": "Men robot emasman" },
  "speak": "Filmga 5 yulduz qo'ydim"
}
```

### 2.3 Backend → Frontend (clarify)

```json
{
  "type": "clarify",
  "question": "Qaysi filmga baho qo'yishni xohlaysiz?",
  "awaiting": "rate_content"
}
```

### 2.4 AgentSocket — to'liq klass (xato boshqaruvi bilan)

```javascript
class AgentSocket {
  constructor({ onToolCall, onClarify, onError, onStatusChange }) {
    this.sessionId = crypto.randomUUID();
    this.onToolCall = onToolCall;
    this.onClarify = onClarify;
    this.onError = onError;
    this.onStatusChange = onStatusChange;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageQueue = [];
    this._connect();
  }

  _connect() {
    this.onStatusChange?.("connecting");
    this.ws = new WebSocket(`wss://${location.host}/ws/agent/`);
    this._bindEvents();
  }

  _bindEvents() {
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatusChange?.("connected");
      while (this.messageQueue.length) this.ws.send(this.messageQueue.shift());
    };

    this.ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); }
      catch { return console.error("Noto'g'ri JSON:", event.data); }

      if (data.type === "tool_call") this.onToolCall(data.tool, data.params, data.speak);
      else if (data.type === "clarify") this.onClarify(data.question);
      else if (data.type === "error") this.onError?.(data.message || "Noma'lum xatolik");
    };

    this.ws.onclose = () => {
      this.onStatusChange?.("disconnected");
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
        this.reconnectAttempts++;
        setTimeout(() => this._connect(), delay);
      } else {
        this.onError?.("Serverga ulanib bo'lmadi. Sahifani yangilang.");
      }
    };

    this.ws.onerror = (err) => console.error("WebSocket xato:", err);
  }

  send(text, frontendState) {
    const payload = JSON.stringify({
      type: "user_command", text, session_id: this.sessionId, frontend_state: frontendState,
    });
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(payload);
    else this.messageQueue.push(payload);
  }
}
```

---

## 3. TTS (ovozli javob)

```javascript
const synth = window.speechSynthesis;
let ttsEnabled = true;

const DEFAULT_SPEECH = {
  add_to_favorites: (p) => `${p.title} sevimlilarga qo'shildi`,
  remove_from_favorites: (p) => `${p.title} sevimlilardan olib tashlandi`,
  rate_content: (p) => `${p.stars} yulduz qo'yildi`,
  search_content: (p) => `${p.query} bo'yicha qidiruv boshlandi`,
  mark_as_watched: (p) => `${p.title} ko'rilgan deb belgilandi`,
  clear_watch_history: () => `Tomosha tarixi tozalandi`,
  logout: () => `Tizimdan chiqdingiz`,
};

function speakResult(toolName, params, backendSpeak) {
  const text = backendSpeak || DEFAULT_SPEECH[toolName]?.(params) || null;
  if (text) speak(text); // speak() — 1.5-bandda, overlay bilan bog'langan versiyasi
}
```

---

## 4. Xavfli amallar uchun tasdiqlash qatlami

```javascript
const REQUIRES_CONFIRMATION = new Set([
  "clear_watch_history", "delete_comment", "logout",
  "remove_from_favorites", "remove_from_continue_watching",
]);

const CONFIRMATION_TEXT = {
  clear_watch_history: "Butun tomosha tarixini o'chirishni tasdiqlaysizmi?",
  delete_comment: "Izohni o'chirishni tasdiqlaysizmi?",
  logout: "Tizimdan chiqishni tasdiqlaysizmi?",
  remove_from_favorites: "Sevimlilardan olib tashlashni tasdiqlaysizmi?",
  remove_from_continue_watching: "Ro'yxatdan olib tashlashni tasdiqlaysizmi?",
};

let pendingConfirmation = null;

function executeToolWithConfirmation(toolName, params) {
  if (REQUIRES_CONFIRMATION.has(toolName)) {
    pendingConfirmation = { tool: toolName, params };
    const question = CONFIRMATION_TEXT[toolName];
    voiceOverlay.setCaption(question);
    speak(question);
    return;
  }
  executeTool(toolName, params);
}

function handleConfirmationResponse(confirmed) {
  if (!pendingConfirmation) return;
  if (confirmed) executeTool(pendingConfirmation.tool, pendingConfirmation.params);
  else speak("Bekor qilindi");
  pendingConfirmation = null;
}

const CONFIRMATION_PATTERNS = [
  { pattern: /^(ha|xa|tasdiqlayman|albatta)$/i, value: true },
  { pattern: /^(yo'q|yoq|bekor qil)$/i, value: false },
];

function tryConfirmationFastPath(text) {
  if (!pendingConfirmation) return false;
  for (const { pattern, value } of CONFIRMATION_PATTERNS) {
    if (pattern.test(text.trim())) { handleConfirmationResponse(value); return true; }
  }
  return false;
}
```

---

## 5. QATLAM 0 — Tez kalit-so'z filtri (to'liq, tadqiqot-asoslangan versiya)

> **Manba:** "Uzbek Voice-Controlled Video Player: Linguistic Research & STT System Specification" — 42 manba tekshirilgan, 248 ibora, 34 ildiz, 39 dialekt varianti, 68 kod-almashish varianti, 52 STT xatosi qayd etilgan (to'liq audit — 27-30-bo'limlar). Quyidagi kod o'sha hujjatning **Section 5 (Regex strategiyasi)**, **Section 6 (Normalizatsiya pipeline)** va **Section 3 (13 amal lug'ati)** natijalarini frontend uchun ishlaydigan yakuniy shaklga keltiradi.

Eski versiya (yuqorida ilgari turgan) uchta jiddiy zaifligi bor edi:
1. **Inkor (negatsiya) hisobga olinmagan** — "to'xtatma" kabi buyruq ham `pause_video`ni ishga tushirar edi.
2. **Faqat bitta yozilish shakli** — "pauza" so'zi tanilardi, lekin "posa kil", "toxtat", "istop kil" kabi STT xatolari tushib qolardi.
3. **Semantik kolliziya himoyasi yo'q** — "mashinani to'xtat" yoki "chiroqni o'chir" kabi umuman videoga aloqasi yo'q gaplar ham noto'g'ri amalga oshirilishi mumkin edi.

Quyidagi versiya bu uchtasini ham tadqiqot natijalari asosida tuzatadi.

### 5.1 Normalizatsiya pipeline

STT'dan kelgan xom matn regex bilan solishtirilishidan oldin, 5 bosqichli deterministik tozalashdan o'tadi (tadqiqot Section 6):

```javascript
function normalizeUzbekSTT(raw) {
  if (!raw) return "";

  let text = raw.toLowerCase().normalize("NFC");

  // 1) Apostrof variantlarini birlashtirish (oʻ / o' / o` / o' → bitta shaklga)
  text = text.replace(/[ʻ‘’`ʼ]/g, "'");

  // 2) Kirillcha chiqsa — lotinga o'girish (ba'zi STT provayderlari kirillcha qaytaradi)
  const CYR_TO_LAT = {
    "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh",
    "з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o",
    "п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"ts",
    "ч":"ch","ш":"sh","ъ":"'","ь":"","э":"e","ю":"yu","я":"ya",
    "ў":"o'","ғ":"g'","қ":"q","ҳ":"h",
  };
  text = text.split("").map((ch) => CYR_TO_LAT[ch] || ch).join("");

  // 3) Buyruqqa ta'sir qilmaydigan to'ldiruvchi so'zlarni olib tashlash
  text = text.replace(/\b(iltimos|marhamat|aka|uka|opa|xo'p|xop|xo'sh|xosh|davay|qani|endi)\b/g, " ");

  // 4) Tadqiqotda qayd etilgan ATTESTED_STT_ERROR / COMMON_ORTHOGRAPHIC_VARIANT tuzatishlari
  //    (Section 3, har bir amalning "STT VARIANTS" ro'yxatidan)
  text = text
    .replace(/\bkil(ing|vor|di|gin)?\b/g, (m) => m.replace(/^kil/, "qil"))
    .replace(/\bkoy\b/g, "qo'y")
    .replace(/\botkas\b/g, "o'tkaz")
    .replace(/\botkaz(?!\')/g, "o'tkaz")
    .replace(/\bkotar\b/g, "ko'tar")
    .replace(/\bkaytar\b/g, "qaytar")
    .replace(/\bochir\b/g, "o'chir")
    .replace(/\bochirib\b/g, "o'chirib")
    .replace(/\btoxtat/g, "to'xtat")
    .replace(/\btuxtat/g, "to'xtat")
    .replace(/\bposa\b/g, "pauza")
    .replace(/\bpref\b/g, "prev")
    .replace(/\bnasad\b/g, "nazad")
    .replace(/\bristart\b/g, "restart")
    .replace(/\bsqorost/g, "skorost")
    .replace(/\bteslik/g, "tezlik")
    .replace(/\btulik\b/g, "to'liq")
    .replace(/\bnex\b/g, "next")
    .replace(/\bawalgi\b/g, "avvalgi")
    .replace(/\bbosidan\b/g, "boshidan")
    .replace(/\bkaitadan\b/g, "qaytadan")
    .replace(/\btezlastir\b/g, "tezlashtir")
    .replace(/\bfpered\b/g, "vpered")
    .replace(/\borkaga\b/g, "orqaga")
    .replace(/\babozini\b/g, "ovozini");

  // 5) So'z bilan aytilgan sonlarni raqamga o'girish ("o'n sekund" → "10 sekund")
  const NUMBER_WORDS = {
    "bir": 1, "ikki": 2, "uch": 3, "to'rt": 4, "besh": 5,
    "olti": 6, "yetti": 7, "sakkiz": 8, "to'qqiz": 9, "o'n": 10,
    "yigirma": 20, "o'ttiz": 30, "qirq": 40, "ellik": 50,
  };
  Object.keys(NUMBER_WORDS).forEach((word) => {
    text = text.replace(new RegExp(`\\b${word.replace(/'/g, "'")}\\b`, "g"), NUMBER_WORDS[word]);
  });

  return text.replace(/\s+/g, " ").trim();
}
```

**Nega bu tartibda?** Kirillcha→lotin almashtiruvi apostrof normalizatsiyasidan keyin bo'lishi kerak, chunki kirillcha ъ/ь belgilari apostrofga mos keladi. STT-xato tuzatish esa raqam-so'z almashtiruvidan oldin bo'lishi kerak, aks holda "to'rt" kabi so'zlar boshqa qoidalar bilan to'qnashishi mumkin.

### 5.2 13 video amali uchun ildiz-lug'at qoidalari

Har bir qoida to'rt qismdan iborat: **match** (musbat ildizlar, `\b` chegarasi bilan), **negative** (tadqiqotning "NEGATIVE FORMS" ro'yxatidan olingan inkor shakllari — agar bu topilsa, buyruq **bajarilmaydi**, backend'ga LLM tahliliga yuboriladi), **exclude** (tadqiqotning "AMBIGUOUS FORMS" / "DO-NOT-MATCH FORMS" ro'yxatidan olingan xavfli kontekstlar) va **extractParam** (vaqt/tezlik parametri, mavjud bo'lsa).

```javascript
// Yordamchi: ovoz bilan bog'liq amallarda ikkita so'z (masalan "ovoz" va "ko'tar")
// tartibga bog'liq bo'lmagan holda ikkalasi ham matnda borligini tekshiradi
// (tadqiqot Part 15: o'zbek tilida so'z tartibi erkin — "ovozni baland qil"
// va "balandroq qil ovozni" ikkalasi ham amalda uchraydi)
function hasAll(text, regexList) {
  return regexList.every((r) => r.test(text));
}

function extractSeekSeconds(text) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(sekund|soniya|minut|daqiqa)/);
  if (!m) return {}; // parametr topilmasa, dispatcher standart 10s ishlatadi
  let value = parseFloat(m[1]);
  if (m[2] === "minut" || m[2] === "daqiqa") value *= 60;
  return { seconds: Math.round(value) };
}

function extractSpeedParams(text) {
  if (/\b(normal|me'yoriy)\s*tezlik/.test(text)) return { speed: 1.0 };
  const xMatch = text.match(/(\d+(?:\.\d+)?)\s*x\b/);
  if (xMatch) return { speed: parseFloat(xMatch[1]) };
  const baravarMatch = text.match(/(\d+(?:\.\d+)?)\s*(baravar|barobar)/);
  if (baravarMatch) return { speed: parseFloat(baravarMatch[1]) };
  // Aniq son ko'rsatilmagan bo'lsa — nisbiy qadam (joriy tezlikka nisbatan)
  if (/\b(tezlashtir\w*|tezroq)\b/.test(text)) return { delta: 0.25 };
  if (/\b(sekinlashtir\w*|sekinroq)\b/.test(text)) return { delta: -0.25 };
  return {};
}

const VIDEO_ACTION_RULES = [
  {
    tool: "pause_video",
    match: (t) => /\b(to'xtat\w*|pauza|stop|pause)\b/.test(t),
    negative: (t) => /\bto'xtatma\w*\b|\bto'xtatib\s*qo'yma\b|\bpauza\s*qilma(ng)?\b|\bstop\s*qilma(ng)?\b|\bpause\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\bmashinani\s*to'xtat/.test(t), // tadqiqot: AMBIGUOUS FORM
    risk: "SAFE_MATCH",
  },
  {
    tool: "play_video",
    match: (t) => /\b(play|pley|boshla\w*|davom\s*ettir\w*|qo'y\w*)\b/.test(t),
    negative: (t) => /\bqo'yma\b|\bboshlama\b|\bdavom\s*ettirma\b|\bplay\s*qilma(ng)?\b/.test(t),
    // "qo'y" o'zi juda noaniq (pulni qo'y, joyiga qo'y) — CONTEXT_REQUIRED (tadqiqot Section 4)
    exclude: (t) => /\b(pulni|joyiga|stolga|joyida)\s*qo'y/.test(t),
    requireContext: (t) =>
      /\b(play|pley|boshla\w*|davom\s*ettir\w*)\b/.test(t) || // bu ildizlar o'z-o'zidan xavfsiz
      /\b(video\w*|kino\w*|film\w*)\b/.test(t) ||              // yoki "video/kino" so'zi bilan birga
      t.split(" ").filter(Boolean).length <= 2,                // yoki juda qisqa buyruq ("qo'y")
    risk: "CONTEXT_REQUIRED",
  },
  {
    tool: "mute",
    match: (t) => hasAll(t, [/\bovoz(ini)?\b/, /\bo'chir\w*\b/]) || /\b(mute|myut|bezshumniy)\b/.test(t),
    negative: (t) => /\bovozini\s*o'chirma\b|\bmute\s*qilma(ng)?\b|\bbezshumniy\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\b(chiroqni|svetni|televizorni)\s*o'chir/.test(t), // AMBIGUOUS FORM
    risk: "SAFE_MATCH",
  },
  {
    tool: "unmute",
    match: (t) => hasAll(t, [/\bovoz(ini)?\b/, /\b(yoq\w*|chiqar\w*)\b/]) || /\b(unmute|anmyut)\b/.test(t),
    negative: (t) => /\bovozini\s*yoqma\b|\bunmute\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\b(svetni|chiroqni|televizorni)\s*yoq/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "increase_volume",
    match: (t) => hasAll(t, [/\b(ovoz(ini)?|gromkost\w*|volume)\b/, /\b(ko'tar\w*|oshir\w*|balandlat\w*)\b/]) || /\bgromche\b/.test(t),
    negative: (t) => /\bovozini\s*ko'tarma\b|\bbalandlatma\b|\bgromkostni\s*oshirma\b/.test(t),
    exclude: (t) => /\b(narxini|sifatini)\s*(ko'tar|oshir)/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "decrease_volume",
    match: (t) => hasAll(t, [/\b(ovoz(ini)?|gromkost\w*|volume)\b/, /\b(pasaytir\w*|tushir\w*|sekinlat\w*)\b/]) || /\btishe\b/.test(t),
    negative: (t) => /\bovozini\s*pasaytirma\b|\bsekinlatma\b|\bgromkostni\s*tushirma\b/.test(t),
    exclude: (t) => /\bnarxini\s*tushir/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "seek_forward",
    match: (t) => /\b(oldinga\w*|ilgariga\w*|vpered|forward|skip)\b/.test(t),
    negative: (t) => /\boldinga\s*o'tkazma\b|\bilgariga\s*surma\b|\bskip\s*qilma(ng)?\b/.test(t),
    exclude: () => false,
    extractParam: extractSeekSeconds,
    risk: "CONTEXT_REQUIRED",
  },
  {
    tool: "seek_backward",
    match: (t) => /\b(orqaga\w*|nazad|rewind|back)\b/.test(t),
    negative: (t) => /\borqaga\s*qaytarma\b|\borqaga\s*surma\b|\bnazad\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\b(gapingni|pulni)\s*qaytar/.test(t),
    extractParam: extractSeekSeconds,
    risk: "CONTEXT_REQUIRED",
  },
  {
    tool: "set_playback_speed",
    match: (t) => /\b(skorost\w*|speed\w*|tezlik\w*|tezlashtir\w*|sekinlashtir\w*|tezroq|sekinroq)\b/.test(t) || /\b\d+(?:\.\d+)?\s*x\b/.test(t),
    negative: (t) => /\btezlashtirma\b|\bsekinlashtirma\b|\bskorostni\s*oshirma\b/.test(t),
    exclude: (t) => /\b(mashina|internet)\s*tezlig/.test(t),
    extractParam: extractSpeedParams,
    risk: "SAFE_MATCH",
  },
  {
    tool: "toggle_fullscreen",
    match: (t) => /\b(full\s*screen|fulskrin|to'liq\s*ekran\w*|ves\s*ekran|katta\s*ekran)\b/.test(t),
    negative: (t) => /\bkatta\s*qilma\b|\bto'liq\s*ekranga\s*o'tkazma\b|\bfulskrin\s*qilma(ng)?\b/.test(t),
    exclude: () => false,
    risk: "SAFE_MATCH",
  },
  {
    tool: "next_episode",
    match: (t) => /\b(keyingi\w*|next|sledushiy|dalshe)\b/.test(t),
    negative: (t) => /\bkeyingisiga\s*o'tma\b|\bnext\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\bkeyingi\s*(safar|xona|gal)\b/.test(t), // AMBIGUOUS FORM
    risk: "SAFE_MATCH",
  },
  {
    tool: "previous_episode",
    match: (t) => /\b(oldingi\w*|avvalgi\w*|prev\w*|predidushchiy)\b/.test(t),
    negative: (t) => /\boldingisiga\s*o'tma\b|\bprev\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\boldingi\s*(safar|uy|gal)\b/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "restart_episode",
    match: (t) => /\b(boshidan\w*|restart\w*|zanovo)\b/.test(t) || /\bs\s*samogo\s*nachala\b/.test(t),
    negative: (t) => /\bboshidan\s*qo'yma\b|\bqaytadan\s*boshlama\b|\brestart\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\b(hayotni|ishni)\s*boshidan\b/.test(t), // AMBIGUOUS FORM
    risk: "SAFE_MATCH",
  },
];
```

### 5.3 Video bilan bog'liq bo'lmagan eski amallar (o'zgarishsiz saqlanadi)

Bular (subtitr, PiP, teatr rejim, sahifa navigatsiyasi) tadqiqot doirasidan tashqarida — ular uchun yangi lingvistik ma'lumot yig'ilmagan, shuning uchun mavjud shakli saqlanadi, faqat `\b` chegarasi qo'shilib xavfsizlashtirildi. **Muhim tuzatish:** `go_back` ("orqaga qayt") ilgari `seek_backward` bilan to'qnashardi — video-buyruq tizimida "orqaga" birinchi navbatda video kontekstida ishlatiladi, shuning uchun `go_back` triggeri sahifa-navigatsiyasiga xos so'zga toraytirildi (tadqiqot Part 14: semantik kolliziya).

```javascript
const NON_VIDEO_KEYWORD_PATTERNS = [
  { pattern: /\btinglashni\s*to'xtat\b|\bmikrofonni\s*o'chir\b/, tool: "stop_listening" },
  { pattern: /\bto'liq\s*ekrandan\s*chiq\b|\bto'liq\s*ekranni\s*o'chir\b/, tool: "exit_fullscreen" },
  { pattern: /\bsubtitr\w*\s*o'chir\b|\btarjima\w*\s*o'chir\b/, tool: "disable_captions" },
  { pattern: /\bsubtitr\w*\s*yoq\b|\btarjima\w*\s*yoq\b/, tool: "enable_captions" },
  { pattern: /\bsubtitr\w*\b|\btarjima\s*matni\b/, tool: "toggle_captions" },
  { pattern: /\bkichik\s*oyna\b|\bpip\s*rejim\b/, tool: "toggle_picture_in_picture" },
  { pattern: /\bteatr\s*rejim\b/, tool: "toggle_theater_mode" },
  { pattern: /\bpleerni\s*yop\b|\bvideoni\s*yop\b/, tool: "close_player" },
  { pattern: /\bpastga\s*tushir\b|\bpastga\s*scroll\b/, tool: "scroll_down" },
  { pattern: /\byuqoriga\s*ko'tar\b|\byuqoriga\s*scroll\b/, tool: "scroll_up" },
  { pattern: /\bboshiga\s*qayt\b/, tool: "scroll_to_top" },
  { pattern: /\boxiriga\s*(o't|tush)\w*\b/, tool: "scroll_to_bottom" },
  { pattern: /\boldingi\s*sahifaga\s*qayt\b|\bsahifadan\s*chiq\b/, tool: "go_back" }, // toraytirilgan — 5.3 izohiga qarang
  { pattern: /\bsahifani\s*yangila\b/, tool: "refresh_page" },
  { pattern: /\bbosh\s*sahifa\b/, tool: "go_home" },
  { pattern: /\bsevimlilar\w*\s*sahifa\b/, tool: "open_favorites_page" },
  { pattern: /\bqidiruv\s*sahifa\b/, tool: "open_search_page" },
  { pattern: /\bprofil\w*\s*sahifa\b/, tool: "open_profile_page" },
];
```

### 5.4 Yakuniy funksiya — `tryFastPath`

```javascript
function tryFastPath(rawText) {
  const text = normalizeUzbekSTT(rawText);
  if (!text) return null;

  // 1) Video amallari — inkor va kolliziya himoyasi bilan
  for (const rule of VIDEO_ACTION_RULES) {
    if (rule.exclude(text)) continue;
    if (rule.negative(text)) continue; // inkor aniqlandi → ishonchsiz, backend LLM'ga yuboriladi
    if (rule.requireContext && !rule.requireContext(text)) continue;
    if (rule.match(text)) {
      const params = rule.extractParam ? rule.extractParam(text) : {};
      return { tool: rule.tool, params };
    }
  }

  // 2) Video bilan bog'liq bo'lmagan navigatsiya/UI amallari
  for (const { pattern, tool } of NON_VIDEO_KEYWORD_PATTERNS) {
    if (pattern.test(text)) return { tool, params: {} };
  }

  return null; // mos kelmadi → QATLAM 1/2 (backend LLM) ishlaydi
}
```

Bu funksiya avvalgi `tryFastPath` bilan **bir xil interfeys**ni saqlaydi (`{ tool, params } | null`), shuning uchun 1.5- va 6-bo'limlardagi qolgan kod (`voiceInput.onResult`, `executeToolWithConfirmation`) o'zgarishsiz ishlayveradi.

### 5.5 Aniqlik va xavf darajasi — tadqiqot xulosasi

| Sharoit | Taxminiy to'g'ri ishlash | Izoh |
|---|---|---|
| Sokin joy, sof o'zbekcha, oddiy buyruq | ~92–97% | Tajribaviy baho, real audio bilan sinovdan o'tmagan |
| Sokin joy, rus/ingliz aralash buyruq | ~85–93% | Kod-almashish lug'ati (pauza, gromkost, skip, next) qamrab olingan |
| O'rtacha shovqin, tabiiy uzun gap | ~80–90% | — |
| Shovqinli joy yoki kutilmagan ifoda | ~60–75% | Bunday holatlarda tizim QATLAM 1/2 (backend LLM) ga tushib, sekinroq lekin baribir ishlaydi |
| Kam uchraydigan dialektal shakl | ~40–60% | Faqat Tashkent/Farg'ona standart nutqi qamrab olingan; Xorazm/Qoraqalpoq shakllari QATLAM 0'da yo'q — LLM fallback orqali yopiladi |

> **Muhim:** bu raqamlar statistik o'lchov emas — to'rtta mustaqil tadqiqot sintezida bir-birini tasdiqlagan taxmindir (tadqiqot hujjati, "Research Completeness & Audit Report"). Real foydalanuvchi audiosi bilan A/B test qilinmaguncha yakuniy son sifatida ishlatilmasligi kerak.

**Arxitektura tanlovi asosi:** loyihada allaqachon qo'llanilayotgan **bitta STT (Mohir/UzbekVoice.ai) + lokal normalizatsiya + qoidaviy moslashtirgich** yondashuvi — tadqiqotning "Architecture A" tavsiyasiga to'g'ri keladi: parallel ikkita STT ishlatish tarmoq va xarajatni 2 baravar oshiradi, lekin aniqlikni sezilarli oshirmaydi (tadqiqot Section 1, Question 6). Til aniqlash (language detection) qatlami ham qo'shilmadi, chunki qisqa, kod-almashgan buyruqlarda til-ID ko'pincha noto'g'ri ishlaydi (masalan, Whisper qisqa o'zbekcha audioni turkcha/qozoqcha deb noto'g'ri aniqlashi mumkin — tadqiqot Question 4).

---

## 6. QATLAM 3 — Markaziy dispatcher

### 6.1 Faol video pleerni olish (ko'p `<video>` bo'lganda ham xavfsiz)

```javascript
function getActivePlayer() {
  const player = document.querySelector('video[data-role="main-player"]');
  if (!player) { console.warn("Faol video pleer topilmadi"); return null; }
  return player;
}
```

### 6.2 A-toifa: Sof frontend (playback + navigatsiya)

```javascript
const PLAYBACK_HANDLERS = {
  pause_video: () => getActivePlayer()?.pause(),
  play_video: () => getActivePlayer()?.play().catch((e) => console.warn("Play xato:", e)),
  seek_forward: ({ seconds = 10 }) => {
    const p = getActivePlayer();
    if (p) p.currentTime = Math.min(p.duration || Infinity, p.currentTime + seconds);
  },
  seek_backward: ({ seconds = 10 }) => {
    const p = getActivePlayer();
    if (p) p.currentTime = Math.max(0, p.currentTime - seconds);
  },
  seek_to_time: ({ seconds }) => { const p = getActivePlayer(); if (p) p.currentTime = seconds; },
  set_volume: ({ value }) => { const p = getActivePlayer(); if (p) p.volume = Math.min(1, Math.max(0, value / 100)); },
  increase_volume: ({ step = 0.1 }) => { const p = getActivePlayer(); if (p) p.volume = Math.min(1, p.volume + step); },
  decrease_volume: ({ step = 0.1 }) => { const p = getActivePlayer(); if (p) p.volume = Math.max(0, p.volume - step); },
  mute: () => { const p = getActivePlayer(); if (p) p.muted = true; },
  unmute: () => { const p = getActivePlayer(); if (p) p.muted = false; },

  toggle_fullscreen: () => {
    if (!document.fullscreenEnabled) return console.warn("Fullscreen qo'llab-quvvatlanmaydi");
    document.fullscreenElement ? document.exitFullscreen() : getActivePlayer()?.requestFullscreen();
  },
  enter_fullscreen: () => getActivePlayer()?.requestFullscreen(),
  exit_fullscreen: () => document.fullscreenElement && document.exitFullscreen(),

  toggle_picture_in_picture: () => {
    if (!document.pictureInPictureEnabled) return console.warn("PiP qo'llab-quvvatlanmaydi");
    document.pictureInPictureElement
      ? document.exitPictureInPicture()
      : getActivePlayer()?.requestPictureInPicture().catch((e) => console.warn("PiP xato:", e));
  },
  exit_picture_in_picture: () => document.pictureInPictureElement && document.exitPictureInPicture(),

  toggle_captions: () => {
    const track = getActivePlayer()?.textTracks?.[0];
    if (track) track.mode = track.mode === "showing" ? "hidden" : "showing";
  },
  enable_captions: () => { const t = getActivePlayer()?.textTracks?.[0]; if (t) t.mode = "showing"; },
  disable_captions: () => { const t = getActivePlayer()?.textTracks?.[0]; if (t) t.mode = "hidden"; },

  toggle_theater_mode: () => document.body.classList.toggle("theater-mode"),
  close_player: () => history.back(),
  set_playback_speed: ({ speed }) => { const p = getActivePlayer(); if (p) p.playbackRate = speed; },
  restart_episode: () => { const p = getActivePlayer(); if (p) p.currentTime = 0; },
  next_episode: () => { /* route orqali keyingi qism sahifasiga o'tadi */ },
  previous_episode: () => { /* xuddi shunday */ },

  scroll_down: ({ amount = "normal" }) => window.scrollBy({ top: { small: 200, normal: 500, large: 1000 }[amount], behavior: "smooth" }),
  scroll_up: ({ amount = "normal" }) => window.scrollBy({ top: -{ small: 200, normal: 500, large: 1000 }[amount], behavior: "smooth" }),
  scroll_to_top: () => window.scrollTo({ top: 0, behavior: "smooth" }),
  scroll_to_bottom: () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
  go_back: () => history.back(),
  refresh_page: () => location.reload(),
  go_home: () => location.href = "/",
  open_favorites_page: () => location.href = "/favorites/",
  open_search_page: () => location.href = "/search/",
  open_profile_page: () => location.href = "/profile/",
  stop_listening: () => { voiceInput.stop(); voiceOverlay.hide(); },
};
```

### 6.3 B-toifa: Backend API (CSRF, encoding, xato boshqaruvi bilan)

```javascript
function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}

async function apiRequest(url, { method = "GET", body } = {}) {
  const options = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (method !== "GET") options.headers["X-CSRFToken"] = getCsrfToken();
  if (body) options.body = JSON.stringify(body);

  let response;
  try { response = await fetch(url, options); }
  catch (e) { showErrorToast("Internetga ulanishda muammo."); throw e; }

  if (response.status === 401) { showErrorToast("Tizimga qayta kiring."); location.href = "/login/"; return null; }
  if (response.status === 404) { showErrorToast("Topilmadi."); return null; }
  if (!response.ok) { showErrorToast("Xatolik yuz berdi."); return null; }

  try { return await response.json(); } catch { return null; }
}

const apiGet = (url) => apiRequest(url);
const apiPost = (url, body) => apiRequest(url, { method: "POST", body });
const apiDelete = (url) => apiRequest(url, { method: "DELETE" });

const API_HANDLERS = {
  add_to_favorites: (p) => apiPost("/api/favorites/", p),
  remove_from_favorites: (p) => apiDelete(`/api/favorites/${encodeURIComponent(p.title)}/`),
  show_favorites: () => apiGet("/api/favorites/"),

  search_content: (p) => apiGet(`/api/search/?query=${encodeURIComponent(p.query)}&content_type=${encodeURIComponent(p.content_type)}`),
  select_search_result: (p) => openContentFromLastResults(p.index),
  filter_by_genre: (p) => apiGet(`/api/genres/${encodeURIComponent(p.genre)}/content/`),
  show_trending: () => apiGet("/api/trending/"),
  show_new_releases: () => apiGet("/api/new-releases/"),
  get_recommendations: (p) => apiGet(`/api/recommendations/?title=${encodeURIComponent(p.based_on)}`),
  sort_content: (p) => apiGet(`/api/content/?sort=${encodeURIComponent(p.criteria)}`),

  open_content: (p) => location.href = `/content/${encodeURIComponent(p.title)}/`,
  show_content_details: (p) => apiGet(`/api/content/details/?title=${encodeURIComponent(p.title)}`),
  list_episodes: (p) => apiGet(`/api/series/${encodeURIComponent(p.series_title)}/episodes/`),

  resume_watching: () => apiGet("/api/watch-progress/resume/"),
  show_continue_watching: () => apiGet("/api/watch-progress/continue-watching/"),
  show_watch_history: () => apiGet("/api/watch-progress/history/"),
  mark_as_watched: (p) => apiPost("/api/watch-progress/mark-watched/", p),
  remove_from_continue_watching: (p) => apiDelete(`/api/watch-progress/${encodeURIComponent(p.title)}/`),
  clear_watch_history: () => apiDelete("/api/watch-progress/"),

  rate_content: (p) => apiPost("/api/ratings/", p),
  add_comment: (p) => apiPost("/api/comments/", p),
  show_comments: (p) => apiGet(`/api/comments/?title=${encodeURIComponent(p.title)}`),
  delete_comment: (p) => apiDelete(`/api/comments/${p.comment_id}/`),

  share_content: (p) => apiGet(`/api/share/?title=${encodeURIComponent(p.title)}`),
  report_problem: (p) => apiPost("/api/reports/", p),

  check_login_status: () => apiGet("/api/auth/status/"),
  logout: () => apiPost("/api/auth/logout/", {}),
};
```

### 6.4 Yagona kirish nuqtasi

```javascript
const TOOL_DISPATCH = { ...PLAYBACK_HANDLERS, ...API_HANDLERS };

async function executeTool(toolName, params, backendSpeak) {
  const handler = TOOL_DISPATCH[toolName];
  if (!handler) {
    console.warn(`Noma'lum tool: ${toolName}`);
    showErrorToast("Bu buyruq qo'llab-quvvatlanmaydi.");
    return;
  }
  const result = await handler(params);
  speakResult(toolName, params, backendSpeak);
  return result;
}
```

---

## 7. Video striming integratsiyasi (Go Streamer)

### 7.1 Arxitektura

```
Brauzer  →  Django (/v1/movie/{id}/stream/)  →  302 redirect  →  Go Streamer  →  Telegram (MTProto)
```

Frontend **hech qachon Go server manzilini** (`http://SERVER_IP:8081/...`) qattiq yozmaydi — faqat Django URL'idan foydalanadi. Django, redirect orqali, brauzerni avtomatik Go serverga yo'naltiradi.

### 7.2 Video pleyer komponenti — to'liq, xato boshqaruvi bilan

```jsx
function MoviePlayer({ movieId }) {
  const [error, setError] = React.useState(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const videoRef = React.useRef(null);

  const streamUrl = `/v1/movie/${movieId}/stream/`;

  const handleError = () => {
    if (retryCount < 1) {
      // 502/503 — Telegram tomonidan vaqtinchalik muammo bo'lishi mumkin, bir marta avtomatik qayta urinish
      setRetryCount((c) => c + 1);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.load();
      }, 1500);
    } else {
      setError("Video hozircha mavjud emas. Birozdan so'ng qayta urinib ko'ring.");
    }
  };

  if (error) {
    return <div className="video-error">{error}</div>;
  }

  return (
    <video
      ref={videoRef}
      data-role="main-player"
      controls
      width="100%"
      preload="metadata"
      onError={handleError}
      onWaiting={() => showLoadingIndicator(true)}
      onPlaying={() => showLoadingIndicator(false)}
    >
      <source src={streamUrl} type="video/mp4" />
      Brauzeringiz video tegini qo'llab-quvvatlamaydi.
    </video>
  );
}
```

> **Muhim:** `data-role="main-player"` atributi — 6.1-banddagi `getActivePlayer()` funksiyasi uchun majburiy. Bu, ovozli buyruqlar (`pause_video`, `seek_forward` va h.k.) qaysi videoni boshqarishini aniq bildiradi.

### 7.3 Seek — qo'shimcha kod shart emas

Seek (oldinga/orqaga surish), HTML5 videoning standart xatti-harakati — brauzer o'zi `Range` header bilan so'rov yuboradi, server tegishli qismni qaytaradi. `seek_forward`/`seek_backward` tool'lari, shunchaki `player.currentTime`ni o'zgartiradi (6.2-bandga qarang) — qolgani avtomatik.

### 7.4 Xato kodlari va frontend reaktsiyasi

| HTTP kod | Sabab | Frontend harakati |
|---|---|---|
| `400` | Dasturiy xato (channel/message_id yo'q) | Odatiy foydalanishda chiqmaydi, logga yozish |
| `404` | Video topilmadi | "Video mavjud emas" xabari |
| `416` | Range fayl hajmidan katta | Videoni qayta yuklash (`video.load()`) |
| `502` / `503` | Telegram/bot vaqtinchalik muammosi | **1 marta avtomatik retry** (1.5s kutib), keyin xabar |

### 7.5 Yuklab olish tugmasi (ixtiyoriy)

```html
<a href="/v1/movie/1/stream/" download="film.mp4">Yuklab olish</a>
```

### 7.6 Cheklovlar (frontend bilishi kerak)

- Sifat tanlovi (720p/1080p) yo'q — faqat original fayl beriladi
- Subtitr/ko'p audio-yo'l — backendda hozircha yo'q
- Server 1 ta Telegram bot bilan ishlaydi — yuqori yuklamada `502` ehtimoli bor, shuning uchun 7.4-banddagi retry mantiqi **majburiy**

---

## 8. Ruxsat va brauzer moslik tekshiruvi

```javascript
async function initVoiceControl() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showErrorToast("Brauzeringiz ovozli boshqaruvni qo'llab-quvvatlamaydi.");
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch (err) {
    showErrorToast(
      err.name === "NotAllowedError"
        ? "Ovozli boshqaruv uchun mikrofonga ruxsat bering."
        : "Mikrofonga ulanib bo'lmadi."
    );
    return false;
  }

  window.__voiceControlCapabilities = {
    fullscreen: document.fullscreenEnabled,
    pip: document.pictureInPictureEnabled,
    tts: "speechSynthesis" in window,
  };

  return true;
}
```

---

## 9. Hammasini birlashtirish — yakuniy oqim

```javascript
let voiceInput;
let socket;

async function bootVoiceControl() {
  const ready = await initVoiceControl();
  if (!ready) return;

  socket = new AgentSocket({
    onToolCall: (tool, params, speakText) => {
      voiceOverlay.setState("listening");
      executeToolWithConfirmation(tool, params);
    },
    onClarify: (question) => {
      voiceOverlay.setState("listening");
      voiceOverlay.setCaption(question);
      speak(question);
    },
    onError: (msg) => showErrorToast(msg),
    onStatusChange: (status) => updateConnectionIndicator(status),
  });

  voiceInput.onResult = (text) => {
    voiceOverlay.setCaption(text);
    if (tryConfirmationFastPath(text)) return;

    const fastResult = tryFastPath(text);
    if (fastResult) {
      executeToolWithConfirmation(fastResult.tool, fastResult.params);
    } else {
      voiceOverlay.setState("thinking");
      socket.send(text, getCurrentFrontendState());
    }
  };
}

// Mikrofon tugmasi bosilganda chaqiriladi
document.getElementById("mic-button")?.addEventListener("click", () => {
  voiceOverlay.show();
  voiceOverlay.setState("listening");
  voiceInput.start();
});
```

---

## 10. To'liq funksiya/tool ro'yxati

| Kategoriya | Funksiya nomi | Bajarilish joyi | LLM tool'mi? |
|---|---|---|---|
| Playback | `pause_video`, `play_video`, `seek_forward`, `seek_backward`, `seek_to_time`, `set_volume`, `increase_volume`, `decrease_volume`, `mute`, `unmute`, `toggle_fullscreen`, `enter_fullscreen`, `exit_fullscreen`, `toggle_picture_in_picture`, `exit_picture_in_picture`, `toggle_captions`, `enable_captions`, `disable_captions`, `toggle_theater_mode`, `close_player`, `set_playback_speed`, `restart_episode`, `next_episode`, `previous_episode` | Qatlam 0 → DOM | ❌ Yo'q |
| Navigatsiya | `scroll_down`, `scroll_up`, `scroll_to_top`, `scroll_to_bottom`, `go_back`, `refresh_page`, `go_home`, `open_favorites_page`, `open_search_page`, `open_profile_page`, `stop_listening` | Qatlam 0 → DOM | ❌ Yo'q |
| Qidiruv | `search_content`, `select_search_result`, `filter_by_genre`, `show_trending`, `show_new_releases`, `get_recommendations`, `sort_content` | Qatlam 1-3 → API | ✅ Ha |
| Kontent sahifasi | `open_content`, `show_content_details`, `list_episodes` | Qatlam 1-3 → API | ✅ Ha |
| Sevimlilar | `add_to_favorites`, `remove_from_favorites` ⚠️, `show_favorites` | Qatlam 1-3 → API | ✅ Ha |
| Tomosha progressi | `resume_watching`, `show_continue_watching`, `show_watch_history`, `mark_as_watched`, `remove_from_continue_watching` ⚠️, `clear_watch_history` ⚠️ | Qatlam 1-3 → API | ✅ Ha |
| Baholash/izoh | `rate_content`, `add_comment`, `show_comments`, `delete_comment` ⚠️ | Qatlam 1-3 → API | ✅ Ha |
| Ulashish/muammo | `share_content`, `report_problem` | Qatlam 1-3 → API | ✅ Ha |
| Hisob | `check_login_status`, `logout` ⚠️ | Qatlam 1-3 → API | ✅ Ha |

⚠️ = tasdiqlash talab qiladi. **Jami: 34 frontend-only + 24 LLM tool = 58 funksiya.**

---

## 11. Production checklist

- [ ] Mikrofon ruxsati rad etilganda tushunarli xabar
- [ ] WebSocket avtomatik qayta ulanishi (backoff bilan)
- [ ] Xavfli amallar tasdiqlashsiz ishlamasligi
- [ ] CSRF token har bir POST/DELETE'da
- [ ] 401 → login sahifasiga yo'naltirish
- [ ] Qidiruvda maxsus belgilar encode qilinishi
- [ ] Fullscreen/PiP qo'llab-quvvatlanmasa, jim xato (crash yo'q)
- [ ] TTS o'chirib qo'yish imkoniyati
- [ ] Ko'p `<video>` bo'lganda faqat faol pleer boshqarilishi (`data-role="main-player"`)
- [ ] Clarify-javob to'g'ri kontekstga bog'lanishi (`session_id`)
- [ ] **Voice overlay 4 holati (`idle/listening/thinking/speaking`) to'g'ri almashishi**
- [ ] **Video striming — 502/503'da 1 marta avtomatik retry**
- [ ] Video pleyerda `data-role="main-player"` va `preload="metadata"` borligi

---

## 12. Xulosa

Bu hujjat — loyihaning uch qismini (ovozli boshqaruv arxitekturasi, video striming, va vizual overlay) yagona, izchil, production-ready ko'rinishga keltiradi:

- **34 playback/navigatsiya funksiyasi** — to'liq frontendda, LLM'ga bormasdan
- **24 haqiqiy LLM tool** — WebSocket orqali backend'ga
- **Gemini-uslubidagi voice overlay** — 4 aniq holat (idle/listening/thinking/speaking) bilan, foydalanuvchiga doimo nima bo'layotganini ko'rsatadi
- **Go streamer integratsiyasi** — Django orqali xavfsiz redirect, avtomatik seek, xato holatlarida retry
- **Xavfsizlik va barqarorlik** — CSRF, tasdiqlash qatlami, WebSocket qayta ulanish, brauzer moslik tekshiruvi

Dasturchi, shu hujjatdagi kod skeletlarini asos qilib, to'g'ridan-to'g'ri loyihaga integratsiya qila oladi.
