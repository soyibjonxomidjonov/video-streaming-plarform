from urllib.parse import parse_qs

from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

User = get_user_model()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Query string dan token olamiz
        # ws://localhost:8000/ws/chat/test/?token=xxx

        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        if token:
            scope["user"] = await self.get_user(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    async def get_user(self, token):
        try:
            # Token imzosi va muddatini shu yerning o'zida (lokal) tekshiramiz,
            # tashqi auth_service'ga so'rov yubormaymiz
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
        except (TokenError, InvalidToken) as e:
            print(f"❌ TOKEN XATO: {e}")
            return AnonymousUser()
        except Exception as e:
            print(f"❌ MIDDLEWARE XATO: {e}")
            return AnonymousUser()

        return await self.get_user_from_db(user_id)

    @database_sync_to_async
    def get_user_from_db(self, user_id):
        try:
            user = User.objects.get(id=user_id)
            print(f"Foydalanuvchi topildi: {user.email}")
            return user
        except User.DoesNotExist:
            print(f"❌ Foydalanuvchi topilmadi: id={user_id}")
            return AnonymousUser()