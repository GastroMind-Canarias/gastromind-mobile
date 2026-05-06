import { FridgeItem, ItemStatus } from "../../../core/domain/fridgeItem.types";
import { apiClient } from './apiClient';

export const COLORS = {
  text: '#0f1510',
  background: '#f1f9f4',
  primary: '#4dc763',
  secondary: '#86e998',
  accent: '#FF9F1C', 
  white: '#ffffff',
  error: '#ff4d4d',
};

let defaultFridgeId: string | null = null;

const resolveFridgeId = (payload: any): string | null => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    const first = payload[0];
    if (!first) return null;
    return first.id || first.fridgeId || null;
  }

  if (typeof payload === 'object') {
    if (payload.id || payload.fridgeId) {
      return payload.id || payload.fridgeId;
    }

    if (Array.isArray(payload.content) && payload.content.length > 0) {
      return payload.content[0].id || payload.content[0].fridgeId || null;
    }

    if (Array.isArray(payload.data) && payload.data.length > 0) {
      return payload.data[0].id || payload.data[0].fridgeId || null;
    }
  }

  return null;
};

const resolveItemsList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const resolveProductName = (product: any): string => {
  if (typeof product === 'string') return product;
  if (typeof product?.name === 'string') return product.name;
  return '';
};

const asErrorStatus = (error: any): number | null => {
  const status = error?.response?.status;
  return typeof status === 'number' ? status : null;
};

const canRetryCreatePayload = (error: any): boolean => {
  const status = asErrorStatus(error);
  return status === 400 || status === 422;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string): boolean => UUID_REGEX.test(value.trim());

const getDefaultFridgeId = async () => {
  if (defaultFridgeId) return defaultFridgeId;
  try {
    const meRes = await apiClient.get('/fridges/me');
    const meFridgeId = resolveFridgeId(meRes.data);
    if (meFridgeId) {
      defaultFridgeId = meFridgeId;
      return defaultFridgeId;
    }

    const legacyRes = await apiClient.get('/fridges');
    const legacyFridgeId = resolveFridgeId(legacyRes.data);
    if (legacyFridgeId) {
      defaultFridgeId = legacyFridgeId;
      return defaultFridgeId;
    }
  } catch (error) {
    console.error('Error fetching fridges:', error);
  }
  return 'MAIN'; 
};

export const fridgeService = {
  getAll: async (): Promise<FridgeItem[]> => {
    try {
      const meResponse = await apiClient.get('/fridge-items/me');
      return resolveItemsList(meResponse.data).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        expirationDate: item.expirationDate,
        status: item.status,
        product: item.productName || item.product?.name || item.product,
        fridgeId: item.fridgeId
      }));
    } catch {
      try {
        const fridgeId = await getDefaultFridgeId();
        if (!fridgeId) return [];

        const legacyResponse = await apiClient.get(`/fridge-items/fridge/${fridgeId}`);
        return resolveItemsList(legacyResponse.data).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          expirationDate: item.expirationDate,
          status: item.status,
          product: item.productName || item.product?.name || item.product,
          fridgeId: item.fridgeId
        }));
      } catch (legacyError) {
        console.error('Error fetching fridge items:', legacyError);
        return [];
      }
    }
  },

  search: async (query: string): Promise<FridgeItem[]> => {
    const all = await fridgeService.getAll();
    return all.filter(item => 
      item.product.toLowerCase().includes(query.toLowerCase())
    );
  },

  create: async (item: Omit<FridgeItem, 'id'>): Promise<FridgeItem | null> => {
    try {
      const normalizedProductName = item.product.trim();
      const payloadCamel = {
        productName: normalizedProductName,
        quantity: item.quantity,
        expirationDate: item.expirationDate,
        status: item.status,
      };

      const payloadSnake = {
        product_name: normalizedProductName,
        quantity: item.quantity,
        expiration_date: item.expirationDate,
        status: item.status,
      };

      const payloadNameOnly = {
        product: normalizedProductName,
        quantity: item.quantity,
        expirationDate: item.expirationDate,
        status: item.status,
      };

      let response;
      try {
        response = await apiClient.post('/fridge-items/me', payloadCamel);
      } catch (createItemError: any) {
        if (!canRetryCreatePayload(createItemError)) {
          throw createItemError;
        }

        try {
          response = await apiClient.post('/fridge-items/me', payloadSnake);
        } catch (snakeError: any) {
          if (!canRetryCreatePayload(snakeError)) {
            throw snakeError;
          }
          response = await apiClient.post('/fridge-items/me', payloadNameOnly);
        }
      }

      const responseData = response.data || {};

      return {
        id: responseData.id,
        quantity: responseData.quantity,
        expirationDate: responseData.expirationDate || responseData.expiration_date,
        status: (responseData.status || item.status) as ItemStatus,
        product: responseData.productName || responseData.product_name || responseData.product?.name || item.product,
        fridgeId: responseData.fridgeId || responseData.fridge_id || item.fridgeId,
      };
    } catch (e: any) {
      console.error('Error creating fridge item:', {
        status: e?.response?.status,
        endpoint: e?.config?.url,
        method: e?.config?.method,
        data: e?.response?.data,
        message: e?.message,
      });
      return null;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/fridge-items/${id}`);
    } catch (e) {
      console.error('Error deleting fridge item:', e);
    }
  },

  updateStatus: async (id: string, newStatus: ItemStatus): Promise<void> => {
     // Not used directly without the whole item currently. 
     // Can be implemented similarly to update.
  },

  update: async (id: string, updatedData: Partial<FridgeItem>): Promise<void> => {
    try {
      const itemRes = await apiClient.get(`/fridge-items/${id}`);
      const current = itemRes.data;

      await apiClient.put(`/fridge-items/${id}`, {
        productName: updatedData.product !== undefined ? updatedData.product : current.productName,
        fridgeId: updatedData.fridgeId || current.fridgeId,
        quantity: updatedData.quantity !== undefined ? updatedData.quantity : current.quantity,
        expirationDate: updatedData.expirationDate !== undefined ? updatedData.expirationDate : current.expirationDate,
        status: updatedData.status !== undefined ? updatedData.status : current.status
      });

    } catch (e) {
      console.error('Error updating fridge item:', e);
    }
  }
};
