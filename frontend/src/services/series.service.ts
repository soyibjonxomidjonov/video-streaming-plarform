import { api } from './api-client';
import { API } from '../config/env';
import { Series, Episode, PaginatedResponse } from '../types';

export const seriesService = {
  getSeries: async (params?: Record<string, string | number | boolean>) => {
    let url = API.SERIES;
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
    return api.get<PaginatedResponse<Series>>(url);
  },

  getSeriesById: async (id: number) => {
    return api.get<Series>(API.SERIES_ITEM(id));
  },

  getEpisodes: async (seriesId?: number, params?: Record<string, string | number | boolean>) => {
    let url = API.EPISODES;
    const query = new URLSearchParams();
    
    if (seriesId) {
      query.append('series', String(seriesId));
    }

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }

    const qString = query.toString();
    if (qString) {
      url += `?${qString}`;
    }

    return api.get<PaginatedResponse<Episode>>(url);
  },
  
  getEpisodeById: async (id: number) => {
    return api.get<Episode>(API.EPISODE(id));
  },

  getEpisodeStreamUrl: (id: number) => {
    const url = API.EPISODE_STREAM(id);
    if (typeof window !== 'undefined' && url.startsWith(ENV.API_BASE)) {
      return url.replace(ENV.API_BASE, '/backend');
    }
    return url;
  }
};
