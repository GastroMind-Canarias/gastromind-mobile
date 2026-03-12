import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useState } from 'react';
import { LoginCredentials, RegisterData } from '../../../core/domain/auth.types';
import { authService } from '../../external/api/auth.service';
import { AuthContext } from '../navigation/AuthContext';

export const useAuth = () => {
  const { login: contextLogin, logout: contextLogout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      
      await AsyncStorage.setItem('userToken', response.token);
      
      contextLogin();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      await authService.register(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en el registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('userToken');
    contextLogout();
  };

  return { signIn, signUp, signOut, loading, error };
};