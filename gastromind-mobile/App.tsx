import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/adapters/ui/navigation/RootNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}