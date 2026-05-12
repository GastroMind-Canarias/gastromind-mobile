import { Redirect } from 'expo-router';
import React from 'react';
import { ROUTES } from '@/src/adapters/ui/navigation/routes';

/**
 * Ruta inicial; `app/_layout.tsx` redirige según sesión tras cargar AsyncStorage.
 */
export default function Index() {
  return <Redirect href={ROUTES.authLogin} />;
}
