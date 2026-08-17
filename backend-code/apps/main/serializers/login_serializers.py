import requests
from rest_framework import serializers
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from django.core.files.base import ContentFile
from apps.main.models import CustomUser


class SendCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    verify_code = serializers.CharField()



class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField(write_only=True)

    def validate_id_token(self, value):
        try:
            idinfo = id_token.verify_oauth2_token(
                value,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            raise serializers.ValidationError("Google token yaroqsiz yoki muddati o'tkan")

        self.context['google_data'] = idinfo
        return value

    def create(self, validated_data):
        google_data = self.context['google_data']

        email = google_data['email']
        google_id = google_data['sub']
        picture_url = google_data.get('picture')

        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                'google_id': google_id,
                'auth_provider': 'google',
            },

        )


        if not created and not user.google_id:
            user.google_id = google_id
            user.auth_provider = 'google'
            user.save(update_fields=["google_id", "auth_provider"])

        if picture_url and not user.picture:
            try:
                response = requests.get(picture_url, timeout=5)
                if response.status_code == 200:
                    file_name = f"avatar_{user.id}.jpg"
                    user.picture.save(file_name, ContentFile(response.content), save=True)
            except requests.RequestException:
                pass

        return user



class RegisterSerializerConfig(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    age = serializers.IntegerField()








































