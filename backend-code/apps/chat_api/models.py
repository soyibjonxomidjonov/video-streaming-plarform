from django.db import models
from django.conf import settings



class Message(models.Model):
    room_name = models.CharField(max_length=150, null=True, blank=True)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    chat_id = models.IntegerField(null=True, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.room_name}: {self.message[:50]}"


class UserActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    chat_id = models.IntegerField()
    connected_at = models.DateTimeField(auto_now_add=True)
    disconnected_at = models.DateTimeField(blank=True, null=True)