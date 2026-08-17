from django.contrib.postgres.indexes import GinIndex
from django.db import models
from apps.main.models.misc import Genre

from django.conf import settings

class Series(models.Model):
    title = models.CharField(max_length=250, null=False, blank=False)
    description = models.TextField(null=True, blank=True)
    poster_image = models.ImageField(upload_to="posters/series/")
    genres = models.ManyToManyField(Genre, related_name="series_set")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            GinIndex(fields=['title'], name='series_title_trgm', opclasses=['gin_trgm_ops']),
            GinIndex(fields=['description'], name='series_desc_trgm', opclasses=['gin_trgm_ops']),
        ]



    def __str__(self):
        return self.title



class Episode(models.Model):
    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name="episodes")
    episode_number = models.PositiveIntegerField()

    telegram_channel = models.CharField(max_length=250)
    telegram_message_id = models.BigIntegerField()
    telegram_file_id = models.CharField(max_length=250)

    duration_seconds = models.PositiveIntegerField()

#     kesh xolati uchun
    is_cashed = models.BooleanField(default=False)
    cashed_file_path = models.CharField(max_length=400, null=True, blank=True)
    last_accessed_at = models.DateTimeField(blank=True, null=True)  # ERD'da yo'q, LRU uchun

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("series", "episode_number")
        ordering = ["episode_number"]

    def __str__(self):
        return f"{self.series.title} - {self.episode_number}-qism"




class WatchProgress_Episode(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    position_seconds = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "episode")

class Favorites_Series(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "series")


class Comment_Series(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    text = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

class Rating_Series(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    stars = models.PositiveSmallIntegerField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "series")












