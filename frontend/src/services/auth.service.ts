import { api } from './api-client';
import { API } from '../config/env';
import { LoginResponse } from '../types';

export const authService = {
  // 1. Send code to email
  sendCode: async (email: string) => {
    return api.post<{ message: string }>(API.AUTH_LOGIN, { email });
  },

  // 2. Verify code and login
  verifyCode: async (email: string, verify_code: string) => {
    return api.post<LoginResponse>(API.AUTH_VERIFY, { email, verify_code });
  },

  // 1. Register - send code (matches RegisterSerializerConfig)
  register: async (data: { email: string; first_name: string; last_name?: string; age?: number }) => {
    return api.post<{ message: string }>(API.AUTH_REGISTER, data);
  },

  // 3. Google Login — API /auth/google/login expects { id_token }
  googleLogin: async (idToken: string) => {
    return api.post<LoginResponse>(API.AUTH_GOOGLE, { id_token: idToken });
  },

  // Refresh Token
  refreshToken: async (refresh: string) => {
    return api.post<{ access: string }>(API.TOKEN_REFRESH, { refresh });
  }
};
