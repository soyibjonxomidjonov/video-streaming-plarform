# import json
#
# from channels.generic.websocket import  AsyncWebsocketConsumer
# from channels.db import database_sync_to_async, aclose_old_connections
# from chat.models import Message, UserActivity
# from django.utils import timezone
#
#
# class PrivateChatConsumer(AsyncWebsocketConsumer):
#
#     async def connect(self):
#         await aclose_old_connections()
#
#         self.user = self.scope['user'] #Autentifikatsiya bo'lmagan bo'lsa close bo'ladi
#         if self.user.is_anonymous:
#             await self.close()
#             print("Login qilinmagan")
#             return
#
#         print(f"Login qilingan: {self.user.username} | {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
#
#
#
#
#
#         self.chat_id = self.scope['url_route']['kwargs']['chat_id']
#         self.room_chat_id = f"chat_{self.chat_id}"
#         await self.channel_layer.group_add(self.room_chat_id, self.channel_name)
#         await self.accept()
#
#         # DB ga saqlash, activity_id ni bilan birga
#         self.activity = await self.create_activity()
#
#         messages = await self.get_messages()
#         for msg in messages:
#             await self.send(text_data=json.dumps({
#                 "message": msg.message,
#                 "sender": msg.sender.username if msg.sender else "Anonim"
#                   }))
#
#
#
#     async def disconnect(self, code):
#         await aclose_old_connections()
#         # Anonim user close bo'lsa room_chat_id yo'q → AttributeError!
#         if hasattr(self, 'room_chat_id'):
#             await self.channel_layer.group_discard(
#                 self.room_chat_id, self.channel_name
#             )
#
#         if hasattr(self, 'activity'):
#             await self.update_activity()
#
#
#     async def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message = text_data_json['message']
#
#         await self.save_messages(message)
#
#         await self.channel_layer.group_send(
#             self.room_chat_id, {
#                 "type": "chat_message",
#                 "message": message,
#                 "sender": self.user.username # Kim yozgani ham boradi
#             }
#         )
#
#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             "message": event["message"],
#             "sender": event["sender"]
#         }))
#
#     @database_sync_to_async
#     def save_messages(self, message):
#         print(f"Save messages [{message}]")
#         return Message.objects.create(
#             chat_id=self.chat_id,
#             sender=self.user,
#             message=message
#         )
#
#     @database_sync_to_async
#     def get_messages(self):
#         messages = list(
#             Message.objects.filter(
#                 chat_id=self.chat_id
#             ).select_related('sender')
#             .order_by("created_at")
#         )
#
#         print(f"Get messages {messages}")
#         return messages
#
#     @database_sync_to_async
#     def create_activity(self):
#         print("Ulangan vaqt saqlandi")
#         return UserActivity.objects.create(
#             user=self.user,
#             chat_id=self.chat_id
#         )
#
#     @database_sync_to_async
#     def update_activity(self):
#         print("Ulanish uzilgan vaqt saqlandi")
#         UserActivity.objects.filter(id=self.activity.id).update(
#             disconnected_at=timezone.now()
#         )