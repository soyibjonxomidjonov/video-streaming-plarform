from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.chat_api.models import Message
from apps.chat_api.serializers import MessageSerializerConfig
from rest_framework import viewsets




class CustomPagination(PageNumberPagination):
    page_size = 5


class MessageViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Message.objects.all()
    serializer_class = MessageSerializerConfig
    pagination_class = CustomPagination
