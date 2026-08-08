from .login_view import GoogleLoginView, EmailLoginView

from .misc_view import GenreViewSet

from .movie_view import (MovieViewSet, Favorites_MovieViewSet, Rating_MovieViewSet,
Comment_MovieViewSet, WatchProgress_MovieViewSet)


from .series_view import (SeriesViewSet, EpisodeViewSet, Favorites_SeriesViewSet, Rating_SeriesViewSet,
Comment_SeriesViewSet, WatchProgress_EpisodeViewSet
                          )
