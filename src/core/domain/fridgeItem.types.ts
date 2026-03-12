export enum ItemStatus {
  OPENED = 'OPENED',
  EXPIRED = 'EXPIRED',
  GOOD = 'GOOD',
}

export interface FridgeItem {
  id: string;
  quantity: number;        
  expirationDate: string;  
  status: ItemStatus;
  product: string;
  fridgeId: string;
}