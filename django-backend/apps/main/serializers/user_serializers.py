from rest_framework import serializers
from django.contrib.auth import get_user_model



User = get_user_model()


class UserSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ('id', 'data_joined')





















