import { api } from './api-client';
import { API } from '../config/env';
import {
  MovieFavorite, SeriesFavorite,
  MovieWatchProgress, EpisodeWatchProgress,
  MovieRating, SeriesRating,
  MovieComment, SeriesComment,
  PaginatedResponse,
} from '../types';

// ─── Favorites ──────────────────────────────────────────────
export const favoritesService = {
  getMovieFavorites: (params?: Record<string, string | number>) => {
    let url = API.MOVIE_FAVORITES;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.append(k, String(v)); });
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    return api.get<PaginatedResponse<MovieFavorite>>(url);
  },
  addMovieFavorite: (movie: number, user: number) =>
    api.post<MovieFavorite>(API.MOVIE_FAVORITES, { movie, user }),
  removeMovieFavorite: (id: number) =>
    api.delete<void>(API.MOVIE_FAVORITE(id)),

  getSeriesFavorites: (params?: Record<string, string | number>) => {
    let url = API.SERIES_FAVORITES;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.append(k, String(v)); });
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    return api.get<PaginatedResponse<SeriesFavorite>>(url);
  },
  addSeriesFavorite: (series: number, user: number) =>
    api.post<SeriesFavorite>(API.SERIES_FAVORITES, { series, user }),
  removeSeriesFavorite: (id: number) =>
    api.delete<void>(API.SERIES_FAVORITE(id)),
};

// ─── Watch Progress ──────────────────────────────────────────
export const watchProgressService = {
  getMovieProgress: (params?: Record<string, string | number>) => {
    let url = API.MOVIE_WATCHPROGRESS;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.append(k, String(v)); });
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    return api.get<PaginatedResponse<MovieWatchProgress>>(url);
  },
  saveMovieProgress: (movie: number, user: number, position_seconds: number) =>
    api.post<MovieWatchProgress>(API.MOVIE_WATCHPROGRESS, { movie, user, position_seconds }),
  updateMovieProgress: (id: number, position_seconds: number) =>
    api.patch<MovieWatchProgress>(API.MOVIE_WATCHPROGRESS_ITEM(id), { position_seconds }),

  getEpisodeProgress: (params?: Record<string, string | number>) => {
    let url = API.EPISODE_WATCHPROGRESS;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.append(k, String(v)); });
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    return api.get<PaginatedResponse<EpisodeWatchProgress>>(url);
  },
  saveEpisodeProgress: (episode: number, user: number, position_seconds: number) =>
    api.post<EpisodeWatchProgress>(API.EPISODE_WATCHPROGRESS, { episode, user, position_seconds }),
  updateEpisodeProgress: (id: number, position_seconds: number) =>
    api.patch<EpisodeWatchProgress>(API.EPISODE_WATCHPROGRESS_ITEM(id), { position_seconds }),
};

// ─── Ratings ──────────────────────────────────────────────
export const ratingsService = {
  getMovieRatings: (params?: Record<string, string | number>) => {
    let url = API.MOVIE_RATINGS;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.append(k, String(v)); });
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    return api.get<PaginatedResponse<MovieRating>>(url);
  },
  rateMovie: (movie: number, user: number, stars: number) =>
    api.post<MovieRating>(API.MOVIE_RATINGS, { movie, user, stars }),
  updateMovieRating: (id: number, stars: number) =>
    api.patch<MovieRating>(API.MOVIE_RATING(id), { stars }),
  deleteMovieRating: (id: number) =>
    api.delete<void>(API.MOVIE_RATING(id)),

  getSeriesRatings: (params?: Record<string, string | number>) => {
    let url = API.SERIES_RATINGS;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.append(k, String(v)); });
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    return api.get<PaginatedResponse<SeriesRating>>(url);
  },
  rateSeries: (series: number, user: number, stars: number) =>
    api.post<SeriesRating>(API.SERIES_RATINGS, { series, user, stars }),
  updateSeriesRating: (id: number, stars: number) =>
    api.patch<SeriesRating>(API.SERIES_RATING(id), { stars }),
  deleteSeriesRating: (id: number) =>
    api.delete<void>(API.SERIES_RATING(id)),
};

// ─── Comments ──────────────────────────────────────────────
export const commentsService = {
  getMovieComments: (params?: Record<string, string | number>) => {
    let url = API.MOVIE_COMMENTS;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.append(k, String(v)); });
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    return api.get<PaginatedResponse<MovieComment>>(url);
  },
  addMovieComment: (movie: number, user: number, text: string) =>
    api.post<MovieComment>(API.MOVIE_COMMENTS, { movie, user, text }),
  deleteMovieComment: (id: number) =>
    api.delete<void>(API.MOVIE_COMMENT(id)),

  getSeriesComments: (params?: Record<string, string | number>) => {
    let url = API.SERIES_COMMENTS;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.append(k, String(v)); });
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    return api.get<PaginatedResponse<SeriesComment>>(url);
  },
  addSeriesComment: (series: number, user: number, text: string) =>
    api.post<SeriesComment>(API.SERIES_COMMENTS, { series, user, text }),
  deleteSeriesComment: (id: number) =>
    api.delete<void>(API.SERIES_COMMENT(id)),
};

// ─── Search ──────────────────────────────────────────────
export const searchService = {
  search: (query: string) => {
    return api.get<any[]>(`${API.SEARCH}search/?q=${encodeURIComponent(query)}`);
  },
};

// ─── Users (Admin) ──────────────────────────────────────────
export const usersService = {
  getUsers: (params?: Record<string, string | number>) => {
    let url = API.USERS;
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.append(k, String(v)); });
      const s = q.toString();
      if (s) url += `?${s}`;
    }
    return api.get<PaginatedResponse<any>>(url);
  },
  getUserById: (id: number) => api.get<any>(API.USER(id)),
  updateUser: (id: number, data: Record<string, any>) => api.patch<any>(API.USER(id), data),
  deleteUser: (id: number) => api.delete<void>(API.USER(id)),
};
