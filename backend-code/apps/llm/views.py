from pgvector.django import CosineDistance
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response

from apps.llm.seralizers import SearchIndexSerializerConfig ,SearchQuerySerializer
from apps.llm.services.embeddings import embed_text
from apps.main.models import Favorites_Series
from apps.main.permissions import IsStaffOrReadOnly
from apps.llm.models import SearchIndex
from apps.main.views.misc_view import CustomPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi





class SearchIndexViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStaffOrReadOnly]
    queryset = SearchIndex.objects.all()
    serializer_class = SearchIndexSerializerConfig
    # filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    # filterset_class = CategoryFilter
    # search_fields = ['name']
    pagination_class = CustomPagination

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter('q', openapi.IN_QUERY, description="Qidiruv matni", type=openapi.TYPE_STRING, required=True),
            openapi.Parameter('limit', openapi.IN_QUERY, description="Natijalar soni (1-50)", type=openapi.TYPE_INTEGER, required=False),
        ]
    )   
    @action(detail=False, methods=['get'])
    def search(self, request):
        query_serializer = SearchQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        q = query_serializer.validated_data['q']
        limit = query_serializer.validated_data['limit']

        query_embedding = embed_text(text=q)


        results = SearchIndex.objects.annotate(
            distance=CosineDistance('embedding', query_embedding)
        ).order_by('distance')[:limit]
        result_serializer = SearchIndexSerializerConfig(results, many=True)
        return Response(result_serializer.data)


















