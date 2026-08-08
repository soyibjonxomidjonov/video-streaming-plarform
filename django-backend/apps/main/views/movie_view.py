from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets
from apps.main.serializers.movie_serializers import (MovieSerializerConfig, Rating_MovieSerializerConfig,
                                                     Comment_MovieSerializerConfig, Favorites_MovieSerializerConfig,
                                                     WatchProgress_MovieSerializerConfig)
from apps.main.models.movies import Movie, Rating_Movie, Comment_Movie, Favorites_Movie, WatchProgress_Movie
from apps.main.permissions import IsStaffOrReadOnly

from rest_framework.decorators import action
from django.http import HttpResponseRedirect
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status


class CustomPagination(PageNumberPagination):
    page_size = 5





class MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Movie.objects.all()
    serializer_class = MovieSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination

    @action(detail=True, methods=['get'])
    def stream(self, request, pk=None):
        movie = self.get_object()
        file_id = movie.telegram_file_id
        if not file_id:
            return Response(
                {"error": "Bu video hali tayyor emas (file_id yo'q)"},
                status=status.HTTP_404_NOT_FOUND
            )
        url = f"{settings.GO_STREAMER_BASE_URL}/stream/{file_id}"
        return HttpResponseRedirect(url)


class Comment_MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Comment_Movie.objects.all()
    serializer_class = Comment_MovieSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination

class Rating_MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Rating_Movie.objects.all()
    serializer_class = Rating_MovieSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination


class Favorites_MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Favorites_Movie.objects.all()
    serializer_class = Favorites_MovieSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination



class WatchProgress_MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = WatchProgress_Movie.objects.all()
    serializer_class = WatchProgress_MovieSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination
