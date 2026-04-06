import 'react-native-gesture-handler';

import { COLORS } from '@/src/shared/theme/colors';
import { setupInterceptors } from '@/src/adapters/external/api/authInterceptor';
import { AuthContext } from '@/src/adapters/ui/navigation/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/src/adapters/ui/navigation/routes';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(() => setIsLoggedIn(true), []);
  const logout = useCallback(() => setIsLoggedIn(false), []);

  const authValue = useMemo(
    () => ({
      login,
      logout,
    }),
    [login, logout],
  );

  useEffect(() => {
    setupInterceptors(logout);

    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Error cargando token', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  useEffect(() => {
    if (isLoading) return;

    const segs = segments as string[];
    const segment0 = segs[0];

    const inAuth = segment0 === '(auth)';
    const inApp = segment0 === '(app)';
    const atIndex = segment0 === 'index' || segs.length === 0;

    if (!isLoggedIn) {
      if (inApp) {
        router.replace(ROUTES.authLogin);
      } else if (atIndex) {
        router.replace(ROUTES.authLogin);
      }
      return;
    }

    if (isLoggedIn) {
      if (inAuth) {
        router.replace(ROUTES.appTabs);
      } else if (atIndex) {
        router.replace(ROUTES.appTabs);
      }
    }
  }, [isLoading, isLoggedIn, router, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthGate>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
