import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';

type InterceptorIds = {
  requestId: number;
  responseId: number;
};

let apiClientIds: InterceptorIds | null = null;
let globalAxiosIds: InterceptorIds | null = null;

const isAuthDebugRoute = (url: string): boolean =>
  url.includes('/users/me') ||
  url.includes('/auth/me') ||
  url.includes('/users/me/allergens') ||
  url.includes('/households/me/appliances/batch');

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
      const debugRoute = isAuthDebugRoute(url);

      if (debugRoute) {
        console.log('[AuthDebug][Request]', {
          method: config.method,
          url,
          hasTokenInStorage: !!token,
          tokenLength: token?.length ?? 0,
          hasAuthorizationHeader: !!config.headers.Authorization,
        });
      }

      if (url.includes('/tickets/from-image')) {
        console.log('[TicketOCR] Request auth debug', {
          method: config.method,
          url,
          hasTokenInStorage: !!token,
          hasAuthorizationHeader: !!config.headers.Authorization,
        });
      }

      const isMeRoute = url.includes('/me');
      if (isMeRoute && !token) {
        console.error('[AuthDebug][MissingTokenForMeRoute]', {
          method: config.method,
          url,
          reason: 'No userToken in AsyncStorage before request',
        });
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
      const debugRoute = isAuthDebugRoute(url);

      if (debugRoute) {
        console.error('[AuthDebug][ResponseError]', {
          method: error?.config?.method,
          url,
          status,
          data: error?.response?.data,
          message: error?.message,
        });
      }

      const isUserMeRoute = url.includes('/users/me') || url.includes('/auth/me');

      if (isUserMeRoute && status === 401) {
        try {
          console.warn('[AuthDebug][TokenCleared]', {
            url,
            status,
            reason: 'Unauthorized on /me route',
          });
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
