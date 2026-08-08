from rest_framework import serializers
from apps.chat_api.models import Message
class MessageSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = "__all__"
        read_only_fields = ['id', 'created_at']