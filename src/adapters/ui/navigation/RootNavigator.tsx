import { COLORS } from '@/src/shared/theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { setupInterceptors } from '../../external/api/authInterceptor';
import { AuthContext } from './AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

export const RootNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const authContext = {
    login: () => setIsLoggedIn(true),
    logout: () => setIsLoggedIn(false),
  };

  useEffect(() => {
    setupInterceptors(authContext.logout);

    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Error cargando token", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Usamos el color primario de GastroMind para el spinner */}
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});