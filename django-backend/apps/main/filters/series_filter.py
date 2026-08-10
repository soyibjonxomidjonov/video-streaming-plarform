from django_filters import rest_framework as django_filters  # pip install django-filter
from apps.main.models.series import (
    Series,
    Episode,
    WatchProgress_Episode,
    Favorites_Series,
    Comment_Series,
    Rating_Series,
)


class SeriesFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name="title", lookup_expr="icontains")
    description = django_filters.CharFilter(field_name="description", lookup_expr="icontains")

    genre = django_filters.NumberFilter(field_name="genres__id")
    genre_name = django_filters.CharFilter(field_name="genres__name", lookup_expr="icontains")

    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    ordering = django_filters.OrderingFilter(
        fields=(
            ("title", "title"),
            ("created_at", "created_at"),
        )
    )

    class Meta:
        model = Series
        fields = ["title", "description", "genre"]


class EpisodeFilter(django_filters.FilterSet):
    series = django_filters.NumberFilter(field_name="series__id")
    series_title = django_filters.CharFilter(field_name="series__title", lookup_expr="icontains")

    episode_number = django_filters.NumberFilter(field_name="episode_number", lookup_expr="exact")
    episode_number_min = django_filters.NumberFilter(field_name="episode_number", lookup_expr="gte")
    episode_number_max = django_filters.NumberFilter(field_name="episode_number", lookup_expr="lte")

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
            ("episode_number", "episode_number"),
            ("created_at", "created_at"),
            ("duration_seconds", "duration_seconds"),
        )
    )

    class Meta:
        model = Episode
        fields = ["series", "episode_number", "telegram_channel", "is_cashed"]


class WatchProgressEpisodeFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name="user__id")
    episode = django_filters.NumberFilter(field_name="episode__id")
    series = django_filters.NumberFilter(field_name="episode__series__id")

    position_seconds = django_filters.NumberFilter(field_name="position_seconds", lookup_expr="exact")
    position_min = django_filters.NumberFilter(field_name="position_seconds", lookup_expr="gte")
    position_max = django_filters.NumberFilter(field_name="position_seconds", lookup_expr="lte")

    updated_after = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="gte")
    updated_before = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="lte")

    class Meta:
        model = WatchProgress_Episode
        fields = ["user", "episode"]


class FavoritesSeriesFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name="user__id")
    series = django_filters.NumberFilter(field_name="series__id")

    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Favorites_Series
        fields = ["user", "series"]


class CommentSeriesFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name="user__id")
    series = django_filters.NumberFilter(field_name="series__id")
    text = django_filters.CharFilter(field_name="text", lookup_expr="icontains")

    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    ordering = django_filters.OrderingFilter(
        fields=(("created_at", "created_at"),)
    )

    class Meta:
        model = Comment_Series
        fields = ["user", "series", "text"]


class RatingSeriesFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name="user__id")
    series = django_filters.NumberFilter(field_name="series__id")

    stars = django_filters.NumberFilter(field_name="stars", lookup_expr="exact")
    stars_min = django_filters.NumberFilter(field_name="stars", lookup_expr="gte")
    stars_max = django_filters.NumberFilter(field_name="stars", lookup_expr="lte")

    updated_after = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="gte")
    updated_before = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="lte")

    class Meta:
        model = Rating_Series
        fields = ["user", "series", "stars"]
