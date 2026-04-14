import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';

export const setupInterceptors = (_logout: () => void) => {
  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await AsyncStorage.getItem('userToken');

      if (!config.headers) {
        config.headers = {} as InternalAxiosRequestConfig['headers'];
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const isMeRoute = typeof config.url === 'string' && config.url.includes('/me');
      if (isMeRoute && !token) {
        return Promise.reject(new Error('Missing auth token for /me endpoint'));
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => Promise.reject(error)
  );
};
