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
        fields = ['id', 'email', 'first_name', 'last_name', 'age', "password"]
        read_only_fields = ['id', 'email']





















