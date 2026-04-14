import { Recipe } from '@/src/core/domain/recipe.types';
import { apiClient } from './apiClient';
import { favoriteOfflineStore } from '../storage/FavoriteOfflineStore';

export interface UserFavorite {
  id: string;
  recipe: Recipe;
  createdAt: string;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800';

const asString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const mapRecipe = (source: any): Recipe => {
  const image =
    asString(source?.image_url) ||
    asString(source?.imageUrl) ||
    asString(source?.image) ||
    FALLBACK_IMAGE;

  return {
    id: asString(source?.id),
    title: asString(source?.title, 'Receta sin titulo'),
    instructions: asString(source?.instructions, 'Sin instrucciones disponibles.'),
    servings: asNumber(source?.servings, 1),
    prep_time: asNumber(source?.prep_time ?? source?.prepTime, 0),
    appliance_needed: asString(
      source?.appliance_needed ?? source?.applianceNeeded,
      'No especificado'
    ),
    difficulty: asString(source?.difficulty, 'Media'),
    description: asString(source?.description, 'Sin descripcion.'),
    calories: asNumber(source?.calories, 0),
    image_url: image,
    created_at: asString(
      source?.created_at ?? source?.createdAt,
      new Date().toISOString()
    ),
  };
};

const normalizeFavorite = (item: any): UserFavorite | null => {
  if (!item) return null;

  const recipeSource = item.recipe ?? item;
  const recipe = mapRecipe(recipeSource);
  if (!recipe.id) return null;

  const favoriteId = asString(item.id || item.favoriteId || recipe.id);

  return {
    id: favoriteId,
    recipe,
    createdAt: asString(item.createdAt ?? item.created_at, recipe.created_at),
  };
};

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.favorites)) return payload.favorites;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const favoriteService = {
  getMine: async (): Promise<UserFavorite[]> => {
    const response = await apiClient.get('/user-favorites/me');
    const normalized = extractList(response.data)
      .map((item) => normalizeFavorite(item))
      .filter((item): item is UserFavorite => Boolean(item));
    await favoriteOfflineStore.replaceAll(normalized);
    return normalized;
  },

  getMineOffline: async (): Promise<UserFavorite[]> => {
    return favoriteOfflineStore.getAll();
  },

  syncMineOfflineCache: async (): Promise<void> => {
    try {
      const response = await apiClient.get('/user-favorites/me');
      const normalized = extractList(response.data)
        .map((item) => normalizeFavorite(item))
        .filter((item): item is UserFavorite => Boolean(item));
      await favoriteOfflineStore.replaceAll(normalized);
    } catch {
    }
  },

  getMineById: async (id: string): Promise<UserFavorite | null> => {
    const response = await apiClient.get(`/user-favorites/me/${id}`);
    return normalizeFavorite(response.data);
  },

  deleteMine: async (id: string): Promise<void> => {
    await apiClient.delete(`/user-favorites/me/${id}`);
  },

  addMineByRecipeId: async (recipeId: string): Promise<UserFavorite | null> => {
    const payload = { recipeId };

    try {
      const response = await apiClient.post('/user-favorites/me', payload);
      return normalizeFavorite(response.data);
    } catch {
      const response = await apiClient.post('/user-favorites/me/from-suggestion', payload);
      return normalizeFavorite(response.data);
    }
  },

  findMineByRecipeId: async (recipeId: string): Promise<UserFavorite | null> => {
    const list = await favoriteService.getMine();
    return list.find((item) => item.recipe.id === recipeId) ?? null;
  },

  updateMine: async (id: string, payload: Record<string, unknown>): Promise<void> => {
    await apiClient.put(`/user-favorites/me/${id}`, payload);
  },
};
