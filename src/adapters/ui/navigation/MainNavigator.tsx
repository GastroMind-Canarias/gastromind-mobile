import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home } from 'lucide-react-native';
import React from 'react';
import { COLORS } from '../../../shared/theme/colors';
import FridgeInventory from '../screens/FridgeScreen';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#99aab5',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          position: 'absolute',
          elevation: 10
        }
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Nevera" 
        component={FridgeInventory} 
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};