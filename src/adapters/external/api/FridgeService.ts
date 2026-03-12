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
const getDefaultFridgeId = async () => {
  if (defaultFridgeId) return defaultFridgeId;
  try {
    const res = await apiClient.get('/fridges');
    if (res.data && res.data.length > 0) {
      defaultFridgeId = res.data[0].id;
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
      const fridgeId = await getDefaultFridgeId();
      if (!fridgeId) return [];
      
      const response = await apiClient.get(`/fridge-items/fridge/${fridgeId}`);
      return response.data.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        expirationDate: item.expirationDate,
        status: item.status,
        product: item.productName,
        fridgeId: item.fridgeId
      }));
    } catch (e) {
      console.error('Error fetching fridge items:', e);
      return [];
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

      const fridgeId = await getDefaultFridgeId();

      const response = await apiClient.post('/fridge-items', {
        productId: productId,
        fridgeId: fridgeId,
        quantity: item.quantity,
        expirationDate: item.expirationDate,
        status: item.status
      });

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