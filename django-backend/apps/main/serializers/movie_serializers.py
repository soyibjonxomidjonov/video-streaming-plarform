from rest_framework import serializers
# pyrefly: ignore [missing-import]
from apps.main.models.movies import Movie, Rating_Movie, Comment_Movie, WatchProgress_Movie, Favorites_Movie




class MovieSerializerConfig(serializers.ModelSerializer):

    genres = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')

    class Meta:
        model = Movie
        fields = "__all__"
        read_only_fields = ("id", "created_at")


class Rating_MovieSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Rating_Movie
        fields = "__all__"
        read_only_fields = ("id", "updated_at", "user")


class Comment_MovieSerializerConfig(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = Comment_Movie
        fields = "__all__"
        read_only_fields = ("id", "created_at", "user")

    def get_username(self, obj):
        if obj.user:
            return obj.user.first_name or obj.user.email.split('@')[0]
        return "Foydalanuvchi"


class WatchProgress_MovieSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = WatchProgress_Movie
        fields = "__all__"
        read_only_fields = ("id", "updated_at", "user")


class Favorites_MovieSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Favorites_Movie
        fields = "__all__"
        read_only_fields = ("id", "created_at", "user")