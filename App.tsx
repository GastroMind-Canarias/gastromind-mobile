import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { RootNavigator } from './src/adapters/ui/navigation/RootNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0D1F17" />
      <RootNavigator />
    </NavigationContainer>
  );
}
