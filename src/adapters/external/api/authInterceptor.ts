import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';

export const setupInterceptors = (logout: () => void) => {
  
  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await AsyncStorage.getItem('userToken');
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        await AsyncStorage.removeItem('userToken');
        logout(); 
      }
      return Promise.reject(error);
    }
  );
};