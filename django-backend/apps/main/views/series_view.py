from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets
from apps.main.serializers.series_serializers import (SeriesSerializerConfig, EpisodeSerializerConfig,
                                                     Rating_SeriesSerializerConfig, Favorites_SeriesSerializerConfig,
                                                     WatchProgress_EpisodeSerializerConfig, Comment_SeriesSerializerConfig
                                                      )
from apps.main.models.series import Series, Episode ,Rating_Series, Comment_Series, Favorites_Series, WatchProgress_Episode
from apps.main.permissions import IsStaffOrReadOnly

from rest_framework.decorators import action
from django.http import HttpResponseRedirect
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status


class CustomPagination(PageNumberPagination):
    page_size = 5





class SeriesViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Series.objects.all()
    serializer_class = SeriesSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination

class EpisodeViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Episode.objects.all()
    serializer_class = EpisodeSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination

    @action(detail=True, methods=['get'])
    def stream(self, request, pk=None):
        episode = self.get_object()
        file_id = episode.telegram_file_id
        if not file_id:
            return Response(
                {"error": "Bu video hali tayyor emas (file_id yo'q)"},
                status=status.HTTP_404_NOT_FOUND
            )
        url = f"{settings.GO_STREAMER_BASE_URL}/stream/{file_id}"
        return HttpResponseRedirect(url)

class Rating_SeriesViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Rating_Series.objects.all()
    serializer_class = Rating_SeriesSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination


class Comment_SeriesViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Comment_Series.objects.all()
    serializer_class = Comment_SeriesSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination



class Favorites_SeriesViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Favorites_Series.objects.all()
    serializer_class = Favorites_SeriesSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination


class WatchProgress_EpisodeViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = WatchProgress_Episode.objects.all()
    serializer_class = WatchProgress_EpisodeSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination
