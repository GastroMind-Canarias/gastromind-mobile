import 'react-native-gesture-handler';

import { AppThemeProvider, useTheme } from '@/src/shared/theme/ThemeProvider';
import { NetworkProvider, useNetwork } from '@/src/shared/network/NetworkProvider';
import { setupInterceptors } from '@/src/adapters/external/api/authInterceptor';
import { AuthContext } from '@/src/adapters/ui/navigation/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/src/adapters/ui/navigation/routes';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { isOnline } = useNetwork();
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

    const redirectToLoginWithAuthError = async () => {
      let reason = 'not-logged-in';
      try {
        const storedReason = await AsyncStorage.getItem('authRedirectReason');
        if (storedReason === 'user-error') {
          reason = 'user-error';
        }
        await AsyncStorage.removeItem('authRedirectReason');
      } catch {
      }

      router.replace({
        pathname: ROUTES.authLogin,
        params: { reason },
      } as never);
    };

    if (!isLoggedIn) {
      if (inApp) {
        redirectToLoginWithAuthError();
      } else if (atIndex) {
        redirectToLoginWithAuthError();
      }
      return;
    }

    if (isLoggedIn) {
      const inFavoritesTab = segs[0] === '(app)' && segs[1] === '(tabs)' && segs[2] === 'favorites';

      if (!isOnline && !inFavoritesTab) {
        router.replace('/(app)/(tabs)/favorites');
        return;
      }

      if (inAuth) {
        router.replace(ROUTES.appTabs);
      } else if (atIndex) {
        router.replace(ROUTES.appTabs);
      }
    }
  }, [isLoading, isLoggedIn, isOnline, router, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
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
    <AppThemeProvider>
      <NetworkProvider>
        <RootLayoutContent />
      </NetworkProvider>
    </AppThemeProvider>
  );
}

function RootLayoutContent() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const applySystemBarTheme = async () => {
      try {
        await NavigationBar.setBackgroundColorAsync(isDark ? colors.background : colors.surface);
        await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
      } catch {
      }
    };

    applySystemBarTheme();
  }, [colors.background, colors.surface, isDark]);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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

