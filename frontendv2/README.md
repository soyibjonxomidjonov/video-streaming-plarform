# frontendv2 — Ovozli boshqariladigan video-striming platforma (Frontend)

Next.js 16 (App Router) + TypeScript + React 19 asosidagi frontend. Django (JWT + DRF)
backend, Go video streamer va Django Channels WebSocket AI agent bilan integratsiya qilingan.

## Texnologiyalar

- **Framework:** Next.js 16 (App Router, Turbopack default)
- **Til:** TypeScript
- **UI:** React 19
- **Uslub:** Vanilla CSS (CSS Modules + CSS Variables design token'lari) — Tailwind yo'q
- **State:** Zustand (auth, player, voice, ui store'lari)
- **Ikonlar:** lucide-react
- **HTTP:** markazlashgan `apiClient` (JWT Bearer + 401'da avtomatik refresh)

## Backend integratsiyasi

- REST bazasi: `NEXT_PUBLIC_API_BASE` (default `http://localhost:8000`), barcha yo'llar `/v1/...`
- Auth: JWT (`access` + `refresh`), `Authorization: Bearer <access>` header orqali
  - Login oqimi: `POST /v1/auth/login/` (kod yuborish) → `POST /v1/auth/code/verify/` (kodni tekshirish, token oladi)
  - Ro'yxatdan o'tish: `POST /v1/auth/register/` → `POST /v1/auth/code/verify/`
  - Google: `POST /v1/auth/google/login`
  - Refresh: `POST /v1/auth/token/refresh/`
- Video oqim: `GET /v1/movie/{id}/stream/` va `GET /v1/episode/{id}/stream/` — 302 redirect
  bilan Go streamerga yo'naltiradi. Native `<video src=...>` redirectni avtomat kuzatadi.
- WebSocket agent: `ws://host/ws/agent/<session_id>/?token=<JWT>`

## Ishga tushirish

```bash
cd frontendv2
npm install
cp .env.local.example .env.local   # qiymatlarni to'ldiring
npm run dev
```

`http://localhost:3000` da ochiladi.

## Papka tuzilishi

```
src/
├── app/                # App Router sahifalar (route'lar)
├── components/         # UI komponentlar (design-system, layout, content, player, voice)
├── config/             # env.ts — barcha muhit o'zgaruvchilari va API endpoint builder'lari
├── services/           # REST API abstraksiya qatlami (api-client + har bir resurs)
├── store/              # Zustand store'lar (auth, player, voice, ui)
├── voice/              # Ovozli agent arxitekturasi (STT, normalizer, fastPath, dispatcher, socket, TTS)
├── hooks/              # React hook'lari
└── types/              # Backend API kontrakt tiplari
```

## Ovozli boshqaruv oqimi

```
Mikrofon → MediaRecorder + VAD → Mohir.ai STT → normalizeUzbekSTT()
→ tryFastPath() (frontend regex) → mos kelsa DOM'da bajaradi
→ mos kelmasa AgentSocket → WebSocket → LLM → tool_call → dispatcher
→ PLAYBACK_HANDLERS (DOM) yoki API_HANDLERS (REST) → TTS + VoiceOverlay holati
```
