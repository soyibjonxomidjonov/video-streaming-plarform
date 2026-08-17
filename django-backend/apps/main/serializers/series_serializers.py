from rest_framework import serializers
from apps.main.models.series import (Series, Episode, Rating_Series, Comment_Series, WatchProgress_Episode,
                                     Favorites_Series)




class SeriesSerializerConfig(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    genres = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')
    class Meta:
        model = Series
        fields = "__all__"
        read_only_fields = ("id", "created_at")


    def get_username(self, obj):
        if obj.user:
            return obj.user.first_name or obj.user.email.split('@')[0]
        return "Foydalanuvchi"

class EpisodeSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Episode
        fields = "__all__"
        read_only_fields = ("id", "created_at")



class Rating_SeriesSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Rating_Series
        fields = "__all__"
        read_only_fields = ("id", "updated_at", "user")



class Comment_SeriesSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Comment_Series
        fields = "__all__"
        read_only_fields = ("id", "created_at", "user")



class WatchProgress_EpisodeSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = WatchProgress_Episode
        fields = "__all__"
        read_only_fields = ("id", "updated_at", "user")


class Favorites_SeriesSerializerConfig(serializers.ModelSerializer):
    class Meta:
        model = Favorites_Series
        fields = "__all__"
        read_only_fields = ("id", "created_at", "user")