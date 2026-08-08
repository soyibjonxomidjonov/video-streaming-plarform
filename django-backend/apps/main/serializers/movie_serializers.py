from rest_framework import serializers
from apps.main.models.movies import Movie, Rating_Movie, Comment_Movie, WatchProgress_Movie, Favorites_Movie




class MovieSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = "__all__"
        read_only_fields = ("id", "created_at")


class Rating_MovieSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Rating_Movie
        fields = "__all__"
        read_only_fields = ("id", "updated_at")



class Comment_MovieSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Comment_Movie
        fields = "__all__"
        read_only_fields = ("id", "created_at")



class WatchProgress_MovieSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = WatchProgress_Movie
        fields = "__all__"
        read_only_fields = ("id", "updated_at")


class Favorites_MovieSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Favorites_Movie
        fields = "__all__"
        read_only_fields = ("id", "created_at")