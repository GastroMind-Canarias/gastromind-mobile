import type { Href } from 'expo-router';
import { router } from 'expo-router';
import type { Recipe } from '@/src/core/domain/recipe.types';

/** Rutas establecidas por la estructura en `app/`. */
export const ROUTES = {
  authLogin: '/(auth)/login' as Href,
  authRegister: '/(auth)/register' as Href,
  appTabs: '/(app)/(tabs)' as Href,
  appTabFridge: '/(app)/(tabs)/fridge' as Href,
  appTabProfile: '/(app)/(tabs)/profile' as Href,
  recipeDetail: '/(app)/recipe-detail' as Href,
} as const;

/** Navegación con objeto `recipe` (params complejos y typed routes). */
export function pushRecipeDetail(recipe: Recipe) {
  router.push({
    pathname: ROUTES.recipeDetail,
    params: { recipe: JSON.stringify(recipe) },
  } as Href);
}
