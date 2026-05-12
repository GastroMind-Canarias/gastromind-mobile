import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';

type InterceptorIds = {
  requestId: number;
  responseId: number;
};

let apiClientIds: InterceptorIds | null = null;
let globalAxiosIds: InterceptorIds | null = null;

const normalizeToken = (rawToken: string | null): string => {
  if (!rawToken) return '';
  return rawToken.replace(/^Bearer\s+/i, '').trim();
};

const attachToClient = (client: AxiosInstance, logout: () => void): InterceptorIds => {
  const requestId = client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const storedToken = await AsyncStorage.getItem('userToken');
      const token = normalizeToken(storedToken);

      if (!config.headers) {
        config.headers = {} as InternalAxiosRequestConfig['headers'];
      }

      if (token.length > 0) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const url = typeof config.url === 'string' ? config.url : '';

      const isMeRoute = url.includes('/me');
      if (isMeRoute && !token) {
        return Promise.reject(new Error('Missing auth token for /me endpoint'));
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  const responseId = client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const status = error?.response?.status;
      const url = typeof error?.config?.url === 'string' ? error.config.url : '';
      const isUserMeRoute = url.includes('/users/me') || url.includes('/auth/me');

      if (isUserMeRoute && status === 401) {
        try {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.setItem('authRedirectReason', 'session-expired');
        } catch {
        }
        logout();
      }

      return Promise.reject(error);
    }
  );

  return { requestId, responseId };
};

export const setupInterceptors = (_logout: () => void) => {
  if (apiClientIds) {
    apiClient.interceptors.request.eject(apiClientIds.requestId);
    apiClient.interceptors.response.eject(apiClientIds.responseId);
  }
  if (globalAxiosIds) {
    axios.interceptors.request.eject(globalAxiosIds.requestId);
    axios.interceptors.response.eject(globalAxiosIds.responseId);
  }

  apiClientIds = attachToClient(apiClient, _logout);
  globalAxiosIds = attachToClient(axios, _logout);
};
