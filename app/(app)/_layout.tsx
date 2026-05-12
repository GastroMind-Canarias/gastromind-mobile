import { Stack } from 'expo-router';
import React from 'react';

export default function AppGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="ai-chat" />
      <Stack.Screen name="recipe-detail" />
    </Stack>
  );
}
