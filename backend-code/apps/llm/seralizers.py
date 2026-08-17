from rest_framework import serializers
from apps.llm.models import SearchIndex


class SearchIndexSerializerConfig(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only=True)

    class Meta:
        model = SearchIndex
        fields = ['content_type', 'object_id', 'title', 'description', 'distance']
        read_only_fields = ("id", )

class SearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=True, allow_blank=False)
    limit = serializers.IntegerField(required=False, default=10, min_value=1, max_value=50)