import { api } from './api-client';
import { API } from '../config/env';
import { Genre, PaginatedResponse } from '../types';

export const genresService = {
  getGenres: async (params?: Record<string, string | number>) => {
    let url = API.GENRES;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }
    return api.get<PaginatedResponse<Genre>>(url);
  },

  getGenreById: async (id: number) => {
    return api.get<Genre>(API.GENRE(id));
  },

  createGenre: async (data: { name: string }) => {
    return api.post<Genre>(API.GENRES, data);
  },

  updateGenre: async (id: number, data: { name: string }) => {
    return api.patch<Genre>(API.GENRE(id), data);
  },

  deleteGenre: async (id: number) => {
    return api.delete<void>(API.GENRE(id));
  },
};
