import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Refrigerator, UserCircle2 } from 'lucide-react-native';
import React from 'react';
import { Platform, View } from 'react-native';
import { COLORS } from '../../../shared/theme/colors';
import FridgeScreen from '../screens/FridgeScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#8AA898',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
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
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <Home size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Nevera"
        component={FridgeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <Refrigerator size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <UserCircle2 size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </TabIcon>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Punto de acento verde bajo el icono activo
function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center' }}>
      {children}
      {focused && (
        <View
          style={{
            width: 5, height: 5, borderRadius: 3,
            backgroundColor: COLORS.primary,
            marginTop: 3,
          }}
        />
      )}
    </View>
  );
}