from django_filters import rest_framework as django_filters  # pip install django-filter
from apps.main.models.movies import (
    Movie,
    WatchProgress_Movie,
    Favorites_Movie,
    Comment_Movie,
    Rating_Movie,
)


class MovieFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name="title", lookup_expr="icontains")
    description = django_filters.CharFilter(field_name="description", lookup_expr="icontains")

    genre = django_filters.NumberFilter(field_name="genres__id")
    genre_name = django_filters.CharFilter(field_name="genres__name", lookup_expr="icontains")

    telegram_channel = django_filters.CharFilter(field_name="telegram_channel", lookup_expr="icontains")

    duration_seconds = django_filters.NumberFilter(field_name="duration_seconds", lookup_expr="exact")
    duration_min = django_filters.NumberFilter(field_name="duration_seconds", lookup_expr="gte")
    duration_max = django_filters.NumberFilter(field_name="duration_seconds", lookup_expr="lte")

    is_cashed = django_filters.BooleanFilter(field_name="is_cashed")
    has_cache_file = django_filters.BooleanFilter(field_name="cashed_file_path", lookup_expr="isnull", exclude=True)

    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    ordering = django_filters.OrderingFilter(
        fields=(
            ("title", "title"),
            ("created_at", "created_at"),
            ("duration_seconds", "duration_seconds"),
        )
    )

    class Meta:
        model = Movie
        fields = ["title", "description", "genre", "telegram_channel", "is_cashed"]


class WatchProgressMovieFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name="user__id")
    movie = django_filters.NumberFilter(field_name="movie__id")

    position_seconds = django_filters.NumberFilter(field_name="position_seconds", lookup_expr="exact")
    position_min = django_filters.NumberFilter(field_name="position_seconds", lookup_expr="gte")
    position_max = django_filters.NumberFilter(field_name="position_seconds", lookup_expr="lte")

    updated_after = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="gte")
    updated_before = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="lte")

    class Meta:
        model = WatchProgress_Movie
        fields = ["user", "movie"]


class FavoritesMovieFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name="user__id")
    movie = django_filters.NumberFilter(field_name="movie__id")

    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Favorites_Movie
        fields = ["user", "movie"]


class CommentMovieFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name="user__id")
    movie = django_filters.NumberFilter(field_name="movie__id")
    text = django_filters.CharFilter(field_name="text", lookup_expr="icontains")

    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    ordering = django_filters.OrderingFilter(
        fields=(("created_at", "created_at"),)
    )

    class Meta:
        model = Comment_Movie
        fields = ["user", "movie", "text"]


class RatingMovieFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name="user__id")
    movie = django_filters.NumberFilter(field_name="movie__id")

    stars = django_filters.NumberFilter(field_name="stars", lookup_expr="exact")
    stars_min = django_filters.NumberFilter(field_name="stars", lookup_expr="gte")
    stars_max = django_filters.NumberFilter(field_name="stars", lookup_expr="lte")

    updated_after = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="gte")
    updated_before = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="lte")

    class Meta:
        model = Rating_Movie
        fields = ["user", "movie", "stars"]
