from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets
from apps.main.serializers.misc_serializers import GenreSerializerConfig
from apps.main.models.misc import Genre
from apps.main.permissions import IsStaffOrReadOnly




class CustomPagination(PageNumberPagination):
    page_size = 5





class GenreViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = Genre.objects.all()
    serializer_class = GenreSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination





























