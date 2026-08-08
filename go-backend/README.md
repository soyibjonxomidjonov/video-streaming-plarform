# Go Streamer — ishga tushirish

## 1. Fayllarni serverga joylash

Ushbu papkadagi barcha fayllarni (`main.go`, `go.mod`, `Dockerfile`, `docker-compose.yml`) serveringizga (masalan Hetzner) yuklang.

## 2. `.env` faylini tayyorlash

`.env.example`ni nusxalab, `.env` deb nomlang va haqiqiy qiymatlarni kiriting:

```bash
cp .env.example .env
nano .env   # TELEGRAM_API_ID, TELEGRAM_API_HASH, BOT_TOKEN ni to'ldiring
```

## 3. Ishga tushirish

```bash
docker compose up -d --build
```

Bu ikkita konteynerni ishga tushiradi:
- `telegram-bot-api` — Local Bot API Server (port 8081)
- `go-streamer` — Go video streamer (port 8080)

## 4. Tekshirish

```bash
curl http://localhost:8080/health
# javob: ok
```

Video stream sinash:

```bash
curl -I http://localhost:8080/stream/{telegram_file_id}
```

## 5. Django bilan bog'lash

Django serveringiz `settings.py` faylida:

```python
GO_STREAMER_BASE_URL = "http://SIZNING_SERVER_IP:8080"
```

Agar Django ham bir xil serverda, bir xil Docker tarmog'ida ishlasa:

```python
GO_STREAMER_BASE_URL = "http://go-streamer:8080"
```

## Loglarni kuzatish

```bash
docker compose logs -f go-streamer
```

Har bir keshlangan/o'chirilgan fayl shu yerda ko'rinadi — bu orqali tizim to'g'ri ishlayotganini kuzatishingiz mumkin.

## Muhim eslatmalar

- `MAX_CACHE_SIZE_GB` — SSD diskingiz hajmiga qarab sozlang (masalan diskning 80%'i)
- `MAX_CONCURRENT_FETCH` — Telegram tomonidan IP-block bo'lmaslik uchun 20-30 oralig'ida qoldiring
- Birinchi marta so'ralgan (hali keshlanmagan) video sal sekinroq boshlanishi mumkin — bu normal, chunki Telegram'dan birinchi baytlar kelishini kutish kerak
