from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets

from apps.main.filters.movies_filter import MovieFilter, CommentMovieFilter, RatingMovieFilter, FavoritesMovieFilter, \
    WatchProgressMovieFilter
from apps.main.serializers.movie_serializers import (MovieSerializerConfig, Rating_MovieSerializerConfig,
                                                     Comment_MovieSerializerConfig, Favorites_MovieSerializerConfig,
                                                     WatchProgress_MovieSerializerConfig)
from apps.main.models.movies import Movie, Rating_Movie, Comment_Movie, Favorites_Movie, WatchProgress_Movie
from apps.main.permissions import IsStaffOrReadOnly, IsOwnerOrReadOnly

from rest_framework.decorators import action
from django.http import HttpResponseRedirect
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from django_filters import rest_framework as django_filters  # pip install django-filter
from rest_framework import filters

class CustomPagination(PageNumberPagination):
    page_size = 5





class MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Movie.objects.all()
    serializer_class = MovieSerializerConfig
    filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    filterset_class = MovieFilter
    search_fields = ['title', 'description', 'genres__name', 'telegram_channel']
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
        url = (
        f"{settings.GO_STREAMER_BASE_URL}/stream"
        f"?channel={movie.telegram_channel}&message_id={movie.telegram_message_id}"
    )
        return HttpResponseRedirect(url)


class Comment_MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsOwnerOrReadOnly]
    queryset = Comment_Movie.objects.all()
    serializer_class = Comment_MovieSerializerConfig
    filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    filterset_class = CommentMovieFilter
    search_fields = ['text', 'user__email', 'user__first_name', 'user__last_name', 'movie__title']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class Rating_MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsOwnerOrReadOnly]
    queryset = Rating_Movie.objects.all()
    serializer_class = Rating_MovieSerializerConfig
    filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    filterset_class = RatingMovieFilter
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'movie__title']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class Favorites_MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsOwnerOrReadOnly]
    queryset = Favorites_Movie.objects.all()
    serializer_class = Favorites_MovieSerializerConfig
    filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    filterset_class = FavoritesMovieFilter
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'movie__title']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)



class WatchProgress_MovieViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsOwnerOrReadOnly]
    queryset = WatchProgress_Movie.objects.all()
    serializer_class = WatchProgress_MovieSerializerConfig
    filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    filterset_class = WatchProgressMovieFilter
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'movie__title']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
