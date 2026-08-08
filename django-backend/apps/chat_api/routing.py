from django.urls import re_path
from apps.chat_api.consumers import ChatConsumer
from apps.chat_api.consumers.ai_consumers import AIConsumer

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_name>\w+)/$", ChatConsumer.as_asgi()),
    re_path(r"ws/agent/(?P<session_id>\w+)/$", AIConsumer.as_asgi()),
]