# Ovozli Video Pleer - Frontend Qo'llanmasi

Ushbu qo'llanma `index.html` faylida yozilgan frontend qismi qanday ishlashini to'liq tushuntirib beradi. Bu frontend asosan foydalanuvchi ovozini eshitish, uni matnga o'girish (STT) va backend'dan kelgan buyruqlar asosida video pleerni boshqarish uchun mo'ljallangan.

## 1. Asosiy Arxitektura va Oqim

Frontend va Backend o'rtasidagi to'liq ishlash sikli quyidagicha:

1. **Mikrofon (MediaRecorder)** ovozni eshitadi.
2. **VAD (Voice Activity Detection)** foydalanuvchi gapirishni to'xtatganini (jimlikni) aniqlaydi.
3. Audio kesib olinadi va to'g'ridan-to'g'ri **Mohir.ai API** (yoki Whisper) ga yuboriladi.
4. STT dan qaytgan o'zbekcha matn **WebSocket** orqali Backend (Django Channels) ga yuboriladi.
5. Backend'dagi **LLM (Groq)** matnni tahlil qilib, qanday harakat qilish kerakligini hal qiladi va JSON formatida javob qaytaradi (masalan: `{"action": "pause_video"}`).
6. Frontend kelgan harakatni (action) o'qiydi va **Action Dispatcher** orqali HTML5 Video API ni boshqaradi (videoni to'xtatadi, o'tkazadi va h.k).

---

## 2. Audio Yozish va VAD (Jimjitlikni aniqlash)

Biz foydalanuvchi qachon gapirib bo'lganini bilishimiz uchun tugmani qayta bosishini kutmaymiz. Buning uchun Web Audio API va AnalyserNode ishlatilgan.

- **SILENCE_THRESHOLD = 20**: Ovoz darajasi shu sondan past bo'lsa, tizim buni "jimlik" deb qabul qiladi.
- **SILENCE_DURATION = 1500**: Ovozdan keyin 1.5 soniya (1500ms) jimlik kuzatilsa, tizim gapirish tugadi deb hisoblaydi va yozishni to'xtatib, audioni serverga jo'natadi.

**Asosiy funksiyalar:**
- `initAudio()`: Mikrofonni brauzerdan ruxsat so'rab yoqadi.
- `startVADMonitoring()`: Har bir freymda (`requestAnimationFrame`) ovoz balandligini tekshiradi.
- `getAudioLevel()`: `AnalyserNode` orqali audioning joriy balandligini 0 dan 100 gacha oraliqda qaytaradi.

---

## 3. Mohir.ai STT bilan ishlash (Ovozni matnga o'girish)

Audio yozib olingandan so'ng (`MediaRecorder.onstop`), `.webm` formatidagi audio fayl bevosita frontendning o'zidan **Mohir.ai** xizmatiga yuboriladi.

*Nega bevosita frontenddan?* Backend'ga yuborib, u yerdan API'ga yuborish qo'shimcha vaqt (latency) oladi. Frontenddan to'g'ridan-to'g'ri STT API'ga so'rov tashlash javob vaqtini (0.5 - 1 soniyagacha) qisqartiradi.

**API So'rov qismi:**
```javascript
const formData = new FormData();
formData.append('file', audioBlob, 'recording.webm');
formData.append('language', 'uz');
formData.append('model', 'enhanced-stt');
formData.append('blocking', 'true'); // Javobni darhol kutish
```
*Eslatma: Agar CORS xatoligi yuz bersa (lokal fayl sifatida ochilganda), sahifani `Live Server` kabi lokal HTTP server orqali ochish tavsiya etiladi.*

---

## 4. WebSocket va LLM aloqasi

Matn olingach, backend'ga WebSocket (`ws://.../ws/agent/test/`) orqali yuboriladi. 
Backend'dan 3 xil turdagi javob kelishi mumkin:

1. `status` (state: "thinking") - LLM o'ylayotganini bildiradi. Frontendda "O'ylayapman..." yozuvi chiqadi.
2. `action` - LLM qaror qabul qildi va harakat jo'natdi.
3. `error` - Qandaydir xatolik yuz berdi (masalan, LLM nima qilishni bilmadi).

---

## 5. Action Dispatcher (Harakatlar Ijrochisi)

Backend'dan `action` kelganida, `dispatchAction(actionName, params)` funksiyasi ishga tushadi.
Bu funksiya asosan `<video id="player">` tegi bilan ishlaydi.

**Qo'llab-quvvatlanadigan buyruqlar (Actions):**
- `pause_video`: `video.pause()`
- `play_video`: `video.play()`
- `seek_forward` / `seek_backward`: `video.currentTime += 10` yoki `-= 10`
- `seek_to_time`: `video.currentTime = params.seconds`
- `set_volume` / `mute` / `unmute`: `video.volume` qiymatini o'zgartiradi.
- `toggle_fullscreen`: Videoni to'liq ekranga o'tkazadi yoki qaytaradi.
- `scroll_down` / `scroll_up`: Sahifani o'qish uchun pastga/tepaga suradi.

---

## 6. Qanday ishga tushirish kerak?

1. `.env` yoki backend sozlamalarida kerakli API kalitlarni to'g'rilang.
2. Backend (Django) ni ishga tushiring: `python manage.py runserver`
3. Redis server ishlayotganiga ishonch hosil qiling (`docker run -p 6379:6379 redis`).
4. `index.html` faylini VS Code'dagi **Live Server** yoki boshqa lokal server orqali oching. To'g'ridan-to'g'ri `file:///` qilib ochmang, chunki bu WebSocket va API uchun CORS/Xavfsizlik xatoliklarini berishi mumkin.
5. "Mohir API Key" ni kiriting (yoki kodda qoldirilganidan foydalaning) va JWT Token bilan "Ulash" tugmasini bosing.
6. Mikrofonni bosib gapiring!
