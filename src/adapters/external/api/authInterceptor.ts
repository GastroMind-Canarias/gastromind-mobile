import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';

type InterceptorIds = {
  requestId: number;
  responseId: number;
};

let apiClientIds: InterceptorIds | null = null;
let globalAxiosIds: InterceptorIds | null = null;

const attachToClient = (client: AxiosInstance, logout: () => void): InterceptorIds => {
  const requestId = client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await AsyncStorage.getItem('userToken');

      if (!config.headers) {
        config.headers = {} as InternalAxiosRequestConfig['headers'];
      }

      if (token) {
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

      if (isUserMeRoute && (status === 401 || status === 403 || status === 404 || status >= 500 || !status)) {
        try {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.setItem('authRedirectReason', 'user-error');
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
