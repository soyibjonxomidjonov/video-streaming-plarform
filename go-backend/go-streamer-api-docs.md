# Go Video Streamer — API Documentation

Bu hujjat **frontend** tomonini qurish uchun kerak bo'lgan barcha ma'lumotni o'z ichiga oladi: qanday endpoint bor, qanday parametr yuborish kerak, qanday javob qaytadi, va videoni brauzerda qanday ko'rsatish kerak.

---

## 1. Umumiy arxitektura

```
Brauzer  →  Django (redirect)  →  Go Streamer  →  Telegram (MTProto)
```

Frontend **to'g'ridan-to'g'ri Go serverga emas**, balki **Django endpointiga** murojaat qiladi. Django kerakli `channel` va `message_id`ni bilib, foydalanuvchini avtomatik Go serverga yo'naltiradi (HTTP redirect).

Frontend uchun bitta qoida: **har doim Django URL'ini ishlating**, Go URL'ini frontend kodida qattiq yozib qo'ymang (chunki portlar/manzillar o'zgarishi mumkin).

---

## 2. Asosiy endpoint (Django orqali)

### Film uchun
```
GET /v1/movie/{id}/stream/
```

### Epizod uchun
```
GET /v1/episode/{id}/stream/
```

**Javob:** `302 Found` redirect → brauzer avtomatik Go serverga (`/stream?channel=...&message_id=...`) yo'naltiriladi.

Frontend buni **oddiy URL sifatida** ishlatishi kerak — redirectni brauzer o'zi avtomatik bajaradi, frontend kodida buni alohida boshqarish shart emas (video pleyerga to'g'ridan-to'g'ri shu URL beriladi).

---

## 3. Video pleyerda ishlatish (asosiy usul)

Eng oddiy va tavsiya etiladigan yo'l — brauzerning o'zining HTML5 `<video>` elementidan foydalanish. U Range so'rovlarini, seekni, buferlashni **o'zi avtomatik** boshqaradi:

```html
<video controls width="100%">
  <source src="https://SIZNING-DOMENINGIZ/v1/movie/1/stream/" type="video/mp4">
  Brauzeringiz video tegini qo'llab-quvvatlamaydi.
</video>
```

React/JS misolida:

```jsx
function MoviePlayer({ movieId }) {
  return (
    <video controls width="100%" preload="metadata">
      <source src={`/v1/movie/${movieId}/stream/`} type="video/mp4" />
    </video>
  );
}
```

**Muhim:** `preload="metadata"` tavsiya etiladi — bu brauzerga faqat video davomiyligi/o'lchamini oldindan bilib olishni aytadi, butun faylni oldindan yuklashni emas.

---

## 4. Go serverning xom (raw) endpointi

Agar frontend Django'ni chetlab, to'g'ridan-to'g'ri Go bilan ishlashi kerak bo'lsa (masalan, test/debug uchun):

```
GET http://SERVER_IP:8081/stream?channel={channel_name}&message_id={id}
```

### So'rov parametrlari (query params)

| Parametr | Turi | Majburiymi | Tavsif |
|---|---|---|---|
| `channel` | string | Ha | Telegram kanal username'i (masalan `videos_for_llm2`) |
| `message_id` | integer | Ha | Kanaldagi xabar ID'si (video shu xabarda joylashgan) |

Ikkalasi ham berilmasa → `400 Bad Request` qaytadi.

### So'rov headerlari (ixtiyoriy, lekin muhim)

| Header | Tavsif |
|---|---|
| `Range: bytes=START-END` | Videoning qaysi bayt oralig'i kerakligini bildiradi. Berilmasa, server boshidan (0-byte) 1MB'lik dastlabki chunk qaytaradi. Buni **brauzer avtomatik yuboradi** — frontend qo'lda yozishi shart emas |

---

## 5. Javob (Response)

### Muvaffaqiyatli holat — `206 Partial Content`

| Header | Tavsif |
|---|---|
| `Content-Type` | `video/mp4` |
| `Content-Range` | `bytes {start}-{end}/{total_size}` — qaysi qism va umumiy fayl hajmi |
| `Content-Length` | Shu javobda qaytarilgan bayt soni |
| `Accept-Ranges` | `bytes` — server Range so'rovlarini qo'llab-quvvatlashini bildiradi |

Body: xom video baytlari (binary).

### Xato holatlari

| HTTP kod | Sabab | Frontend nima qilishi kerak |
|---|---|---|
| `400 Bad Request` | `channel` yoki `message_id` yuborilmagan | So'rov URL'ini tekshirish (dasturiy xato, odatiy foydalanish bilan chiqmaydi) |
| `404 Not Found` | Video Telegram'da topilmadi (o'chirilgan, noto'g'ri message_id) | Foydalanuvchiga "video mavjud emas" xabarini ko'rsatish |
| `416 Range Not Satisfiable` | So'ralgan bayt oralig'i fayl hajmidan katta | Odatda video pleyer o'zi bunga duch kelmaydi, lekin qayta yuklash tavsiya qilinadi |
| `502 Bad Gateway` | Telegram MTProto xatosi (masalan vaqtinchalik tarmoq muammosi) | Foydalanuvchiga "biroz kutib qayta urinib ko'ring" xabarini ko'rsatish, ixtiyoriy avtomatik qayta urinish (retry) qo'shish mumkin |
| `503 Service Unavailable` | Hech qanday bot faol emas (server tomonidagi vaqtinchalik muammo) | Xuddi 502 kabi — qayta urinish tavsiya etiladi |

---

## 6. CORS

Server barcha originlarga ruxsat beradi (`Access-Control-Allow-Origin: *`), shuning uchun frontend istalgan domendan so'rov yubora oladi — qo'shimcha CORS sozlash frontend tomonida kerak emas.

**Eslatma:** brauzer manzil qatoriga yozib ochish yoki `<video>` tegi orqali ishlatish — muammosiz. Lekin `fetch()`/`XMLHttpRequest` orqali dasturiy tarzda chaqirilsa va bu **redirect zanjiriga** (Django → Go) tegsa, ba'zi holatlarda (masalan Swagger UI kabi vositalarda) CORS bilan bog'liq cheklovlarga duch kelinishi mumkin. Oddiy video pleyer (`<video src=...>`) ishlatilganda bu muammo yo'q.

---

## 7. Seek (oldinga/orqaga surish) qanday ishlaydi

Frontend hech narsa qilishi shart emas — bu **to'liq avtomatik**:

1. Foydalanuvchi progress-bar'da biror nuqtaga bosadi
2. Brauzer o'zi `Range: bytes={yangi_offset}-` headeri bilan yangi so'rov yuboradi
3. Server o'sha nuqtadan boshlab kerakli chunkni Telegram'dan olib, qaytaradi

Bu — standart HTML5 video xatti-harakati, alohida JS kodi yozish shart emas.

---

## 8. Yuklab olish (download) funksiyasi qo'shmoqchi bo'lsangiz

Agar "Yuklab olish" tugmasi kerak bo'lsa, oddiy `<a>` linkidan foydalanish mumkin:

```html
<a href="/v1/movie/1/stream/" download="film.mp4">Yuklab olish</a>
```

**Eslatma:** hozirgi server arxitekturasi progressiv streaming uchun optimallashtirilgan, katta faylni to'liq "yuklab olish" so'ralganda ham ishlaydi, lekin bu maxsus optimallashtirilgan yo'l emas — sekinroq bo'lishi mumkin.

---

## 9. Health-check (server holatini tekshirish)

```
GET http://SERVER_IP:8081/health
```

Javob (`200 OK`):
```
OK | Active MTProto Workers: 1
```

Frontend'da bu odatda kerak emas, lekin monitoring/admin panel qurilsa foydali bo'ladi.

---

## 10. Frontend uchun amaliy tavsiyalar

- **Loading holatini ko'rsating**: video birinchi marta ochilganda Telegram'dan ma'lumot olish biroz vaqt olishi mumkin (0.5–2 soniya). `<video>` elementining `onwaiting` / `onplaying` hodisalaridan foydalanib, "Yuklanmoqda..." indikatorini ko'rsatish tavsiya etiladi.

- **Xatolarni ushlang**: `<video>` elementining `onerror` hodisasidan foydalanib, `404`/`502` kabi holatlarda foydalanuvchiga tushunarli xabar ko'rsating (masalan "Video hozircha mavjud emas, birozdan so'ng qayta urinib ko'ring").

```jsx
<video
  controls
  onError={(e) => console.error("Video xatosi:", e)}
  src={`/v1/movie/${movieId}/stream/`}
/>
```

- **Bir nechta sifat (quality) tanlovi hozircha yo'q** — server faqat Telegram'da saqlangan original faylni beradi, transkodlash (720p/1080p tanlash) qilinmaydi.

- **Progress/davom ettirish (resume watching)** funksiyasi kerak bo'lsa, bu **frontend tomonida** (localStorage yoki backend'dagi alohida "watch progress" jadvali orqali) amalga oshirilishi kerak — Go streamer bu haqda hech narsa bilmaydi, u faqat bayt oqimini beradi.

---

## 11. Hozirgi cheklovlar (frontend qurayotganda bilib qo'yish kerak)

- Server hozircha **1 ta Telegram bot** bilan ishlayapti — bir vaqtda juda ko'p foydalanuvchi bo'lsa, ba'zi so'rovlar sekinlashishi yoki vaqtincha xato (`502`) qaytarishi mumkin. Frontend tomonida video xatosi chiqsa, **avtomatik bir marta qayta urinish** (retry) qo'shish tavsiya etiladi.
- Video sifat tanlovi, subtitr, ko'p audio-yo'l kabi funksiyalar hozircha backendda yo'q — bular kerak bo'lsa, alohida backend ishi sifatida rejalashtirilishi kerak.

---

*Hujjat versiyasi: v1 — Go streamer'ning joriy holatiga mos (channel+message_id asosidagi avtomatik resolve, 512KB chunk, HTTP Range/seek qo'llab-quvvatlanadi).*
