import logging
import random
import asyncio

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import send_mail

from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from drf_yasg.utils import swagger_auto_schema

from celery import shared_task
from django.template.loader import render_to_string

from apps.main.serializers.login_serializers import GoogleLoginSerializer, SendCodeSerializer, VerifyCodeSerializer, \
    RegisterSerializerConfig



User = get_user_model()
logger = logging.getLogger(__name__)





@shared_task
def send_email_task(subject, message, email, fail_silently, verification_code):
    html_message = render_to_string(
        "emails/verification_email.html", {"verification_code": verification_code}
    )

    send_mail(
        subject=subject,
        message=f"{message}: {verification_code}",
        from_email="soyibjonlaptop@gmail.com",
        recipient_list=[email],
        fail_silently=fail_silently,
        html_message = html_message,
    )


class GoogleLoginView(APIView):
    @swagger_auto_schema(request_body=GoogleLoginSerializer)
    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "email": user.email,
            "first_name": user.first_name

        })


class EmailLoginView(viewsets.ViewSet):

    @swagger_auto_schema(request_body=SendCodeSerializer)
    def send_code_email(self, request):
        serializer = SendCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        verification_code = str(random.randint(100000, 999999))
        try:



            send_email_task.delay(
                subject="Verification email",
                message=f"Tastiqlash kodingiz",
                email=email,
                fail_silently=False,
                verification_code=verification_code

            )
            logger.info(f"Tasdiqlash kodi Celery navbatiga (queue) muvaffaqiyatli qo'shildi: {email}")
        except Exception as e:
            return Response({"message": f"Error {e}"}, status.HTTP_500_INTERNAL_SERVER_ERROR)

        all_data = {"verification_code": verification_code}

        cache.set(email, all_data, timeout=300)

        return Response({'message': 'Verification code sent successfully.'}, status=status.HTTP_200_OK)


    @swagger_auto_schema(request_body=VerifyCodeSerializer)
    def verify_code_email(self, request):
        serializer = VerifyCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        verify_code = serializer.validated_data['verify_code']
        cached_data = cache.get(email)

        if not cached_data:
             return Response({"message": "The code has expired or the request does not exist."},
                             status=status.HTTP_400_BAD_REQUEST)

        if verify_code == cached_data['verification_code']:

            try:
                first_name, last_name, age =  cached_data['first_name'], cached_data['last_name'], cached_data['age']
            except KeyError:
                first_name, last_name, age = None, None, None


            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    'last_name': last_name,
                    'age': age
                }
            )
            if created:
                user.save()
                print("User created")

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "refresh":str(refresh),
                    "access":str(refresh.access_token),
                }
            )

        return Response({'message': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)


    @swagger_auto_schema(request_body=RegisterSerializerConfig)
    def register_email(self, request):
        serializer = RegisterSerializerConfig(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        verification_code = str(random.randint(100000, 999999))
        try:
            send_email_task.delay(
                subject="Verification email",
                message=f"Tastiqlash kodingiz",
                email=email,
                fail_silently=False,
                verification_code=verification_code

            )
            logger.info(f"Tasdiqlash kodi Celery navbatiga (queue) muvaffaqiyatli qo'shildi: {email}")
        except Exception as e:
            return Response({"message": f"Error {e}"}, status.HTTP_500_INTERNAL_SERVER_ERROR)

        all_data = serializer.validated_data
        all_data['verification_code'] = verification_code

        cache.set(email, all_data, timeout=300)

        return Response({'message': 'Verification code sent successfully.'}, status=status.HTTP_200_OK)



















