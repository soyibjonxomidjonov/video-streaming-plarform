# Backend REST API — To'liq Hujjat

Bu hujjat, ovozli boshqaruv tizimi ishlashi uchun backend (Django REST Framework) taqdim etishi kerak bo'lgan **barcha API endpoint'larni** o'z ichiga oladi. Autentifikatsiya — Session/Token orqali (`credentials: "include"` frontenddan yuboriladi).

---

## 1. Qidiruv va kashfiyot

| Metod | Endpoint | Vazifasi | Query/Body |
|---|---|---|---|
| GET | `/api/search/` | Semantik qidiruv | `?query=...&content_type=movie\|series\|all` |
| GET | `/api/genres/{genre_name}/content/` | Janr bo'yicha filtr | — |
| GET | `/api/trending/` | Eng mashhur kontent | — |
| GET | `/api/new-releases/` | Yangi qo'shilganlar | — |
| GET | `/api/recommendations/` | Tavsiyalar | `?title=...` |
| GET | `/api/content/` | Saralash | `?sort=newest\|rating\|alphabetical\|popularity` |

**Javob namunasi** (`/api/search/`):
```json
{
  "results": [
    { "id": 45, "title": "Men robot emasman", "type": "movie", "year": 2004, "poster_url": "..." },
    { "id": 12, "title": "...", "type": "series", "year": 2019, "poster_url": "..." }
  ]
}
```

> **Muhim:** Frontend, qidiruv natijalarini (`results` massivini) lokal holatda (`lastSearchResults`) saqlashi kerak — chunki, foydalanuvchi "ikkinchisini och" desa, `select_search_result` tool'i shu ro'yxatdan indeks bo'yicha tanlaydi (bu, backend API emas, frontend-ichki mantiq).

---

## 2. Kontent sahifasi

| Metod | Endpoint | Vazifasi | Query/Body |
|---|---|---|---|
| GET | `/api/content/by-title/` | Nom bo'yicha ochish | `?title=...` |
| GET | `/api/content/details/` | Batafsil ma'lumot | `?title=...` |
| GET | `/api/series/{title}/episodes/` | Qismlar ro'yxati | — |

**Javob namunasi** (`/api/content/details/`):
```json
{
  "id": 45,
  "title": "Men robot emasman",
  "description": "...",
  "genre": ["Fantastika", "Triller"],
  "year": 2004,
  "rating": 4.3,
  "duration_minutes": 115,
  "video_url": "...",
  "poster_url": "..."
}
```

---

## 3. Sevimlilar

| Metod | Endpoint | Vazifasi | Body |
|---|---|---|---|
| POST | `/api/favorites/` | Qo'shish | `{ "title": "..." }` |
| DELETE | `/api/favorites/{title}/` | O'chirish | — |
| GET | `/api/favorites/` | Ro'yxatni ko'rish | — |

---

## 4. Tomosha progressi

| Metod | Endpoint | Vazifasi | Body |
|---|---|---|---|
| GET | `/api/watch-progress/resume/` | Davom ettirish (oxirgi joy) | — |
| GET | `/api/watch-progress/continue-watching/` | "Continue watching" ro'yxati | — |
| GET | `/api/watch-progress/history/` | To'liq tarix | — |
| POST | `/api/watch-progress/mark-watched/` | "Ko'rilgan" belgilash | `{ "title": "..." }` |
| DELETE | `/api/watch-progress/{title}/` | Bitta yozuvni olib tashlash | — |
| DELETE | `/api/watch-progress/` | Hammasini tozalash | — |

**Javob namunasi** (`/api/watch-progress/resume/`):
```json
{ "title": "Men robot emasman", "video_url": "...", "resume_at_seconds": 320 }
```

---

## 5. Baholash va izoh

| Metod | Endpoint | Vazifasi | Body |
|---|---|---|---|
| POST | `/api/ratings/` | Baho qo'yish | `{ "title": "...", "stars": 1-5 }` |
| POST | `/api/comments/` | Izoh qoldirish | `{ "title": "...", "text": "..." }` |
| GET | `/api/comments/` | Izohlarni ko'rish | `?title=...` |
| DELETE | `/api/comments/{comment_id}/` | Izohni o'chirish (o'ziniki) | — |

---

## 6. Ulashish / muammo

| Metod | Endpoint | Vazifasi | Body |
|---|---|---|---|
| GET | `/api/share/` | Ulashish linki | `?title=...` |
| POST | `/api/reports/` | Muammo xabari | `{ "title": "...", "issue_type": "...", "description": "..." }` |

---

## 7. Hisob

| Metod | Endpoint | Vazifasi | Body |
|---|---|---|---|
| GET | `/api/auth/status/` | Login holati | — |
| POST | `/api/auth/logout/` | Chiqish | — |

---

## 8. WebSocket endpoint (LLM agent uchun)

| Protokol | Endpoint | Vazifasi |
|---|---|---|
| WS | `/ws/agent/` | Ovozli buyruqlarni LLM'ga yuborish va `{tool, params}` javobini olish (Django Channels) |

**Kirish** (frontend → backend):
```json
{
  "type": "user_command",
  "text": "bunga besh baho qo'y",
  "frontend_state": {
    "content_type": "movie",
    "content_id": 45,
    "content_title": "Men robot emasman",
    "is_playing": true,
    "current_time_seconds": 320
  }
}
```

**Chiqish variant 1** (backend → frontend, tool aniqlangan):
```json
{ "type": "tool_call", "tool": "rate_content", "params": { "stars": 5, "title": "Men robot emasman" } }
```

**Chiqish variant 2** (backend → frontend, aniqlashtirish kerak):
```json
{ "type": "clarify", "question": "Qaysi filmga baho qo'yishni xohlaysiz?" }
```

> Bu WebSocket endpoint, yuqoridagi barcha REST endpoint'larni chaqirmaydi — u faqat, matnni LLM'ga uzatib, qaysi tool va parametrlar mosligini aniqlaydi. Haqiqiy ma'lumot almashinuvi (favorites qo'shish, baho qo'yish va h.k.) — frontend tomonidan, tegishli REST endpoint'ga alohida so'rov orqali amalga oshiriladi (yuqoridagi TOOL_TO_API/API_HANDLERS xaritasiga qarang).

---

## 9. Autentifikatsiya haqida eslatma

Barcha `/api/...` endpoint'lar (auth bilan bog'liq bo'lmaganlaridan tashqari, masalan `/api/trending/`), foydalanuvchi sessiyasini talab qiladi. Frontend, har bir `fetch()` so'rovida `credentials: "include"` yuborishi shart — shunda, brauzerning session cookie'si avtomatik yuboriladi va Django REST Framework, foydalanuvchini serverda avtomatik aniqlaydi (LLM/tool qatlamiga token yoki user obyektini uzatish shart emas).

---

## 10. Endpoint'lar soni bo'yicha xulosa

| Bo'lim | Endpoint soni |
|---|---|
| Qidiruv/kashfiyot | 6 |
| Kontent sahifasi | 3 |
| Sevimlilar | 3 |
| Tomosha progressi | 6 |
| Baholash/izoh | 4 |
| Ulashish/muammo | 2 |
| Hisob | 2 |
| WebSocket | 1 |
| **Jami** | **27** |

Bu — frontenddagi 40+ tool'ning barchasini qamrab oladi: playback/navigatsiya tool'lari (~23 dona) hech qanday backend chaqiruvini talab qilmaydi (to'g'ridan-to'g'ri DOM'da bajariladi), qolgan ~17-18 tasi esa, yuqoridagi 27 REST endpoint + 1 WebSocket orqali ta'minlanadi.
