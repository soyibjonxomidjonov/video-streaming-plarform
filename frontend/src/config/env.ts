// ============================================================
// ENVIRONMENT CONFIGURATION — SINGLE SOURCE OF TRUTH
// Never import env vars directly from process.env in components.
// Always import from this file.
// ============================================================

export const ENV = {
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://16.170.242.253:8000',
  WS_BASE: process.env.NEXT_PUBLIC_WS_BASE || 'ws://16.170.242.253:8000',
  WS_AGENT: `${process.env.NEXT_PUBLIC_WS_BASE || 'ws://16.170.242.253:8000'}/ws/agent/`,
  MOHIR_API_KEY: process.env.NEXT_PUBLIC_MOHIR_API_KEY || '',
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  ADMIN_PATH: process.env.NEXT_PUBLIC_ADMIN_PATH || 'admin',
  IS_DEV: process.env.NEXT_PUBLIC_APP_ENV === 'development',
} as const;

// API endpoint builders
export const API = {
  // Auth
  AUTH_LOGIN: `${ENV.API_BASE}/v1/auth/login/`,
  AUTH_REGISTER: `${ENV.API_BASE}/v1/auth/register/`,
  AUTH_VERIFY: `${ENV.API_BASE}/v1/auth/code/verify/`,
  AUTH_GOOGLE: `${ENV.API_BASE}/v1/auth/google/login`,
  TOKEN_REFRESH: `${ENV.API_BASE}/v1/auth/token/refresh/`,
  TOKEN_VERIFY: `${ENV.API_BASE}/v1/auth/token/verify/`,

  // Content
  MOVIES: `${ENV.API_BASE}/v1/movie/`,
  MOVIE: (id: number) => `${ENV.API_BASE}/v1/movie/${id}/`,
  MOVIE_STREAM: (id: number) => `${ENV.API_BASE}/v1/movie/${id}/stream/`,

  SERIES: `${ENV.API_BASE}/v1/series/`,
  SERIES_ITEM: (id: number) => `${ENV.API_BASE}/v1/series/${id}/`,

  EPISODES: `${ENV.API_BASE}/v1/episode/`,
  EPISODE: (id: number) => `${ENV.API_BASE}/v1/episode/${id}/`,
  EPISODE_STREAM: (id: number) => `${ENV.API_BASE}/v1/episode/${id}/stream/`,

  GENRES: `${ENV.API_BASE}/v1/genre/`,
  GENRE: (id: number) => `${ENV.API_BASE}/v1/genre/${id}/`,

  // Search
  SEARCH: `${ENV.API_BASE}/v1/embedding_search/`,

  // Movie interactions
  MOVIE_COMMENTS: `${ENV.API_BASE}/v1/movie-comments/`,
  MOVIE_COMMENT: (id: number) => `${ENV.API_BASE}/v1/movie-comments/${id}/`,
  MOVIE_RATINGS: `${ENV.API_BASE}/v1/movie-rating/`,
  MOVIE_RATING: (id: number) => `${ENV.API_BASE}/v1/movie-rating/${id}/`,
  MOVIE_FAVORITES: `${ENV.API_BASE}/v1/movie-favourite/`,
  MOVIE_FAVORITE: (id: number) => `${ENV.API_BASE}/v1/movie-favourite/${id}/`,
  MOVIE_WATCHPROGRESS: `${ENV.API_BASE}/v1/movie-watchprogress/`,
  MOVIE_WATCHPROGRESS_ITEM: (id: number) => `${ENV.API_BASE}/v1/movie-watchprogress/${id}/`,

  // Series interactions
  SERIES_COMMENTS: `${ENV.API_BASE}/v1/series-comments/`,
  SERIES_COMMENT: (id: number) => `${ENV.API_BASE}/v1/series-comments/${id}/`,
  SERIES_RATINGS: `${ENV.API_BASE}/v1/series-rating/`,
  SERIES_RATING: (id: number) => `${ENV.API_BASE}/v1/series-rating/${id}/`,
  SERIES_FAVORITES: `${ENV.API_BASE}/v1/series-favourite/`,
  SERIES_FAVORITE: (id: number) => `${ENV.API_BASE}/v1/series-favourite/${id}/`,
  EPISODE_WATCHPROGRESS: `${ENV.API_BASE}/v1/series-watchprogress/`,
  EPISODE_WATCHPROGRESS_ITEM: (id: number) => `${ENV.API_BASE}/v1/series-watchprogress/${id}/`,

  // Admin
  USERS: `${ENV.API_BASE}/v1/users/`,
  USER: (id: number) => `${ENV.API_BASE}/v1/users/${id}/`,

  // WebSocket — use ENV.WS_AGENT directly
} as const;
