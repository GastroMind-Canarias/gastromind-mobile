import { FridgeItem, ItemStatus } from "../../../core/domain/fridgeItem.types";

let inventory: FridgeItem[] = [
  {
    id: '1',
    quantity: 1.5,
    expirationDate: '2026-06-01',
    status: ItemStatus.GOOD,
    product: 'Leche de Almendras' ,
    fridgeId: 'kitchen-main'
  },
  {
    id: '2',
    quantity: 0.5,
    expirationDate: '2026-02-15',
    status: ItemStatus.OPENED,
    product: 'Salsa de Tomate',
    fridgeId: 'kitchen-main'
  }
];

export const COLORS = {
  text: '#0f1510',
  background: '#f1f9f4',
  primary: '#4dc763',
  secondary: '#86e998',
  accent: '#FF9F1C', 
  white: '#ffffff',
  error: '#ff4d4d',
};

export const fridgeService = {
  getAll: (): FridgeItem[] => [...inventory],

  search: (query: string): FridgeItem[] => {
    return inventory.filter(item => 
      item.product.toLowerCase().includes(query.toLowerCase())
    );
  },

  create: (item: Omit<FridgeItem, 'id'>): FridgeItem => {
    const newItem = { ...item, id: Math.random().toString(36).substring(7) };
    inventory = [newItem, ...inventory];
    return newItem;
  },

  delete: (id: string): void => {
    inventory = inventory.filter(i => i.id !== id);
  },

  updateStatus: (id: string, newStatus: ItemStatus): void => {
    const index = inventory.findIndex(i => i.id === id);
    if (index !== -1) inventory[index].status = newStatus;
  },

  update: (id: string, updatedData: Partial<FridgeItem>): void => {
    const index = inventory.findIndex(i => i.id === id);
    if (index !== -1) {
      inventory[index] = { ...inventory[index], ...updatedData };
    }
  }
};