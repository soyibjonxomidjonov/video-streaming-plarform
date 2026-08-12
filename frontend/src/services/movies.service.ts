import { api } from './api-client';
import { API } from '../config/env';
import { Movie, PaginatedResponse } from '../types';

export const moviesService = {
  getMovies: async (params?: Record<string, string | number | boolean>) => {
    let url = API.MOVIES;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
      const qString = query.toString();
      if (qString) {
        url += `?${qString}`;
      }
    }
    return api.get<PaginatedResponse<Movie>>(url);
  },

  getMovieById: async (id: number) => {
    return api.get<Movie>(API.MOVIE(id));
  },
  
  // Streaming url logic - mostly handled by backend redirect or player using the url directly
  getStreamUrl: (id: number) => {
    const url = API.MOVIE_STREAM(id);
    if (typeof window !== 'undefined' && url.startsWith(ENV.API_BASE)) {
      return url.replace(ENV.API_BASE, '/backend');
    }
    return url;
  }
};
