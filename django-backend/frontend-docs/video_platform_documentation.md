# Video-streaming platforma — to'liq texnik dokumentatsiya

## Mundarija

1. [Umumiy arxitektura](#1-umumiy-arxitektura)
2. [Ma'lumotlar modeli (Django)](#2-malumotlar-modeli-django)
3. [Video pipeline — Telegram'dan foydalanuvchigacha](#3-video-pipeline--telegramdan-foydalanuvchigacha)
4. [CDN sozlash (Bunny.net)](#4-cdn-sozlash-bunnynet)
5. [Local Bot API Server](#5-local-bot-api-server)
6. [Celery + navbat tizimi](#6-celery--navbat-tizimi)
7. [LRU kesh siyosati](#7-lru-kesh-siyosati)
8. [To'liq so'rov ketma-ketligi](#8-toliq-sorov-ketma-ketligi)
9. [Miqyoslash va cheklovlar](#9-miqyoslash-va-cheklovlar)

---

## 1. Umumiy arxitektura

```
Foydalanuvchi
    |
    v
   CDN  (Bunny.net Pull Zone)  <-- keshda bo'lsa, shu yerda tugaydi
    |  (faqat kesh miss bo'lganda)
    v
  Django (origin)  --  metadata, autentifikatsiya, saytning barcha logikasi
    |
    v
Local Bot API Server  --  Telegram'dan video stream qilish
    |
    v
  Telegram  (manba, 19,000+ video)
    |
    v
Object Storage  --  bir marta yuklangan videolar shu yerda saqlanadi
```

**Asosiy tamoyil:** video fayllar hech qachon Django serverida saqlanmaydi. Django faqat "trafik nazoratchisi" — kim, qachon, qaysi videoni olishi kerakligini hal qiladi. Haqiqiy video bайtlari — Telegram, Object Storage va CDN orasida aylanadi.

---

## 2. Ma'lumotlar modeli (Django)

Quyidagi model — yuklangan ERD sxemasiga to'liq mos:

```python
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from pgvector.django import VectorField


# ---------- Foydalanuvchi ----------

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        user = self.model(email=self.normalize_email(email), **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    email = models.EmailField(unique=True)
    auth_provider = models.CharField(max_length=20, default="email")  # "email" | "google"
    google_id = models.CharField(max_length=255, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()
    USERNAME_FIELD = "email"


# ---------- Janr ----------

class Genre(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


# ---------- Film ----------

class Movie(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    poster_image = models.ImageField(upload_to="posters/movies/")

    telegram_channel = models.CharField(max_length=255)
    telegram_message_id = models.BigIntegerField()
    telegram_file_id = models.CharField(max_length=255)

    duration_seconds = models.PositiveIntegerField()
    genres = models.ManyToManyField(Genre, related_name="movies")

    # --- Kesh holati (LRU uchun) ---
    is_cached = models.BooleanField(default=False)
    cached_file_path = models.CharField(max_length=500, blank=True, null=True)
    last_accessed_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# ---------- Serial ----------

class Series(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    poster_image = models.ImageField(upload_to="posters/series/")
    genres = models.ManyToManyField(Genre, related_name="series_set")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Episode(models.Model):
    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name="episodes")
    episode_number = models.PositiveIntegerField()

    telegram_channel = models.CharField(max_length=255)
    telegram_message_id = models.BigIntegerField()
    telegram_file_id = models.CharField(max_length=255)

    duration_seconds = models.PositiveIntegerField()

    # --- Kesh holati ---
    is_cached = models.BooleanField(default=False)
    cached_file_path = models.CharField(max_length=500, blank=True, null=True)
    last_accessed_at = models.DateTimeField(blank=True, null=True)  # ERD'da yo'q, LRU uchun tavsiya etiladi

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("series", "episode_number")
        ordering = ["episode_number"]

    def __str__(self):
        return f"{self.series.title} — {self.episode_number}-qism"


# ---------- Tomosha progressi ----------

class WatchProgress_Movie(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    position_seconds = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "movie")


class WatchProgress_Episode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    position_seconds = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "episode")


# ---------- Sevimlilar ----------

class Favorites_Movie(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "movie")


class Favorites_Series(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "series")


# ---------- Izohlar ----------

class Comment_Movie(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class Comment_Series(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# ---------- Reyting ----------

class Rating_Movie(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    stars = models.PositiveSmallIntegerField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "movie")


class Rating_Series(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    stars = models.PositiveSmallIntegerField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "series")


# ---------- Semantik qidiruv (pgvector) ----------

class SearchIndex(models.Model):
    CONTENT_TYPE_CHOICES = [("movie", "Movie"), ("series", "Series")]

    content_type = models.CharField(max_length=10, choices=CONTENT_TYPE_CHOICES)
    object_id = models.IntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField()
    embedding = VectorField(dimensions=1536)  # tanlangan embedding modelga qarab o'zgaradi

    class Meta:
        unique_together = ("content_type", "object_id")
        indexes = [models.Index(fields=["content_type", "object_id"])]
```

**Eslatma:** yuklagan ERD'da `Episode` uchun `last_accessed_at` maydoni yo'q edi, lekin bo'lim 7'dagi LRU siyosati ishlashi uchun bu maydonni `Episode`ga ham qo'shish tavsiya etiladi (yuqoridagi kodda qo'shilgan).

---

## 3. Video pipeline — Telegram'dan foydalanuvchigacha

Video hech qachon oldindan, ommaviy tarzda yuklanmaydi. Buning o'rniga, **talab bo'yicha (on-demand) keshlash** ishlatiladi:

1. Foydalanuvchi filmni birinchi marta so'raydi
2. Django `is_cached` maydoniga qaraydi
3. Agar `False` bo'lsa: Django Local Bot API Server orqali Telegram'dan videoni **stream** qiladi — foydalanuvchiga darhol uzatiladi, shu bilan bir vaqtda Celery fon vazifasi orqali Object Storage'ga nusxa saqlanadi
4. Nusxalash tugagach: `is_cached=True`, `cached_file_path` to'ldiriladi
5. Keyingi barcha so'rovlar — endi Object Storage → CDN orqali, Telegram'ga umuman murojaat qilinmasdan

```python
# views.py (soddalashtirilgan)

async def stream_movie(request, movie_id):
    movie = await Movie.objects.aget(id=movie_id)

    if movie.is_cached:
        # Kesh bor — Object Storage/CDN manziliga redirect
        return redirect(build_cdn_url(movie.cached_file_path))

    # Kesh yo'q — Telegram'dan stream qilib, fonda saqlaymiz
    cache_movie_task.delay(movie.id)  # Celery orqali fon vazifasi
    return StreamingHttpResponse(
        stream_from_telegram(movie.telegram_file_id),
        content_type="video/mp4",
    )
```

---

## 4. CDN sozlash (Bunny.net)

### 4.1. Pull Zone yaratish

1. Bunny.net dashboard → **Pull Zones** → **Add Pull Zone**
2. **Origin URL** maydoniga Django backend manzilingizni kiriting:
   ```
   https://sizningsayt.com/api/video/
   ```
3. Zone nomini tanlang (masalan `sizningloyiha`) — Bunny sizga quyidagi manzilni beradi:
   ```
   https://sizningloyiha.b-cdn.net
   ```

### 4.2. Frontend'da ishlatish

```html
<!-- Avval -->
<video src="https://sizningsayt.com/api/video/45/">

<!-- CDN bilan -->
<video src="https://sizningloyiha.b-cdn.net/45/">
```

### 4.3. Cache headers (Django tomonida)

CDN to'g'ri keshlashi uchun, Django javobida quyidagi header'lar bo'lishi kerak:

```python
response["Cache-Control"] = "public, max-age=2592000"  # 30 kun
response["Content-Type"] = "video/mp4"
response["Accept-Ranges"] = "bytes"  # video oldinga/orqaga surish uchun zarur
```

### 4.4. Narxlash (2026-yil holatiga ko'ra, tekshirib turing)

| Xizmat | Narx |
|---|---|
| Standard Network (Yevropa/Amerika) | ~$0.01/GB |
| Volume Network (500TB gacha) | ~$0.005/GB |
| Storage | ~$0.005-0.02/GB/oy |
| Oylik minimal to'lov | $1 |

---

## 5. Local Bot API Server

Standart Telegram Bot API orqali **20MB'dan katta faylni yuklab bo'lmaydi**. Sizning 500MB–4GB'lik videolaringiz uchun bu limit yetarli emas — shuning uchun **Local Bot API Server** shart.

### 5.1. Muhim tushuncha

Local Bot API Server — bu, sizning shaxsiy hisobingiz emas, **bot** bo'lib qoladi, faqat cheklovlar olib tashlanadi:

- **Download** (Telegram'dan siz olganda) — cheklovsiz
- **Upload** (siz Telegram'ga yuborganingizda) — 2000MB (2GB) bilan cheklangan (sizga tegishli emas, chunki siz faqat yuklab olyapsiz)

### 5.2. Docker orqali ishga tushirish

```yaml
# docker-compose.yml
services:
  telegram-bot-api:
    image: aiogram/telegram-bot-api:latest
    environment:
      TELEGRAM_API_ID: "SIZNING_API_ID"
      TELEGRAM_API_HASH: "SIZNING_API_HASH"
      TELEGRAM_LOCAL: "true"
    ports:
      - "8081:8081"
    volumes:
      - telegram-bot-api-data:/var/lib/telegram-bot-api

volumes:
  telegram-bot-api-data:
```

`api_id` va `api_hash` — https://my.telegram.org saytidan olinadi.

---

## 6. Celery + navbat tizimi

### 6.1. Nega gevent/eventlet pool

Video yuklash — I/O-bound vazifa (protsessor emas, tarmoq kutish). Shuning uchun standart "prefork" pool o'rniga:

```bash
celery -A myproject worker --pool=gevent --concurrency=15 -Q video_fetch
```

### 6.2. Alohida navbat

```python
# celery.py
task_routes = {
    "myapp.tasks.cache_movie_task": {"queue": "video_fetch"},
}
```

Video yuklash vazifalarini boshqa (email, bildirishnoma) tasklardan ajratib turish — biri ikkinchisiga xalaqit bermasligi uchun.

### 6.3. Broker tanlovi

Hozirgi miqyosingiz (10-20 parallel yuklash) uchun **Redis** yetarli — RabbitMQ ortiqcha murakkablik keltiradi. RabbitMQ'ni faqat murakkab ustuvorlik/routing kerak bo'lganda ko'rib chiqing.

---

## 7. LRU kesh siyosati

Barcha ko'rilgan videoni abadiy saqlash — saqlash xarajatini cheksiz oshiradi. Buning o'rniga, davriy Celery vazifasi eng kam ishlatilgan videolarni o'chiradi:

```python
# tasks.py

from celery import shared_task
from django.utils import timezone
from datetime import timedelta

MAX_CACHE_SIZE_GB = 500  # sizning byudjetingizga qarab sozlanadi

@shared_task
def evict_lru_cache():
    threshold = timezone.now() - timedelta(days=30)
    stale_movies = Movie.objects.filter(
        is_cached=True,
        last_accessed_at__lt=threshold,
    ).order_by("last_accessed_at")

    for movie in stale_movies:
        delete_from_storage(movie.cached_file_path)
        movie.is_cached = False
        movie.cached_file_path = None
        movie.save(update_fields=["is_cached", "cached_file_path"])
```

Bu vazifa Celery Beat orqali, masalan har kuni bir marta ishga tushiriladi.

---

## 8. To'liq so'rov ketma-ketligi

```
1. Foydalanuvchi → CDN (b-cdn.net) so'rov yuboradi
2. CDN o'z keshini tekshiradi
   |
   ├── KESH HIT  → to'g'ridan-to'g'ri javob beradi
   │                (Django, Local Bot API, Telegram — hech biri ishlamaydi)
   │
   └── KESH MISS → CDN origin'ga (Django) murojaat qiladi
                    |
                    Django Object Storage'da bormi, tekshiradi
                    |
                    ├── Bor  → storage manzilini qaytaradi
                    │
                    └── Yo'q → Local Bot API orqali Telegram'dan stream qiladi
                                + fonda (Celery) Object Storage'ga saqlaydi
                    |
                    Javob CDN orqali o'tadi, CDN uni keshlab qo'yadi
```

---

## 9. Miqyoslash va cheklovlar

| Muammo | Yechim |
|---|---|
| 20MB Bot API limiti | Local Bot API Server |
| Server bandwidth tiqilishi (ko'p cold-fetch) | Concurrency chegarasi (15-20) + navbat + foydalanuvchiga status ko'rsatish |
| Saqlash xarajati cheksiz o'sishi | LRU eviction siyosati |
| Bitta server yetmasa | Boshqa provayderda ikkinchi Local Bot API Server + load balancing |
| Trial kredit tugashi | Real byudjet bilan pay-as-you-go rejimga o'tish |

**Muhim eslatma:** ushbu hujjatdagi barcha narx va limit ma'lumotlari (Bunny.net, Telegram Bot API) yozilgan vaqtdagi holatga tegishli — amalga oshirishdan oldin rasmiy hujjatlardan (bunny.net/pricing, core.telegram.org/bots/api) tekshirib chiqish tavsiya etiladi.
