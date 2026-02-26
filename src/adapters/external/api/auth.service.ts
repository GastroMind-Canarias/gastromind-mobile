import { AuthResponse, LoginCredentials, RegisterData } from '../../../core/domain/auth.types';
import { apiClient } from './apiClient';

export const authService = {

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterData): Promise<void> => {
    await apiClient.post('/auth/register', userData);
  }
  
};