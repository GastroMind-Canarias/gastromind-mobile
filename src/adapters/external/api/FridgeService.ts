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
    } catch (e) {
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
      let productId = '';
      
      const prodsRes = await apiClient.get('/products');
      const existingProduct = prodsRes.data.find((p: any) => p.name.toLowerCase() === item.product.toLowerCase());
      
      if (existingProduct) {
        productId = existingProduct.id;
      } else {
        const newProd = await apiClient.post('/products', {
          name: item.product,
          is_essential: false
        });
        productId = newProd.data.id;
      }

      const payload = {
        productId: productId,
        quantity: item.quantity,
        expirationDate: item.expirationDate,
        status: item.status,
      };

      let response;
      try {
        response = await apiClient.post('/fridge-items/me', payload);
      } catch {
        const fridgeId = await getDefaultFridgeId();
        response = await apiClient.post('/fridge-items', {
          ...payload,
          fridgeId: fridgeId,
        });
      }

      return {
        id: response.data.id,
        quantity: response.data.quantity,
        expirationDate: response.data.expirationDate,
        status: response.data.status as ItemStatus,
        product: response.data.productName,
        fridgeId: response.data.fridgeId
      };
    } catch (e) {
      console.error('Error creating fridge item:', e);
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

      let productId = '';
      if (updatedData.product && updatedData.product !== current.productName) {
         const prodsRes = await apiClient.get('/products');
         const existingProduct = prodsRes.data.find((p: any) => p.name.toLowerCase() === updatedData.product?.toLowerCase());
         if (existingProduct) {
            productId = existingProduct.id;
         } else {
            const newProd = await apiClient.post('/products', {
              name: updatedData.product,
              is_essential: false
            });
            productId = newProd.data.id;
         }
      }

      if (!productId) {
         const prodsRes = await apiClient.get('/products');
         const existingProduct = prodsRes.data.find((p: any) => p.name.toLowerCase() === current.productName.toLowerCase());
         if (existingProduct) {
            productId = existingProduct.id;
         }
      }

      await apiClient.put(`/fridge-items/${id}`, {
        productId: productId,
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
