from rest_framework import serializers
from django.contrib.auth import get_user_model



User = get_user_model()


class UserSerializerConfig(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ('id', 'date_joined')





















