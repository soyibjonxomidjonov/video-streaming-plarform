from rest_framework import serializers
from apps.main.models.misc import Genre




class GenreSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = "__all__"
        read_only_fields = ["id"]
