import { Recipe } from '@/src/core/domain/recipe.types';
import { apiClient } from './apiClient';
import { favoriteOfflineStore } from '../storage/FavoriteOfflineStore';

export interface UserFavorite {
  id: string;
  recipe: Recipe;
  createdAt: string;
}

const FALLBACK_IMAGE = '';

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

const pickText = (fallback: string, ...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
};

const pickFiniteNumber = (fallback: number, ...values: unknown[]): number => {
  for (const value of values) {
    const parsed = asNumber(value, Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const parseJsonObject = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const extractRecipeSource = (item: any): any => {
  const parsedRecipe = parseJsonObject(item?.recipeJson ?? item?.recipe_payload ?? item?.recipePayload);
  return (
    item?.recipe ??
    item?.recipeData ??
    item?.suggestionRecipe ??
    item?.suggestion?.recipe ??
    item?.favoriteRecipe ??
    item?.data?.recipe ??
    parsedRecipe ??
    item
  );
};

const hasRecipeShape = (value: any): boolean => {
  return Boolean(
    value &&
      (value.title ||
        value.instructions ||
        value.prep_time ||
        value.prepTime ||
        value.appliance_needed ||
        value.applianceNeeded)
  );
};

const extractRecipeId = (item: any): string => {
  if (typeof item === 'string' && item.trim().length > 0) {
    return item.trim();
  }

  const recipeSource = extractRecipeSource(item);

  const recipeStringId =
    typeof item?.recipe === 'string' && item.recipe.trim().length > 0
      ? item.recipe.trim()
      : '';

  return pickText(
    '',
    recipeStringId,
    item?.recipeId,
    item?.recipe_id,
    item?.suggestionRecipeId,
    recipeSource?.recipeId,
    recipeSource?.recipe_id,
    recipeSource?.suggestionRecipeId,
    hasRecipeShape(recipeSource) ? recipeSource?.id : '',
  );
};

const hydrateFavoriteWithRecipeDetail = async (item: any): Promise<UserFavorite | null> => {
  let workingItem: any = item;
  let recipeId = extractRecipeId(workingItem);
  const favoriteId = pickText(
    '',
    typeof item === 'object' ? item?.id : '',
    typeof item === 'object' ? item?.favoriteId : '',
    typeof item === 'object' ? item?.userFavoriteId : '',
  );

  if (!recipeId && favoriteId) {
    try {
      const favoriteDetailResponse = await apiClient.get(`/user-favorites/me/${favoriteId}`);
      workingItem = {
        ...(typeof favoriteDetailResponse.data === 'object' ? favoriteDetailResponse.data : {}),
        ...(typeof item === 'object' ? item : {}),
      };
      recipeId = extractRecipeId(workingItem);
    } catch {
    }
  }

  if (!recipeId) {
    return normalizeFavorite(workingItem);
  }

  try {
    const recipeResponse = await apiClient.get(`/recipes/${recipeId}`);
    if (typeof workingItem === 'string') {
      return normalizeFavorite({
        id: favoriteId || recipeId,
        recipe: recipeResponse.data,
      });
    }

    return normalizeFavorite({
      ...(typeof workingItem === 'object' ? workingItem : {}),
      id: favoriteId || workingItem?.id,
      recipe: recipeResponse.data,
    });
  } catch {
    return normalizeFavorite(workingItem);
  }
};

const mapRecipe = (source: any): Recipe => {
  const image =
    pickText('', source?.image_url, source?.imageUrl, source?.image, source?.thumbnail, source?.photoUrl) ||
    FALLBACK_IMAGE;

  return {
    id: pickText(
      '',
      source?.recipeId,
      source?.recipe_id,
      source?.suggestionRecipeId,
      source?.id,
      source?.slug,
    ),
    title: pickText(
      'Receta sin titulo',
      source?.title,
      source?.name,
      source?.recipeTitle,
      source?.recipe_name,
      source?.dishName,
    ),
    instructions: pickText(
      'Sin instrucciones disponibles.',
      source?.instructions,
      source?.steps,
      source?.method,
      source?.preparation,
      source?.recipeInstructions,
    ),
    servings: pickFiniteNumber(1, source?.servings, source?.servingsCount, source?.portions),
    prep_time: pickFiniteNumber(0, source?.prep_time, source?.prepTime, source?.preparationTimeMinutes, source?.durationMinutes),
    appliance_needed: pickText(
      'No especificado',
      source?.appliance_needed,
      source?.applianceNeeded,
      source?.appliance,
      source?.tool,
      source?.kitchenTool,
    ),
    difficulty: pickText('Media', source?.difficulty, source?.level),
    description: pickText(
      'Sin descripcion.',
      source?.description,
      source?.summary,
      source?.recipeDescription,
      source?.subtitle,
    ),
    calories: pickFiniteNumber(0, source?.calories, source?.kcal, source?.energyKcal),
    image_url: image,
    created_at: pickText(
      new Date().toISOString(),
      source?.created_at,
      source?.createdAt,
      source?.date,
    ),
  };
};

const normalizeFavorite = (item: any): UserFavorite | null => {
  if (!item) return null;

  const recipeSource = extractRecipeSource(item);
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
    const rawItems = extractList(response.data);
    const normalized = (await Promise.all(rawItems.map((item) => hydrateFavoriteWithRecipeDetail(item))))
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
      const rawItems = extractList(response.data);
      const normalized = (await Promise.all(rawItems.map((item) => hydrateFavoriteWithRecipeDetail(item))))
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
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 403 && status !== 404 && status !== 405) {
        throw error;
      }

      const response = await apiClient.post('/user-favorites/me/from-suggestion', {
        suggestionId: recipeId,
      });
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
