from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets
from apps.main.serializers.misc_serializers import GenreSerializerConfig
from apps.main.models.misc import Genre
from apps.main.permissions import IsStaffOrReadOnly,IsSuperuserOrReadOnly

from apps.main.filters.misc_filter import GenreFilter
from django_filters import rest_framework as django_filters  # pip install django-filter
from rest_framework import filters
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from apps.main.serializers.user_serializers import UserSerializerConfig

User = get_user_model()

class CustomPagination(PageNumberPagination):
    page_size = 5





class GenreViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Genre.objects.all()
    serializer_class = GenreSerializerConfig
    filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    filterset_class = GenreFilter
    search_fields = ['name']
    pagination_class = CustomPagination



class UserViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = UserSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
   # filterset_class = GenreFilter
    # search_fields = ['name']
    pagination_class = CustomPagination

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user

        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return None

























