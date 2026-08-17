from django.db import models
from apps.main.models.misc import Genre
from django.conf import settings

class Movie(models.Model):
    title = models.CharField(max_length=250, null=False, blank=False)
    description = models.TextField(null=True, blank=True)
    poster_image = models.ImageField(upload_to="posters/movies/", null=True)

    telegram_channel = models.CharField(max_length=250)
    telegram_message_id = models.BigIntegerField()
    telegram_file_id = models.CharField(max_length=250)

    genres = models.ManyToManyField(Genre, related_name="movies")
    duration_seconds = models.PositiveIntegerField()

    #     kesh xolati uchun
    is_cashed = models.BooleanField(default=False, null=True)
    cashed_file_path = models.CharField(max_length=400, null=True, blank=True)
    last_accessed_at = models.DateTimeField(blank=True, null=True)  # ERD'da yo'q, LRU uchun

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title





class WatchProgress_Movie(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    position_seconds = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "movie")

class Favorites_Movie(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "movie")


class Comment_Movie(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Rating_Movie(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    stars = models.PositiveSmallIntegerField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "movie")

