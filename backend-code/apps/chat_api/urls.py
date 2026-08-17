from django.urls import path, include, re_path
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


from drf_yasg.generators import OpenAPISchemaGenerator
from rest_framework import permissions
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

from .views import MessageViewSet
from  apps.main.views.login_view import GoogleLoginView, EmailLoginView

from apps.main.views import misc_view
from apps.main.views import movie_view
from apps.main.views import series_view
from ..llm.views import SearchIndexViewSet
from ..main.views.misc_view import UserViewSet


class JWTSchemaGenerator(OpenAPISchemaGenerator):

    def get_security_definitions(self):
        security_definitions = super().get_security_definitions()
        security_definitions['Bearer'] = {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        }
        return security_definitions


schema_view = get_schema_view(
    openapi.Info(
        title="Chat API",
        default_version='v1',
        description='Chat API documentation',
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="employes@gmail.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    generator_class=JWTSchemaGenerator,
)

router = DefaultRouter()

# Message
router.register(r'message', MessageViewSet, basename='message')
router.register(r'genre', misc_view.GenreViewSet, basename='genre')
router.register(r'embedding_search', SearchIndexViewSet, basename='searchIndex')
router.register(r'users', UserViewSet, basename='users')


# Series
router.register(r'series', series_view.SeriesViewSet, basename='series')
router.register(r'episode', series_view.EpisodeViewSet, basename='episode')
router.register(r'series-comments', series_view.Comment_SeriesViewSet, basename='series_comment')
router.register(r'series-favourite', series_view.Favorites_SeriesViewSet, basename='series_favourite')
router.register(r'series-rating', series_view.Rating_SeriesViewSet, basename='series_rating')
router.register(r'series-watchprogress', series_view.WatchProgress_EpisodeViewSet, basename='series_watchprogress')





# movies
router.register(r'movie', movie_view.MovieViewSet, basename='movie')
router.register(r'movie-comments', movie_view.Comment_MovieViewSet, basename='movie_comment')
router.register(r'movie-favourite', movie_view.Favorites_MovieViewSet, basename='movie_favourite')
router.register(r'movie-rating', movie_view.Rating_MovieViewSet, basename='movie_rating')
router.register(r'movie-watchprogress', movie_view.WatchProgress_MovieViewSet, basename='movie_watchprogress')







urlpatterns = [
    path('v1/', include(router.urls)),

    #  agar pustoy path() ga kirsa pastagi swaggerga kirib ketadi
    path('', schema_view.with_ui('swagger', cache_timeout=0), name="schema-swagger-ui"),

    # Urllarga Djoserni qo'shish uchun pastagi kodlar
    path('v1/auth/login/', EmailLoginView.as_view({"post": 'send_code_email'}), name='send_code_email'),
    path('v1/auth/code/verify/', EmailLoginView.as_view({"post": 'verify_code_email'}), name='verify_code_email'),
    path('v1/auth/register/', EmailLoginView.as_view({"post": 'register_email'}), name='register_email'),
    path('v1/auth/google/login', GoogleLoginView.as_view(), name='google_login'),




    # path('v1/auth/token/', TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('v1/auth/token/refresh/', TokenRefreshView.as_view(), name="token_refresh"),
    path('v1/auth/token/verify/', TokenVerifyView.as_view(), name="token_verify"),



    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name="schema-json"),
    # ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ shu


    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name="schema-redoc"),

]
