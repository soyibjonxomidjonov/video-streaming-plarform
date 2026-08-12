import json
import asyncio

from channels.generic.websocket import  AsyncWebsocketConsumer
from channels.db import database_sync_to_async, aclose_old_connections
from django.contrib.auth.models import AnonymousUser
from apps.llm.agents.llm_client import route_command


class AIConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        await aclose_old_connections()
        self.user = self.scope['user']

        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        self.session_id = self.scope['url_route']['kwargs']['session_id']
        await self.accept()

        await self.send(
            text_data=json.dumps({
                "type": "connected",
                "session_id": self.session_id
            }
            )
        )


    async def disconnect(self, code):
        await aclose_old_connections()

        pass


    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)

        except (TypeError, json.JSONDecodeError):
            await self.send_error("INVALID_JSON", "Xabar formati noto'g'ri")
            return


        text = data.get("text")
        if not text:
            await self.send_error("EMPTY_TEXT", "Matn bo'sh bo'lishi mumkin emas")
            return
        
        print(f"🚀 process_command task yaratilmoqda: {text}")
        asyncio.create_task(self.process_command(text))



    async def process_command(self, text):
        await self.send(text_data=json.dumps({"type": 'status', "payload": {"state": "thinking"}}))

        try:
            result = await self.run_router(text)

        except Exception as e:
            # Agent/LLM chaqiruvida kutilmagan xato (masalan rate limit,
            # tarmoq xatosi) - foydalanuvchiga tushunarli xabar beramiz,
            # butun consumer'ni "osilib qolishiga" yo'l qo'ymaymiz.
            print(f"agent xatosi: {e}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "payload": {
                    "code": "AGENT_ERROR",
                    "message": "Hozircha javob bera olmadim, birozdan keyin qayta urinib ko'ring"
                }
            }))
            return


        if result["type"] == "escalate":
            # 3-qatlam hali ulanmagan - hozircha foydalanuvchiga xabar beramiz.
            # Keyinchalik shu yerga deep_agent (LangGraph) chaqiruvi qo'shiladi.

            await self.send(
                text_data=json.dumps(
                    {
                        "type": "response",
                        "payload":  {"text": "Bu buyruqni hali to'liq tushuna olmayapman, ustida ishlanmoqda."},

                    }))
            return
        # result["type"] == "action"

        await self.send(text_data=json.dumps(result))


    @database_sync_to_async
    def run_router_sync(self, text):
        # route_command - sinxron funksiya (Groq/LangChain client sinxron
        # chaqiriladi), shuning uchun uni thread pool'da ishga tushiramiz,
        # asosiy event loop'ni bloklamasligi uchun.

        return route_command(text)

    async def run_router(self, text):
        return await self.run_router_sync(text)

    async def send_error(self, code, message):
        await self.send(
            text_data=json.dumps({
                "type": "error",
                "payload": {"code": code, "message": message}
            })
        )
