from django_filters import rest_framework as django_filters  # pip install django-filter
from apps.main.models.misc import Genre


class GenreFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = Genre
        fields = ["name"]
