import { useTheme, useThemeColors } from '@/src/shared/theme/ThemeProvider';
import { useNetwork } from '@/src/shared/network/NetworkProvider';
import { Tabs } from 'expo-router';
import { Heart, Home, Refrigerator, ShoppingCart, UserCircle2 } from 'lucide-react-native';
import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Altura útil icono + label; el padding superior/inferior y insets.bottom suman al alto total. */
const TAB_BAR_CONTENT = 52;

export default function TabsLayout() {
  const { isOnline } = useNetwork();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabPaddingTop = 8;
  const tabPaddingBottom = 8 + insets.bottom;
  const tabBarHeight = tabPaddingTop + TAB_BAR_CONTENT + tabPaddingBottom;

  const makeOfflineTabButton = (disabled: boolean) =>
    function OfflineTabButton(props: any) {
      const { onPress, accessibilityState, ...rest } = props;
      return (
        <TouchableOpacity
          {...rest}
          activeOpacity={disabled ? 1 : 0.85}
          onPress={disabled ? undefined : onPress}
          style={[props.style, disabled && { opacity: 0.45 }]}
          accessibilityState={{
            ...(accessibilityState || {}),
            disabled,
          }}
          accessibilityHint={disabled ? 'Disponible solo con conexion a internet' : props.accessibilityHint}
        />
      );
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: tabPaddingBottom,
          paddingTop: tabPaddingTop,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: colors.surface,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
            },
            android: { elevation: 20 },
          }),
        },
        tabBarLabelStyle: {
          color: isDark ? colors.white : undefined,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarButton: makeOfflineTabButton(!isOnline),
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Nevera',
          tabBarButton: makeOfflineTabButton(!isOnline),
          tabBarIcon: ({ color, size, focused }) => (
            <Refrigerator size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size, focused }) => (
            <Heart size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Compras',
          tabBarButton: makeOfflineTabButton(!isOnline),
          tabBarIcon: ({ color, size, focused }) => (
            <ShoppingCart size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarButton: makeOfflineTabButton(!isOnline),
          tabBarIcon: ({ color, size, focused }) => (
            <UserCircle2 size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
