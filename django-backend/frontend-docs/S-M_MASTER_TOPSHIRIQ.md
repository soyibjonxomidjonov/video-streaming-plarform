# S-M — Video Streaming Platformasi — TO'LIQ FRONTEND MASTER TOPSHIRIQ

> **Bu faylni o'qiyotgan AI uchun:** Sen video-streaming saytining frontendini noldan yakunlab, to'liq ovozli boshqaruvli qilib qurishing kerak. Bu hujjat — loyihaning YAGONA va TO'LIQ texnik topshirig'i. Foydalanuvchi senga shu fayl bilan birga eski loyiha zip'ini (`frontendv2`) ham tashlaydi — sen ULARNI BIRLASHTIRIB, quyida yozilgan hamma narsani amalga oshirasan. Hech narsani taxmin qilib o'tkazib yubormaslik kerak — quyida aniq sabab-oqibat, aniq API, aniq dizayn, aniq funksiyalar ro'yxati berilgan.

---

## 0. ENG MUHIM TOPILMA — nega "70% ishlamayapti"

Loyihaning ikki tarixiy versiyasi solishtirildi (`backend` GitHub repodagi `project-frontend-v0` — eski, va foydalanuvchi yuborgan zip `frontendv2` — yangi). Natija:

- **`components/*.tsx` fayllari ikkalasida bir xil** (bit-bo'yicha teng) — demak komponentlar to'g'ri va tayyor.
- **Yangi zip'da (`frontendv2`) — `app/` papkasi UMUMAN YO'Q.** Next.js (App Router) uchun `app/layout.tsx`, `app/page.tsx`, `app/globals.css` va boshqa barcha marshrut (route) fayllari yo'qolgan. Shuning uchun **hech qanday sahifa render bo'lmaydi** — sayt ochilganda deyarli bo'sh/xato ekran chiqadi. Bu "70% ishlamayapti"ning asosiy sababi: **kod xato emas, butun `app/` route-daraxti loyihadan tushib qolgan** (eski versiyadan yangisiga ko'chirishda unutilgan).
- Eski versiyada (`project-frontend-v0`) `app/` bor edi, lekin faqat 6 ta sahifa (`/`, `/watch/[type]/[id]`, `/admin`, `/profile`, `/login`, `/explore`, `/auth/callback`) va **eski `lib/`** (hozirgi backend bilan mos kelmasligi mumkin).
- Yangi zip'dagi `lib/` (api.ts, agent-socket.ts, voice-commands.ts, voice-tools.ts) — **hozirgi jonli backend bilan mos, yangilangan va ishlaydigan holatda** (quyida tasdiqlandi).

**XULOSA / VAZIFA:** Noldan `app/` route-daraxtini qur (quyidagi to'liq sayt xaritasi bo'yicha — eski 6 sahifadan ancha ko'p), mavjud `components/` va `lib/`ni ishlat (kerak bo'lsa kengaytir), va **hech qachon eski `lib/` yoki eski API mantig'ini qaytarma** — faqat pastda yozilgan JONLI API'ni ishlat.

---

## 1. Loyiha haqida

**Nomi:** S-M (Stream-M / StreamVibe uslubidagi video-striming platforma)
**Maqsad:** Netflix-uslubidagi film/serial striming sayti, **to'liq ovozli boshqaruv** bilan (Google Gemini overlay uslubidagi vizual indikator), Telegram-asosli video striming backendiga ulangan.

**Arxitektura:**
```
Brauzer (Next.js frontend)
   │
   ├── HTTP/JSON  →  Django REST API (JWT auth)  →  PostgreSQL + pgvector (semantik qidiruv)
   ├── WebSocket  →  Django Channels (/ws/agent/{session_id}/)  →  Groq LLM (tool-calling)
   └── <video src>→  Django (/v1/movie/{id}/stream/) → 302 redirect → Go Streamer (8081) → Telegram MTProto
```

Frontend **hech qachon** Go streamer manzilini (`SERVER_IP:8081`) yoki LLM'ni to'g'ridan-to'g'ri chaqirmaydi — hammasi Django orqali.

---

## 2. Texnologik stack (MAJBURIY — o'zgartirmaslik)

- **Next.js 16.3.0** (App Router, `app/` papka struktura) — e'tibor bering: bu Next.js versiyasi eski o'rgatilgan bilim bazangizdan farq qilishi mumkin (breaking changes bor, `node_modules/next/dist/docs/` ichida hujjat bor — agar mavjud bo'lsa avval o'sha hujjatni o'qing).
- **React 19**, TypeScript 5.7
- **Tailwind CSS v4** (`@tailwindcss/postcss`, CSS-first konfiguratsiya, `tailwind.config` fayli shart emas — `app/globals.css` ichida `@theme` bilan)
- `shadcn` (`components.json` allaqachon bor), `class-variance-authority`, `tailwind-merge`, `lucide-react` ikonkalar uchun
- Paket menejeri: `pnpm` (lock fayl mavjud) yoki `npm` — ikkalasi ham bor, `pnpm` afzal

---

## 3. Muhit sozlamalari (`.env`) — HOZIRGI ISHLAYOTGAN QIYMATLAR

```env
NEXT_PUBLIC_API_URL=https://backend.scholarmap.uz
NEXT_PUBLIC_STREAMER_HEALTH=https://backend.scholarmap.uz/health
NEXT_PUBLIC_VOICE_WS_URL=wss://backend.scholarmap.uz/ws/agent/{session_id}/
NEXT_PUBLIC_AI_WS_URL=wss://backend.scholarmap.uz/ws/agent/{session_id}/
NEXT_PUBLIC_GOOGLE_AUTH_URL=https://backend.scholarmap.uz/v1/auth/google/
```

> Server hozirda **HTTPS/WSS** orqali ishlayapti (domen: `backend.scholarmap.uz`). Swagger hujjatida ko'ringan `http://16.170.242.253:8000` — bu backend'ning xom IP-manzili/dev muhiti, faqat zaxira (`.env.example`) sifatida qoldirilgan. **Doim `.env`dagi domenni ishlat, IP'ni frontend kodida qattiq yozib qo'yma.**

`next.config.mjs`da allaqachon CORS'ni chetlab o'tish uchun proxy bor (`/api-proxy/*` → backend) — buni saqlab qol, chunki brauzerdagi barcha JSON so'rovlar shu proxy orqali ketadi (server-tomonda esa to'g'ridan-to'g'ri).

---

## 4. Backend REST API — JONLI, TASDIQLANGAN (v1, JWT)

> **DIQQAT:** Repo ichida yana bir hujjat bor — `django-backend/backend-docs/backend-api-docs.md` (`/api/search/`, `/api/favorites/` kabi, sessiya-asosli auth). **BU ESKI/REJALASHTIRISH HUJJATI, HOZIRGI JONLI API EMAS.** Haqiqiy, ishlayotgan API — quyidagi Swagger asosidagi `/v1/...` (DRF ViewSet, JWT Bearer token) API'dir. Faqat shuni ishlat.

**Base URL:** `{NEXT_PUBLIC_API_URL}/v1`
**Auth:** `Authorization: Bearer <token>` header (token — `/auth/code/verify/` javobidan olinadi, `localStorage`da `streamora_token` kaliti bilan saqlanadi — `lib/api.ts`da tayyor)

### 4.1 Auth
| Metod | Endpoint | Body | Izoh |
|---|---|---|---|
| POST | `/v1/auth/login/` | `{email}` | Emailga tasdiqlash kodi yuboradi. **Javob faqat `{"message": "..."}`, token YO'Q.** |
| POST | `/v1/auth/register/` | `{email, first_name, last_name, age}` | Ro'yxatdan o'tish, kod yuboriladi. **Javob faqat `{"message": "..."}`, token YO'Q.** |
| POST | `/v1/auth/code/verify/` | `{email, verify_code}` | Kodni tasdiqlaydi → **`{"refresh": "...", "access": "..."}` qaytaradi** — token FAQAT shu yerda keladi |
| POST | `/v1/auth/token/refresh/` | `{refresh}` | Yangi access token — `{"access": "..."}` |
| POST | `/v1/auth/token/verify/` | `{token}` | Tokenni tekshirish |
| POST | `/v1/auth/google/login` | `{id_token}` | `{"access", "refresh", "email", "first_name"}` qaytaradi |

### 4.1.1 Auth oqimi — backend kodidan (`login_view.py`) 1:1 tasdiqlangan, MAJBURIY ISHLATILSIN

⚠️ **Foydalanuvchi eslatgan "loginda field noto'g'ri yozilgan edi" muammosi — mana aniq sabab:**

`/v1/auth/code/verify/` javobida **`token` ham, `key` ham YO'Q — faqat `access` va `refresh` bor.** Agar frontendda avvalgi kodda `response.token` yoki `response.key` deb o'qilgan bo'lsa, u har doim `undefined` bo'lgan — shuning uchun login "muvaffaqiyatli" ko'rinib, lekin token saqlanmagan va foydalanuvchi aslida login qilmagan bo'lib chiqadi. **To'g'ri maydon nomi — `access`.**

```ts
const result = await api.verifyCode(email, code)   // { refresh: string, access: string }
setToken(result.access)                              // faqat shu ishlatilsin
// result.refresh ni ham saqlash kerak (pastga qara — hozir hech qayerda saqlanmayapti!)
```

**To'liq oqim:**
1. `/v1/auth/login/` (mavjud foydalanuvchi) YOKI `/v1/auth/register/` (ism/familiya/yosh bilan) chaqiriladi → serverda kod generatsiya qilinib, cache'ga (5 daqiqa TTL) va emailga yuboriladi. **Ikkalasi ham faqat `{message}` qaytaradi, hech qanday token yo'q — bu bosqichda foydalanuvchi hali login qilmagan, faqat kod so'ragan.**
2. Foydalanuvchi emaildan 6 xonali kodni oladi, `/v1/auth/code/verify/`ga `{email, verify_code}` yuboradi.
3. Backend kodni tekshiradi, **shu yerda (birinchi marta) `CustomUser.objects.get_or_create(email=...)` chaqiriladi** — ya'ni foydalanuvchi hisob yozuvi FAQAT shu bosqichda yaratiladi (agar `/v1/auth/register/` orqali kelgan bo'lsa, cache'dagi `first_name`/`last_name`/`age` shu yerda ishlatiladi; agar `/v1/auth/login/` orqali kelgan yangi email bo'lsa, hisob ism-familiyasiz yaratiladi — ya'ni **"Login" tugmasi, agar email tizimda yo'q bo'lsa, aslida sukut bo'yicha ro'yxatdan o'tkazib yuboradi**, buni Login/Register sahifalarida foydalanuvchiga tushunarli qilib ko'rsatish kerak).
4. Javobda `{access, refresh}` keladi — `access`ni `Authorization: Bearer` uchun, `refresh`ni token muddati tugaganda yangilash uchun saqlash kerak.

⚠️ **Yana bir bo'shliq — hozirgi `lib/api.ts` `refresh` tokenni umuman saqlamaydi va hech qachon `/v1/auth/token/refresh/`ni chaqirmaydi.** SimpleJWT'da access token odatda qisqa muddatli (daqiqalar/soatlar) bo'ladi — muddati tugagach, foydalanuvchi hech qanday tushunarli sababsiz "chiqib ketadi" (401 xatolari, `auth-provider.tsx`dagi `refresh()` funksiyasi buni "token yaroqsiz" deb talqin qilib, avtomatik logout qiladi). **Buni tuzatish kerak:**
- `setToken`/`getToken` funksiyalarini ikkinchi kalit (`streamora_refresh`) bilan kengaytirish
- `request()` funksiyasida 401 kelganda, avval `/v1/auth/token/refresh/` bilan yangi `access` olishga urinish, muvaffaqiyatsiz bo'lsagina logout qilish

### 4.1.2 Profilni tahrirlash — faqat PATCH ishlatilsin, PUT emas

`UserSerializerConfig`da `password` maydoni **`required=True`** qilib e'lon qilingan. DRF'da to'liq yangilash (`PUT`) so'ralganda bu maydon albatta kerak bo'ladi (bo'lmasa 400 xato), lekin **qisman yangilash (`PATCH`, `partial=True`)da DRF avtomatik ravishda barcha maydonlarni ixtiyoriy qiladi** — shuning uchun profil formasi (ism, familiya, yosh) uchun **faqat `PATCH /v1/users/{id}/`** ishlatilsin (mavjud `lib/api.ts`dagi `updateUser()` allaqachon PATCH ishlatadi — to'g'ri, o'zgartirish shart emas), parolni o'zgartiruvchi alohida forma kerak bo'lsa, u alohida oqim sifatida ko'rib chiqilsin.

`CustomUser` modelida: `first_name`/`last_name` — `null=True` (bo'sh bo'lishi mumkin, agar bo'sh qolsa, `save()` metodida avtomatik email prefiksidan to'ldiriladi), `age` — `null=True, blank=True` (ixtiyoriy).

### 4.2 Kontent
| Metod | Endpoint | Izoh |
|---|---|---|
| GET | `/v1/movie/` | Barcha filmlar (pagination: `results`, `count`, `next`, `previous`) |
| GET | `/v1/movie/{id}/` | Bitta film |
| GET | `/v1/movie/{id}/stream/` | **Video striming** (302 → Go streamer) |
| GET | `/v1/series/` , `/v1/series/{id}/` | Seriallar |
| GET | `/v1/episode/?series={id}` | Serialning qismlari |
| GET | `/v1/episode/{id}/` , `/v1/episode/{id}/stream/` | Bitta qism / striming |
| GET | `/v1/genre/` | Janrlar ro'yxati |
| GET | `/v1/embedding_search/search/?q=...&limit=...` | **Semantik qidiruv** (pgvector asosida, ma'no bo'yicha). ⚠️ Query parametr nomi `q`, `query` EMAS! `limit` — 1-50 oralig'ida, ixtiyoriy. |

### 4.2.1 Filtrlash va oddiy qidiruv — VIEWS'DA TAYYOR YOZILGAN, MAJBURIY ISHLATILSIN

Backend kodida (`apps/main/filters/*.py`, `apps/main/views/*.py`) har bir ro'yxat endpointida **`django-filter` + DRF `SearchFilter`** allaqachon ulangan. Bular — foydalanuvchi maxsus yozgan, tayyor va ishlaydigan filtrlar. Frontend ularni **hosila (derived) UI** sifatida ishlatishi kerak (filtr paneli, saralash tugmalari, qidiruv input'i) — bularni chetlab o'tib faqat `embedding_search`ga tayanmaslik kerak, ikkalasi ham kerak (oddiy filtr — aniq mezon bo'yicha, semantik qidiruv — ma'no bo'yicha).

**`GET /v1/movie/`** qabul qiladigan query parametrlar:
| Parametr | Turi | Izoh |
|---|---|---|
| `search` | string | DRF SearchFilter — `title`, `description`, `genres__name`, `telegram_channel` bo'yicha qidiradi (icontains, bir nechta maydonda birdan) |
| `title` | string (icontains) | Nomi bo'yicha |
| `description` | string (icontains) | Tavsif bo'yicha |
| `genre` | number | Janr ID bo'yicha aniq |
| `genre_name` | string (icontains) | Janr nomi bo'yicha |
| `duration_seconds` | number | Aniq davomiylik |
| `duration_min` / `duration_max` | number | Davomiylik oralig'i (soniyada) |
| `is_cashed` | boolean | Keshlangan/keshlanmagan |
| `created_after` / `created_before` | datetime (ISO) | Qo'shilgan sana oralig'i |
| `ordering` | string | `title`, `-title`, `created_at`, `-created_at`, `duration_seconds`, `-duration_seconds` (minus = kamayish tartibida) |
| `page` | number | Pagination (⚠️ pastga qara — `page_size=5`!) |

**`GET /v1/series/`** — xuddi shunday: `search`, `title`, `description`, `genre`, `genre_name`, `created_after/before`, `ordering` (`title`/`created_at`).

**`GET /v1/episode/`** — `search` (`series__title`, `telegram_channel`, `telegram_file_id`), `series` (ID), `series_title` (icontains), `episode_number` / `episode_number_min` / `episode_number_max`, `telegram_channel`, `duration_min/max`, `is_cashed`, `created_after/before`, `ordering` (`episode_number`/`created_at`/`duration_seconds`).

**`GET /v1/genre/`** — `search` va `name` (icontains).

**`GET /v1/movie-comments/`, `/v1/series-comments/`** — `search` (matn + user ismi/email + film/serial nomi), `user`, `movie`/`series`, `text`, `created_after/before`, `ordering` (`created_at`).

**`GET /v1/movie-rating/`, `/v1/series-rating/`** — `search`, `user`, `movie`/`series`, `stars`, `stars_min`/`stars_max`, `updated_after/before`.

**`GET /v1/movie-favourite/`, `/v1/series-favourite/`** — `search`, `user`, `movie`/`series`, `created_after/before`.

**`GET /v1/movie-watchprogress/`** — `user`, `movie`, `position_seconds`, `position_min/max`, `updated_after/before`.
**`GET /v1/series-watchprogress/`** (haqiqiy nomi backendda `episode` bo'yicha) — `user`, `episode`, `series` (episode__series__id orqali), `position_min/max`, `updated_after/before`.

> **Amaliy foydalanish namunasi:** "Janr bo'yicha filtr" sahifasida `?genre=3&ordering=-created_at`, "Uzoq filmlar" filtri `?duration_min=7200`, admin panelda foydalanuvchi bo'yicha izohlarni ko'rish `?user=12` — hammasi tayyor, backendga hech narsa qo'shish shart emas, frontendda shu parametrlarni URL query-string sifatida yig'ib yuborish kifoya.

### 4.2.2 ⚠️⚠️ KRITIK BACKEND BUG — bu "70% ishlamaslik"ning YANA BIR asosiy sababi bo'lishi mumkin

`apps/main/views/movie_view.py` va `series_view.py` fayllarida **Comment, Rating, Favorites, WatchProgress** ViewSet'larining barchasida:

```python
permission_classes = [IsStaffOrReadOnly]
```

**Bu shuni anglatadi: oddiy (staff bo'lmagan) foydalanuvchi — sevimlilarga qo'sha OLMAYDI, baho qo'ya OLMAYDI, izoh qoldira OLMAYDI, tomosha progressini saqlay OLMAYDI.** GET (o'qish) hammaga ochiq, lekin POST/PATCH/DELETE faqat `is_staff=True` foydalanuvchilarga ruxsat beriladi — chunki `IsStaffOrReadOnly.has_permission()` shunday yozilgan (`permissions.py`). Bu, aftidan, xato: bu joylarda `IsStaffOrReadOnly` emas, **`IsAuthenticated` yoki `IsOwnerOrReadOnly`** (fayldagi tayyor klass, lekin hozircha hech qayerda ishlatilmagan) bo'lishi kerak edi.

Xuddi shunday: `misc_view.py`dagi **`UserViewSet`** — `IsSuperuserOrReadOnly`. Ya'ni oddiy foydalanuvchi **hatto o'zining profilini (`PATCH /v1/users/{id}/`) tahrirlay olmaydi** — faqat superuser.

**Frontend uchun oqibat:** login qilgan oddiy foydalanuvchi "sevimlilarga qo'sh", "baho qo'y", "izoh qoldir", "profilni tahrirla" tugmalarini bossa — **403 Forbidden** qaytadi, hech narsa saqlanmaydi. Bu ovozli buyruqlar (`add_to_favorites`, `rate_content`, `add_comment` va h.k.) uchun ham bir xil — ular ham shu endpointlarga uradi.

**Nima qilish kerak:**
1. **Eng to'g'ri yechim — backend kodini tuzatish:** `movie_view.py`, `series_view.py`dagi Comment/Rating/Favorites/WatchProgress ViewSet'larida `permission_classes = [IsStaffOrReadOnly]` ni `[permissions.IsAuthenticated]` ga (yoki `IsOwnerOrReadOnly` bilan birga) almashtirish, `misc_view.py`dagi `UserViewSet`da esa profilni faqat o'zi tahrirlashi mumkin bo'lishi uchun mos permission yozish. Bu — bitta-ikkita qatorlik tuzatish, lekin **frontend ishlashi uchun shart**.
2. Agar backendni hozir tuzatib bo'lmasa, frontend bu holatni kutib, 403 kelganda foydalanuvchiga tushunarli xabar ko'rsatishi kerak ("Bu amal uchun ruxsat yo'q" emas — chunki bu foydalanuvchi xatosi emas, tizim sozlamasi xatosi), lekin **doimiy yechim emas, vaqtinchalik chidash**.

Bu bandni yangi AI'ga alohida ta'kidlab bering — bu frontend kodidagi xato emas, backend permission sozlamasidagi xato, lekin frontend funksionalligining yarmi shunga bog'liq.

### 4.3 Foydalanuvchi harakatlari (hammasi auth talab qiladi)
| Metod | Endpoint | Body |
|---|---|---|
| GET/POST | `/v1/movie-favourite/` | `{movie}` |
| GET/POST | `/v1/series-favourite/` | `{series}` |
| DELETE | `/v1/movie-favourite/{id}/`, `/v1/series-favourite/{id}/` | — |
| GET/POST | `/v1/movie-rating/`, `/v1/series-rating/` | `{movie\|series, stars}` (0-5) |
| GET/POST | `/v1/movie-comments/`, `/v1/series-comments/` | `{movie\|series, text}` |
| DELETE | `/v1/movie-comments/{id}/` va h.k. | O'ziniki izohni o'chirish |
| GET/POST | `/v1/movie-watchprogress/` | `{movie, position_seconds}` |
| GET/POST | `/v1/series-watchprogress/` | `{episode, position_seconds}` |

> Favorites/watchprogress ro'yxatlari server tomonida joriy userga filtrlanadimi yoki frontend `?user={id}` yuborishi kerakmi — bu ham backendchi bilan tasdiqlanishi kerak bo'lgan nuqta (`lib/api.ts`dagi `favorites()`/`history()` hozircha filtrsiz chaqiryapti).

### 4.4 Admin (CRUD — faqat is_staff/is_superuser uchun)
`/v1/movie/`, `/v1/series/`, `/v1/episode/`, `/v1/genre/` — POST/PUT/PATCH/DELETE faqat `is_staff=True` (`IsStaffOrReadOnly`), GET hammaga ochiq. `/v1/users/` — yozish faqat `is_superuser=True` (`IsSuperuserOrReadOnly`). Barchasida yuqoridagi 4.2.1-banddagi filtr/qidiruv parametrlari ishlaydi (`page_size=5` bilan pagination).

### 4.5 Pagination — DIQQAT, sahifa hajmi juda kichik

Barcha ro'yxat endpointlarida `CustomPagination(page_size=5)` — ya'ni **har bir so'rov faqat 5 ta natija qaytaradi** (`results`, `count`, `next`, `previous` shaklida). Bosh sahifadagi katta karusellar (skrinshotdagi kabi 6-8 ta karta) uchun frontend **bir nechta sahifani ketma-ket** (`?page=1`, `?page=2`...) so'rashi yoki backendchidan production uchun `page_size`ni oshirishni so'rashi kerak. Har holda, `unwrapList()` va "Ko'proq yuklash" (infinite scroll/"Load more") mantig'i har bir ro'yxat sahifasida (Movies, Series, Search, Admin jadvallari) **majburiy** amalga oshirilishi kerak — aks holda foydalanuvchi 5 tadan ortiq kontentni ko'ra olmaydi.

---

## 5. Video striming (Go Streamer) — HTML5 `<video>` orqali

Frontend hech qanday maxsus striming kodi yozmaydi — brauzerning standart `<video>` tegi Range so'rovlarini, seekni, buferlashni o'zi boshqaradi.

```jsx
<video
  ref={videoRef}
  data-role="main-player"      // ← MAJBURIY: ovozli boshqaruv shu atribut orqali faol pleerni topadi
  controls
  width="100%"
  preload="metadata"
  onError={handleError}
  onWaiting={() => setLoading(true)}
  onPlaying={() => setLoading(false)}
>
  <source src={`/v1/movie/${movieId}/stream/`} type="video/mp4" />
</video>
```

**Xato boshqaruvi (majburiy):**
| HTTP kod | Frontend harakati |
|---|---|
| `404` | "Video hozircha mavjud emas" xabari |
| `502` / `503` | **1 marta avtomatik retry** (1.5s kutib, `video.load()`), keyin xabar |
| `416` | `video.load()` bilan qayta yuklash |

CORS server tomonidan hamma originlarga ochiq — muammo yo'q, faqat `fetch()`/`XHR` bilan dasturiy chaqirilsa (emas, `<video src>` orqali) muammo bo'lishi mumkin, shuning uchun har doim `<video>` tegidan foydalanish kerak, `fetch`dan emas.

---

## 6. OVOZLI BOSHQARUV — to'liq arxitektura (BU LOYIHANING ASOSIY XUSUSIYATI)

### 6.1 Qatlamlar

```
Ovoz → Web Speech API (STT, brauzer) → matn
   ↓
QATLAM 0: lib/voice-commands.ts — tezkor kalit-so'z filtri (LLM'siz, 0ms kechikish)
   ↓ (mos kelmasa)
QATLAM 1: WebSocket → wss://backend.../ws/agent/{session_id}/?token=...
   ↓
QATLAM 2: Backend — Groq LLM (llama-3.1-8b-instant) + 24 tool → {type:"action", payload:{action, params}}
   ↓
QATLAM 3: Frontend TOOL_DISPATCH — real REST API chaqiradi yoki UI'ni o'zgartiradi
   ↓
QATLAM 4: Natija — ekranda ko'rinadi + TTS (speechSynthesis) bilan ovozda o'qiladi
   ↓
QATLAM 5: Butun jarayon davomida — pastki "Voice Overlay" (Gemini-uslubidagi orb), joriy holatni ko'rsatadi
```

### 6.2 WebSocket protokoli — REAL BACKEND KODIDAN TASDIQLANGAN

Ulanish: `wss://backend.scholarmap.uz/ws/agent/{session_id}/?token={JWT}`
(`session_id` — frontend tomonidan generatsiya qilinadi, masalan `web_${Date.now()}_${random}`; auth muvaffaqiyatsiz bo'lsa server ulanishni yopadi — `lib/agent-socket.ts`da bu allaqachon to'g'ri implementatsiya qilingan, o'zgartirish shart emas.)

**Server → frontend, ulanganda:**
```json
{ "type": "connected", "session_id": "web_..." }
```

**Frontend → server (matn yuborish):**
```json
{ "text": "bunga besh baho qo'y" }
```
> Eslatma: hozirgi backend `frontend_state` maydonini o'qimaydi (kelajakda qo'shilishi mumkin) — lekin frontend baribir yuborishda davom etsin (`lib/agent-socket.ts`dagi kabi), zarar qilmaydi va backend kengayganda tayyor bo'ladi.

**Server → frontend, javob kutilayotganda:**
```json
{ "type": "status", "payload": { "state": "thinking" } }
```

**Server → frontend, tool aniqlangan bo'lsa:**
```json
{ "type": "action", "payload": { "action": "rate_content", "params": { "stars": 5, "title": null } } }
```

**Server → frontend, LLM tool topa olmasa (escalate):**
```json
{ "type": "response", "payload": { "text": "Bu buyruqni hali to'liq tushuna olmayapman, ustida ishlanmoqda." } }
```

**Server → frontend, xato:**
```json
{ "type": "error", "payload": { "code": "AGENT_ERROR", "message": "..." } }
```

`lib/agent-socket.ts`dagi `AgentMessage` tipi bularning barchasini allaqachon qamrab oladi — shunchaki `payload.action` maydonini asosiy tool nomi sifatida ishlat (`payload.tool` — zaxira/eski nom, ikkalasini ham tekshir).

### 6.3 34 ta FRONTEND-ONLY funksiya (LLM'ga BORMAYDI, Qatlam 0'da DOM orqali hal bo'ladi)

Bular `lib/voice-commands.ts`da (`matchLocalCommand`) tez kalit-so'z (regex) orqali aniqlanadi va to'g'ridan-to'g'ri bajariladi — hozircha 21 tasi implementatsiya qilingan, qolganini QO'SHISH KERAK:

**Playback (video boshqaruvi):** `pause_video`, `play_video`, `seek_forward(seconds)`, `seek_backward(seconds)`, `seek_to_time(seconds)`, `set_volume(value)`, `increase_volume(step)`, `decrease_volume(step)`, `mute`, `unmute`, `toggle_fullscreen`, `enter_fullscreen`, `exit_fullscreen`, `toggle_picture_in_picture`, `exit_picture_in_picture`, `toggle_captions`, `enable_captions`, `disable_captions`, `toggle_theater_mode`, `close_player`, `set_playback_speed(speed)`, `restart_episode`, `next_episode`, `previous_episode`

**Navigatsiya:** `scroll_down`, `scroll_up`, `scroll_to_top`, `scroll_to_bottom`, `go_back`, `refresh_page`, `go_home`, `open_favorites_page`, `open_search_page`, `open_profile_page`, `stop_listening`

Bularning har biri **faol pleerga** (`document.querySelector('[data-role="main-player"]')`) ta'sir qiladi. Ishlatilgan o'zbekcha kalit so'zlar (masalan "pauza", "to'xtat", "orqaga N soniya") — mavjud `lib/voice-commands.ts` faylidagi uslubda davom ettirilsin, manfiylashtirish (`isNegated`) mantig'ini saqlab qolgan holda.

### 6.4 24 ta HAQIQIY LLM tool — BACKEND KODIDAN 1:1 TASDIQLANGAN (`content_agents_v2.py`)

Bular WebSocket orqali backend Groq LLM'ga yuboriladi, LLM qaysi tool va parametrlarni tanlashini aniqlaydi, so'ng frontend **haqiqiy REST so'rovni o'zi** bajaradi (backend faqat "qaysi tool" deb aytadi, ma'lumotni o'zi o'zgartirmaydi):

| Tool nomi | Kelayotgan params | Frontendda qaysi REST chaqiruvga bog'lanadi |
|---|---|---|
| `search_content` | `{query, content_type}` | Ikkalasi ham ishlatiladi: 1) `GET /v1/movie/?search={query}` va `GET /v1/series/?search={query}` (DRF SearchFilter — aniq so'z bo'yicha, tez), 2) `GET /v1/embedding_search/search/?q={query}&limit=20` (semantik, ma'no bo'yicha). `content_type` `"movie"`/`"series"`/`"all"` bo'lsa, shunga qarab birini yoki ikkalasini ham chaqirish. Natijalar birlashtirilib `/search` sahifasida ko'rsatiladi. |
| `select_search_result` | `{index}` | Oxirgi qidiruv natijalari ro'yxatidan (frontend state'da saqlangan) shu indeksni ochish |
| `filter_by_genre` | `{genre}` | Avval `GET /v1/genre/?search={genre}` bilan janr ID topiladi, so'ng `GET /v1/movie/?genre={id}` va `GET /v1/series/?genre={id}` (4.2.1-band) |
| `show_trending` | `{}` | `GET /v1/movie/?ordering=-created_at` (haqiqiy "ko'rishlar soni" maydoni bo'lmagani uchun, hozircha eng yangi/reyting bo'yicha yaqinlashtiriladi — agar backendda alohida "views_count" qo'shilsa, `ordering=-views_count`ga o'tkaziladi) |
| `show_new_releases` | `{}` | `GET /v1/movie/?ordering=-created_at` va `/v1/series/?ordering=-created_at` (4.2.1-band, `created_after` bilan ham cheklash mumkin) |
| `get_recommendations` | `{based_on}` | `based_on` kontentning janrlari orqali `?genre={id}` bilan o'xshash kontent qidirish, yoki `/v1/embedding_search/search/` bilan sarlavha matnidan semantik o'xshashlarni topish |
| `sort_content` | `{criteria}` | Joriy ro'yxatga `?ordering=` qo'shiladi: `newest`→`-created_at`, `rating`→backend'da reyting maydoni yo'q, `Rating_Movie`dan `Avg`/`annotate` bilan hisoblanishi kerak (yoki frontendda mavjud ma'lumotdan saralash), `alphabetical`→`title`, `popularity`→`-created_at` (vaqtincha, yuqoridagi kabi) |
| `open_content` | `{title}` | `?search={title}&title={title}` bilan qidirib, mos film/serial sahifasiga o'tish |
| `show_content_details` | `{title}` | Joriy/berilgan kontent tafsilot sahifasi |
| `list_episodes` | `{series_title}` | `GET /v1/episode/?series={id}` yoki `?series_title={title}` (4.2.1-band) |
| `add_to_favorites` / `remove_from_favorites` ⚠️ | `{title}` | `/v1/movie-favourite/` yoki `series-favourite/` POST/DELETE |
| `show_favorites` | `{}` | `/favorites` sahifasi |
| `resume_watching` | `{}` | Eng oxirgi `watchprogress` yozuvidan davom ettirish |
| `show_continue_watching` | `{}` | "Davom etayotganlar" bo'limi |
| `show_watch_history` | `{}` | `/history` sahifasi |
| `mark_as_watched` | `{title}` | `progressMovie(id, duration)` — pozitsiyani to'liq qilib belgilash |
| `remove_from_continue_watching` ⚠️ | `{title}` | Watchprogress yozuvini o'chirish |
| `clear_watch_history` ⚠️ | `{}` | Barcha watchprogress yozuvlarini o'chirish |
| `rate_content` | `{stars, title}` | `/v1/movie-rating/` yoki `series-rating/` POST |
| `add_comment` | `{text, title}` | `/v1/movie-comments/` yoki `series-comments/` POST |
| `show_comments` | `{title}` | Izohlar bo'limini ochish |
| `delete_comment` ⚠️ | `{comment_id}` | DELETE |
| `share_content` | `{title}` | Sahifa URL'ini nusxalash / Web Share API |
| `report_problem` | `{issue_type, description, title}` | Hozircha maxsus backend endpoint yo'q — mahalliy modal ko'rsatib, email/telegram orqali yuborish YOKI kelajak uchun placeholder qoldirish |
| `check_login_status` | `{}` | `getToken()` bor-yo'qligini tekshirish |
| `logout` ⚠️ | `{}` | Tokenni tozalash, login sahifasiga yo'naltirish |

⚠️ = **tasdiqlash talab qiladi** (destructive action) — bu tool kelganda, avval foydalanuvchidan ovozli/vizual tasdiq so'rash kerak ("Rostdan ham tomosha tarixini tozalaymi?" kabi), `voiceAssistantProvider`dagi `pendingConfirm`/`resolveConfirm` mexanizmi shu uchun — mavjud, ishlatilsin.

`title` bo'sh (`null`) kelsa — bu LLM "joriy ko'rilayotgan kontent"ni nazarda tutgani (masalan "bunga besh baho qo'y"). Frontend bu holda `data-role="main-player"` bog'langan joriy sahifaning kontent ID/title'ini ishlatishi kerak (`voice-tools.ts`dagi `PlayerBridge.contentId`/`contentTitle`).

### 6.5 Voice Overlay — vizual indikator (Gemini uslubida, RANGI O'ZGARTIRILGAN)

4 holat: `idle` (yashirin) → `listening` (puls animatsiya) → `thinking` (aylanuvchi gradient) → `speaking` (TTS ovozga mos to'lqin).

Mavjud `components/voice-orb.tsx` shu mantiqni allaqachon amalga oshirgan — **faqat rang sxemasini** pastdagi 7-bo'limdagi yangi accent rangga moslashtirish kerak (hozir ko'k/binafsha `#4285f4` gradient ishlatilgan bo'lishi mumkin — buni loyihaning yangi asosiy rangiga almashtir).

Overlay tarkibi: markazda katta orb, chap tomonda ekran-skrinshot/kamera tugmasi (ixtiyoriy), o'ng tomonda yopish (X) tugmasi, tepada foydalanuvchi so'zi va AI javobi (caption), pastda holat matni ("Tinglayapman...", "O'ylayapman...", va h.k.).

### 6.6 Xavfsizlik va barqarorlik (production checklist)

- [ ] Mikrofon ruxsati rad etilganda tushunarli xabar (`getUserMedia` xatosi)
- [ ] WebSocket avtomatik qayta ulanish (backoff bilan) — hozirgi `agent-socket.ts` avtomatik reconnect qilmaydi (ataylab), ovozli assistant o'chirilib-yoqilganda qayta ulanadi — shu dizaynni saqlab qolish mumkin, lekin tarmoq uzilib qolsa xato xabari ko'rsatilishi kerak
- [ ] Xavfli amallar (⚠️ belgilangan) tasdiqlashsiz bajarilmasligi
- [ ] Har bir video pleyerda `data-role="main-player"` va `preload="metadata"` borligi
- [ ] Ko'p `<video>` bo'lganda faqat faol/registratsiya qilingan pleer boshqarilishi
- [ ] TTS'ni o'chirib qo'yish sozlamasi (Settings sahifasida)
- [ ] Brauzer Web Speech API'ni qo'llab-quvvatlamasa — jim tushunarli xabar (crash emas)

---

## 7. DIZAYN TIZIMI

### 7.1 Joriy dizayn (skrinshot, referens sifatida biriktirilgan)

Foydalanuvchi yuborgan skrinshot — to'liq, ko'p bo'limli "StreamVibe" uslubidagi dark-theme dashboard: hero banner (katta film posteri + tavsif), "Davom etayotganlar" karusel, "Hozir trendda" karusel, qidiruv paneli, Film/Serial sahifa preview'lari, Video Player bloki, Profil kartasi, Janrlar grid, Admin Panel + Dashboard statistikasi, Voice Logs jadvali, va markazda katta **AI Voice Assistant** dumaloq orb (ko'k-binafsha gradient, "Men tinglayapman... Gapiring" matni bilan) va o'ng tepada 5 ta mayda holat-doirasi ("Tinglayapman / Tushunyapman / Qidiryapman / Ijro etyapman / Bajarildi").

**Bu layout mantig'i to'g'ri va saqlanadi** — bo'limlar, kartalar, joylashuv barchasi ishlatilishi kerak. Faqat rang sxemasi o'zgartiriladi (pastga qarang).

### 7.2 RANG SXEMASINI O'ZGARTIRISH — MAJBURIY

Skrinshotdagi asosiy accent rang — **to'q ko'k/binafsha** (`#4285f4`, `#6d5bff` uslubida). Foydalanuvchi buni **"universal", boshqa rangga"** o'tkazishni so'rayapti — ya'ni binafsha/ko'k-Gemini uslubidan uzoqlashib, saytga o'ziga xos, lekin professional va universal ko'rinadigan rang bering.

**Tavsiya etilgan yangi palitra — issiq amber/oltin + neytral qora (Netflix/cinema uslubi, lekin qizil emas, ko'k ham emas):**

```css
@theme {
  --color-background: #0a0a0c;
  --color-surface: #16161a;
  --color-surface-2: #202024;
  --color-border: #2a2a30;
  --color-text: #f4f4f5;
  --color-text-muted: #9a9aa2;

  /* Asosiy accent — issiq amber/oltin (binafsha/ko'k o'rniga) */
  --color-primary: #f5a623;
  --color-primary-hover: #ffb84d;
  --color-primary-muted: #7a5518;

  /* Voice orb gradient — amber-dan chuqurroq to'q amberga (ko'k emas!) */
  --color-orb-from: #ffce7a;
  --color-orb-mid: #f5a623;
  --color-orb-to: #b3720f;

  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #f5a623;
}
```

> Bu — bitta tavsiya. Muhimi: **binafsha/to'q-ko'k Gemini-uslubidagi rangdan qochish**, dizayn tokenlarini (yuqoridagi kabi) CSS o'zgaruvchilar orqali markazlashtirish, shunda kelajakda rangni almashtirish bitta joyda o'zgartirish bilan bo'ladi. Amber/oltin — kino-teatr assotsiatsiyasi bilan mos, "universal" — hech qaysi katta AI brendiga (Google ko'k, Anthropic to'q sarg'ish/binafsha kabi) o'xshamaydi.

### 7.3 Dizayn qoidalari

- Dark-theme, yuqori kontrast, minimal, zamonaviy kino-striming estetikasi (Netflix/HBO Max uslubi)
- Kartalar (`media-card.tsx`) — hover'da poster kattalashishi, gradient overlay bilan sarlavha
- Barcha interaktiv elementlar (tugmalar, orb, statuslar) yangi `--color-primary` o'zgaruvchisidan foydalansin, qattiq yozilgan hex ranglar EMAS
- Frontend dizayn skilllari mavjud bo'lsa (`frontend-design`), shablon-ko'rinishdan qochish, tipografiyaga va oraliqlarga (spacing) alohida e'tibor berish tavsiya etiladi

---

## 8. TO'LIQ SAYT XARITASI — QURILISHI KERAK BO'LGAN SAHIFALAR

Eski versiyada bor edi: `/`, `/explore`, `/watch/[type]/[id]`, `/admin`, `/profile`, `/login`, `/auth/callback` — 6 ta sahifa. Bular saqlanadi va KENGAYTIRILADI, quyidagicha to'liq ro'yxat bilan:

| Marshrut | Vazifasi |
|---|---|
| `/` | Bosh sahifa — hero banner, davom etayotganlar, trendda, janrlar bo'yicha qatorlar |
| `/movies` | Barcha filmlar — filtr/saralash bilan grid |
| `/series` | Barcha seriallar — filtr/saralash bilan grid |
| `/genre/[name]` | Bitta janr bo'yicha kontent |
| `/search?q=` | Qidiruv natijalari (`embedding_search`) |
| `/movie/[id]` | Film tafsilot sahifasi — tavsif, reyting, izohlar, "Ko'rish" tugmasi |
| `/series/[id]` | Serial tafsilot sahifasi — mavsum/qism ro'yxati, izohlar |
| `/watch/movie/[id]` | Video pleyer sahifasi (film) |
| `/watch/series/[id]/[episodeId]` | Video pleyer sahifasi (serial qismi), keyingi/oldingi qism tugmalari |
| `/favorites` | Sevimlilar ro'yxati |
| `/history` | Tomosha tarixi + "Davom ettirish" |
| `/profile` | Foydalanuvchi profili, statistikasi |
| `/settings` | Sozlamalar — ovoz (til, TTS on/off, ovoz tanlash), akkaunt, bildirishnomalar |
| `/login` | Email kiritish → kod yuborish |
| `/register` | Ro'yxatdan o'tish formasi |
| `/verify` | Tasdiqlash kodi kiritish sahifasi |
| `/auth/callback` | Google OAuth qaytish sahifasi |
| `/admin` | Admin dashboard — statistika kartalar, grafik |
| `/admin/movies`, `/admin/series`, `/admin/genres`, `/admin/users` | CRUD boshqaruv jadvallari |
| `/admin/voice-logs` | Ovozli buyruqlar logi (qaysi user, qaysi buyruq, holati, vaqti) |
| `/404` (`not-found.tsx`) | Topilmadi sahifasi |

**Har bir sahifa** — global `VoiceAssistantProvider` context ichida bo'lishi va tegishli bo'lsa `registerPlayer`/`data-role="main-player"` orqali ovozli boshqaruvga ochiq bo'lishi shart (skrinshotdagi kabi, deyarli barcha sahifalar ovozli boshqaruvga tayyor bo'lishi so'ralgan).

---

## 9. Mavjud kod — nimalar QAYTA ISHLATILADI (o'zgartirmasdan yoki kam o'zgartirib)

### 9.1 ⚠️ `lib/api.ts`da HOZIRDA MAVJUD BUG — qidiruv umuman ishlamaydi

`lib/api.ts`dagi `search()` funksiyasi:
```ts
search: (query: string) => request<ApiList<MediaItem>>(`/v1/embedding_search/?search=${encodeURIComponent(query)}`),
```
Bu **noto'g'ri**, ikkita xato birga: 1) noto'g'ri endpoint — `/v1/embedding_search/` oddiy ro'yxat (list) endpointi, semantik qidiruv `/v1/embedding_search/search/` (alohida `@action`) da; 2) noto'g'ri parametr nomi — backend `q` kutadi, `search` emas (4.2-band, `llm/views.py`dagi `SearchQuerySerializer`). Natijada bu funksiya chaqirilganda, bo'sh yoki noto'g'ri natija qaytaradi — **qidiruv "ishlamayapti" degan shikoyatning bevosita texnik sababi shu bo'lishi mumkin**.

**To'g'ri variant:**
```ts
search: (query: string, limit = 20) =>
  request<ApiList<{ id: number; title: string; description: string; distance: number; content_type: string; object_id: number }>>(
    `/v1/embedding_search/search/?q=${encodeURIComponent(query)}&limit=${limit}`
  ),
// + qo'shimcha, aniq-so'z qidiruvi uchun (4.2.1-band):
searchMovies: (query: string) => request<ApiList<MediaItem>>(`/v1/movie/?search=${encodeURIComponent(query)}`),
searchSeries: (query: string) => request<ApiList<MediaItem>>(`/v1/series/?search=${encodeURIComponent(query)}`),
```
`embedding_search/search/` javobidagi har bir natija `content_type` ("movie"/"series" — `SearchIndexSerializerConfig`dagi `content_type` maydoni) va `object_id`ni qaytaradi — bu ID orqali frontend keyin `/v1/movie/{object_id}/` yoki `/v1/series/{object_id}/`dan to'liq ma'lumot (poster, tavsif) oladi, chunki `embedding_search` natijasida faqat `title`/`description`/`distance` bor, poster yo'q.

### 9.2 Boshqa qayta ishlatiladigan fayllar

Quyidagi fayllar allaqandan **to'g'ri va jonli backend bilan mos** — ularni asos qilib ol, qayta yozma:

- `lib/api.ts` — barcha REST chaqiruvlar, tip ta'riflari, token boshqaruvi (faqat `me()` funksiyasini 4.1-band bo'yicha tasdiqlash/tuzatish kerak)
- `lib/agent-socket.ts` — WebSocket ulanish mantiqi (6.2-bandga mos)
- `lib/voice-commands.ts` — 21 ta frontend-only buyruq tayyor, qolgan ~13 tasini (6.3-band) shu uslubda qo'shish kerak
- `lib/voice-tools.ts` — `PlayerBridge` interfeysi (video pleyerni ovozli tizimga ulash uchun)
- `components/voice-assistant-provider.tsx` — global context, WS + local-fastpath + confirm mexanizmi (461 qator, ishlaydigan holatda)
- `components/voice-orb.tsx` — overlay komponenti (faqat ranglarni 7.2-bandga moslashtirish)
- `components/auth-provider.tsx` — JWT decode + `/v1/users/{id}/` orqali profil olish yondashuvi **to'g'ri va tasdiqlangan** (4.1.1-bandga qarang, `/v1/auth/me/` degan endpoint yo'q, bu yondashuv shart). Faqat 4.1.1-banddagi refresh-token saqlash/yangilash mantig'i qo'shilishi kerak (hozir yo'q).
- `require-auth.tsx`, `app-chrome.tsx`, `media-card.tsx`, `admin-client.tsx`, `profile-client.tsx`, `watch-client.tsx` — mavjud, tekshirilib, yangi sahifa sonini qamrab olish uchun kengaytiriladi

Repo (`project-frontend-v0`)dagi eski `app/*.tsx` fayllar — **faqat referens sifatida** foydalanish mumkin (qanday import qilingani, qanday struktura bo'lgani ko'rish uchun), lekin ularni to'g'ridan-to'g'ri ko'chirib qo'ymaslik kerak, chunki ular eski `lib/`ga mo'ljallangan bo'lishi mumkin — har birini yangi `lib/api.ts` bilan mosligini tekshirib qayta yozish kerak.

---

## 10. Bajarish tartibi (tavsiya etilgan ketma-ketlik)

1. `app/layout.tsx` yarat — `<html>`, dark theme, `VoiceAssistantProvider` va `AuthProvider`ni root darajada o'rab qo'yish, global `VoiceOverlay`ni shu yerga joylashtirish
2. `app/globals.css` — 7.2-banddagi yangi rang tokenlari bilan Tailwind v4 `@theme`
3. Asosiy layout komponentlari: navbar/sidebar (`app-chrome.tsx` asosida), mobil-responsive
4. 8-banddagi sahifalarni birma-bir qur, eng avval `/`, `/movie/[id]`, `/watch/movie/[id]`, `/login`, `/verify` (asosiy foydalanuvchi yo'li), keyin qolganlari
5. Voice tizimini har sahifaga ulash — ayniqsa `watch/*` sahifalarida `registerPlayer`ni chaqirish
6. 6.4-banddagi 24 tool uchun `TOOL_DISPATCH` xaritasini to'liq yozish (frontendda, LLMdan kelgan `action` nomini REST chaqiruvga bog'lovchi funksiya)
7. Admin sahifalari va Voice Logs (agar backendda log endpoint bo'lmasa — placeholder/mock bilan, keyin backendchi bilan aniqlashtirish)
8. Xato holatlari, loading skeletonlar, bo'sh-holat (empty state) dizaynlari
9. `npm run build` bilan tekshirish, TypeScript xatolarini tozalash

---

## 11. Backend manba kodi (referens uchun)

GitHub: `https://github.com/soyibjonxomidjonov/video-streaming-plarform`

Ichida:
- `django-backend/` — asosiy REST + WebSocket backend (Django + DRF + Channels)
- `django-backend/apps/chat_api/consumers/ai_consumers.py` — WS consumer (6.2-band shu yerdan olindi)
- `django-backend/apps/llm/agents/content_agents_v2.py` — 24 LLM tool ta'rifi (6.4-band shu yerdan olindi, 1:1 mos)
- `django-backend/apps/main/filters/*.py` va `django-backend/apps/main/views/*.py` — barcha filtr/qidiruv/permission mantig'i (4.2.1 va 4.2.2-band shu yerdan olindi)
- `django-backend/apps/main/views/login_view.py`, `serializers/login_serializers.py`, `models/user.py`, `serializers/user_serializers.py` — auth oqimi, aniq javob maydonlari, user modeli (4.1.1, 4.1.2-band shu yerdan olindi)
- `django-backend/apps/llm/views.py` — semantik qidiruv (`embedding_search/search/?q=&limit=`)
- `go-backend/` — Go video streamer (5-band, `go-streamer-api-docs.md` bilan bir xil)
- `project-frontend-v0/` — eski frontend versiyasi (faqat referens, 9-bandga qarang)

Agar shu repo'ga kirish imkoning bo'lsa, `git clone` qilib `django-backend/apps/`ni ko'rib chiqish orqali qolgan noaniqliklarni (4.1, 4.3-banddagi ⚠️ belgilangan joylar) tasdiqlash mumkin.

---

## 12. Qabul qilish mezonlari (Definition of Done)

- [ ] `npm run build` xatosiz o'tadi, barcha 8-banddagi sahifalar mavjud va render bo'ladi
- [ ] Login → kod tasdiqlash → token saqlanishi → himoyalangan sahifalarga kirish ishlaydi
- [ ] `/v1/auth/code/verify/` javobidagi **`access`** maydoni (`token`/`key` EMAS) to'g'ri o'qilib saqlanadi, `refresh` token ham saqlanadi va 401 kelganda avtomatik yangilanadi
- [ ] Film/serial ro'yxati, tafsilot, va video pleyer (Range/seek bilan) ishlaydi
- [ ] Mikrofon tugmasini bosganda Voice Overlay ochiladi, 4 holat (idle/listening/thinking/speaking) to'g'ri almashadi
- [ ] Kamida 10 ta frontend-only buyruq (pauza, ovoz, seek, scroll, fullscreen) real vaqtda ishlaydi
- [ ] Kamida 5 ta LLM-tool buyruq (qidirish, sevimlilarga qo'shish, baho qo'yish, izoh, "davom ettirish") WebSocket orqali oxirigacha ishlaydi
- [ ] Rang sxemasi butunlay 7.2-banddagi yangi accent rangga o'tgan, hech qanday eski binafsha/ko'k qolmagan
- [ ] Admin panelda kamida film/serial CRUD ishlaydi
- [ ] Mobil ekranda (responsive) barcha asosiy sahifalar qulay ko'rinadi

---

*Hujjat manbalari: foydalanuvchi yuborgan `frontend-complete-final.md`, `go-streamer-api-docs.md`, Chat API Swagger skrinshoti, `frontendv2` zip fayli tahlili, va GitHub backend repozitoriysi (`django-backend/backend-docs/backend-api-docs.md`, `apps/chat_api/consumers/ai_consumers.py`, `apps/llm/agents/content_agents_v2.py`, `project-frontend-v0/`) to'g'ridan-to'g'ri o'qilib solishtirilgan holda tuzildi.*
