// ============================================================
// TYPE DEFINITIONS — Backend API contracts
// Never invent fields — all fields sourced from actual backend
// ============================================================

// ---- User ----
export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  picture: string | null;
  google_id: string | null;
  auth_provider: 'email' | 'google';
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
}

// ---- Auth ----
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  email?: string;
  first_name?: string;
}

// ---- Genre ----
export interface Genre {
  id: number;
  name: string;
}

// ---- Movie ----
export interface Movie {
  id: number;
  title: string;
  description: string | null;
  poster_image: string | null;
  telegram_channel: string;
  telegram_message_id: number;
  telegram_file_id: string;
  duration_seconds: number;
  // Backend genres maydonini turlicha qaytarishi mumkin
  genres: Genre[] | number[] | string | string[];
  is_cashed: boolean | null;
  cashed_file_path: string | null;
  last_accessed_at: string | null;
  created_at: string;
}

// ---- Series ----
export interface Series {
  id: number;
  title: string;
  description: string | null;
  poster_image: string | null;
  genres: Genre[] | number[] | string | string[];
  created_at: string;
}

// ---- Episode ----
export interface Episode {
  id: number;
  series: number;
  episode_number: number;
  telegram_channel: string;
  telegram_message_id: number;
  telegram_file_id: string;
  duration_seconds: number;
  is_cashed: boolean;
  cashed_file_path: string | null;
  last_accessed_at: string | null;
  created_at: string;
}

// ---- Ratings ----
export interface MovieRating {
  id: number;
  user: number;
  movie: number;
  stars: number; // 1-5
  updated_at: string;
}

export interface SeriesRating {
  id: number;
  user: number;
  series: number;
  stars: number;
  updated_at: string;
}

// ---- Comments ----
export interface MovieComment {
  id: number;
  user: number;
  movie: number;
  text: string;
  created_at: string;
}

export interface SeriesComment {
  id: number;
  user: number;
  series: number;
  text: string;
  created_at: string;
}

// ---- Favorites ----
export interface MovieFavorite {
  id: number;
  user: number;
  movie: number;
  created_at: string;
}

export interface SeriesFavorite {
  id: number;
  user: number;
  series: number;
  created_at: string;
}

// ---- Watch Progress ----
export interface MovieWatchProgress {
  id: number;
  user: number;
  movie: number;
  position_seconds: number;
  updated_at: string;
}

export interface EpisodeWatchProgress {
  id: number;
  user: number;
  episode: number;
  position_seconds: number;
  updated_at: string;
}

// ---- Search Index ----
export interface SearchResult {
  id: number;
  content_type: 'movie' | 'series';
  object_id: number;
  title: string;
  description: string;
}

// ---- Pagination ----
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---- WebSocket Messages ----
export interface FrontendState {
  content_type: 'movie' | 'series' | 'episode' | null;
  content_id: number | null;
  content_title: string | null;
  is_playing: boolean;
  current_time_seconds: number;
}

export interface WsUserCommand {
  type: 'user_command';
  text: string;
  session_id: string;
  frontend_state: FrontendState;
}

export interface WsToolCall {
  type: 'tool_call';
  tool: string;
  params: Record<string, unknown>;
  speak?: string;
}

export interface WsClarify {
  type: 'clarify';
  question: string;
  awaiting?: string;
}

export interface WsError {
  type: 'error';
  message: string;
}

export type WsIncoming = WsToolCall | WsClarify | WsError;

// ---- API Error ----
export interface ApiError {
  type: 'network' | 'auth' | 'forbidden' | 'not_found' | 'validation' | 'server' | 'unknown';
  message: string;
  status?: number;
  detail?: unknown;
}

// ---- Voice State ----
export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
