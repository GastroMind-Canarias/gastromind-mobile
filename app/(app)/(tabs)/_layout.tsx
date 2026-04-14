import { COLORS } from '@/src/shared/theme/colors';
import { Tabs } from 'expo-router';
import { Heart, Home, Refrigerator, UserCircle2 } from 'lucide-react-native';
import React from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center' }}>
      {children}
      {focused && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: COLORS.primary,
            marginTop: 3,
          }}
        />
      )}
    </View>
  );
}

/** Altura útil icono + label; el padding superior/inferior y insets.bottom suman al alto total. */
const TAB_BAR_CONTENT = 52;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabPaddingTop = 8;
  const tabPaddingBottom = 8 + insets.bottom;
  const tabBarHeight = tabPaddingTop + TAB_BAR_CONTENT + tabPaddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#8AA898',
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: tabPaddingBottom,
          paddingTop: tabPaddingTop,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
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
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <Home size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Nevera',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <Refrigerator size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <Heart size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <UserCircle2 size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}
