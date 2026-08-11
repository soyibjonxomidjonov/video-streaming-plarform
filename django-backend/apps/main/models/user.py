from django.utils import timezone

from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)

        else:
            user.set_unusable_password()


        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=100, unique=True, null=False, blank=False)
    first_name = models.CharField(max_length=100, null=True)
    last_name = models.CharField(max_length=100, null=True)
    age = models.IntegerField(null=True, blank=True)


    data_joined = models.DateTimeField(default=timezone.now)

    picture = models.ImageField(upload_to='avatars/', null=True, blank=True)

    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    auth_provider = models.CharField(
        max_length=20,
        choices=[("email", "Email"), ("google", "Google")],
        default="email"
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    def save(self, *args, **kwargs):
        if not self.pk and not self.first_name:
            if self.email:
                self.first_name = self.email.split("@")[0]

        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

from rest_framework import permissions


class IsSuperuserOrReadOnly(permissions.BasePermission):
    """
    Agar so'rov yuborgan foydalanuvchi superuser bo'lsa, productlarni
    yaratish/edit/delete qila oladi. Aks holda faqat o'qiy oladi (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        # SAFE_METHODS = GET, HEAD, OPTIONS — bularga hammaga ruxsat
        if request.method in permissions.SAFE_METHODS:
            return True

        # Qolgan metodlar (POST, PUT, PATCH, DELETE) — faqat superuser
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


























