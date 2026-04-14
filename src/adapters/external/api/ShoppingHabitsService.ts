import { fridgeService } from './FridgeService';
import { profileService } from './ProfileService';
import { apiClient } from './apiClient';

export interface HabitualItemStatus {
  id: string;
  productId: string;
  productName: string;
  targetQuantity: number;
  currentQuantity: number;
  missingQuantity: number;
  hasEnough: boolean;
}

export interface ShoppingHabitsSummary {
  habitualItems: HabitualItemStatus[];
  totalSpentThisMonth: number;
  topStoreName: string;
  topStoreVisits: number;
}

type UsualPurchase = {
  id: string;
  userId: string;
  productId: string;
  targetQuantity: number;
};

type Ticket = {
  id: string;
  userId: string;
  storeId: string;
  totalAmount: number;
  purchaseDate: string;
};

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

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const toMonthKey = (dateText: string): string => {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

const normalizeUsualPurchase = (item: any): UsualPurchase | null => {
  if (!item) return null;

  const productId = asString(item.productId || item.product_id);
  if (!productId) return null;

  return {
    id: asString(item.id, productId),
    userId: asString(item.userId || item.user_id),
    productId,
    targetQuantity: asNumber(item.targetQuantity ?? item.target_quantity, 0),
  };
};

const normalizeTicket = (item: any): Ticket | null => {
  if (!item) return null;

  const id = asString(item.id);
  const purchaseDate = asString(item.purchaseDate || item.purchase_date);

  if (!id || !purchaseDate) return null;

  return {
    id,
    userId: asString(item.userId || item.user_id),
    storeId: asString(item.storeId || item.store_id),
    totalAmount: asNumber(item.totalAmount ?? item.total_amount, 0),
    purchaseDate,
  };
};

const loadUsualPurchases = async (userId: string): Promise<UsualPurchase[]> => {
  try {
    const meResponse = await apiClient.get('/usual-purchase/me');
    return extractList(meResponse.data)
      .map((item) => normalizeUsualPurchase(item))
      .filter((item): item is UsualPurchase => Boolean(item));
  } catch {
    try {
      const response = await apiClient.get('/usual-purchase');
      return extractList(response.data)
        .map((item) => normalizeUsualPurchase(item))
        .filter((item): item is UsualPurchase => Boolean(item))
        .filter((item) => !item.userId || item.userId === userId);
    } catch {
      return [];
    }
  }
};

const loadTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const meResponse = await apiClient.get('/tickets/me');
    return extractList(meResponse.data)
      .map((item) => normalizeTicket(item))
      .filter((item): item is Ticket => Boolean(item));
  } catch {
    try {
      const response = await apiClient.get('/tickets');
      return extractList(response.data)
        .map((item) => normalizeTicket(item))
        .filter((item): item is Ticket => Boolean(item))
        .filter((item) => !item.userId || item.userId === userId);
    } catch {
      return [];
    }
  }
};

const loadProductNames = async (): Promise<Record<string, string>> => {
  try {
    const response = await apiClient.get('/products');
    const rows = extractList(response.data);
    return rows.reduce((acc, item) => {
      const id = asString(item?.id);
      const name = asString(item?.name);
      if (id && name) {
        acc[id] = name;
      }
      return acc;
    }, {} as Record<string, string>);
  } catch {
    return {};
  }
};

const loadStoreNames = async (): Promise<Record<string, string>> => {
  try {
    const response = await apiClient.get('/stores');
    const rows = extractList(response.data);
    return rows.reduce((acc, item) => {
      const id = asString(item?.id);
      const name = asString(item?.name);
      if (id && name) {
        acc[id] = name;
      }
      return acc;
    }, {} as Record<string, string>);
  } catch {
    return {};
  }
};

export const shoppingHabitsService = {
  getSummary: async (): Promise<ShoppingHabitsSummary> => {
    const empty: ShoppingHabitsSummary = {
      habitualItems: [],
      totalSpentThisMonth: 0,
      topStoreName: 'Sin datos',
      topStoreVisits: 0,
    };

    const userId = await profileService.getUserId();
    if (!userId) return empty;

    const [usualPurchases, fridgeItems, productNameById, tickets, storeNameById] = await Promise.all([
      loadUsualPurchases(userId),
      fridgeService.getAll(),
      loadProductNames(),
      loadTickets(userId),
      loadStoreNames(),
    ]);

    const fridgeByProduct = new Map<string, number>();
    fridgeItems.forEach((item) => {
      const key = item.product.trim().toLowerCase();
      const current = fridgeByProduct.get(key) || 0;
      fridgeByProduct.set(key, current + asNumber(item.quantity, 0));
    });

    const habitualItems: HabitualItemStatus[] = usualPurchases
      .map((purchase) => {
        const productName = productNameById[purchase.productId] || purchase.productId;
        const normalizedName = productName.trim().toLowerCase();
        const currentQuantity = fridgeByProduct.get(normalizedName) || 0;
        const target = Math.max(0, purchase.targetQuantity);
        const missing = Math.max(0, target - currentQuantity);

        return {
          id: purchase.id,
          productId: purchase.productId,
          productName,
          targetQuantity: target,
          currentQuantity,
          missingQuantity: missing,
          hasEnough: missing <= 0,
        };
      })
      .sort((a, b) => {
        if (a.hasEnough !== b.hasEnough) {
          return a.hasEnough ? 1 : -1;
        }
        return b.missingQuantity - a.missingQuantity;
      });

    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyTickets = tickets.filter((ticket) => toMonthKey(ticket.purchaseDate) === thisMonthKey);
    const totalSpentThisMonth = monthlyTickets.reduce((sum, ticket) => sum + ticket.totalAmount, 0);

    const storeStats = monthlyTickets.reduce((acc, ticket) => {
      const storeId = ticket.storeId || 'unknown';
      const current = acc[storeId] || { visits: 0, amount: 0 };
      acc[storeId] = {
        visits: current.visits + 1,
        amount: current.amount + ticket.totalAmount,
      };
      return acc;
    }, {} as Record<string, { visits: number; amount: number }>);

    let topStoreId = '';
    let topStoreVisits = 0;
    let topStoreAmount = 0;

    Object.entries(storeStats).forEach(([storeId, stat]) => {
      if (
        stat.visits > topStoreVisits ||
        (stat.visits === topStoreVisits && stat.amount > topStoreAmount)
      ) {
        topStoreId = storeId;
        topStoreVisits = stat.visits;
        topStoreAmount = stat.amount;
      }
    });

    const topStoreName =
      topStoreId === 'unknown'
        ? 'Sin identificar'
        : storeNameById[topStoreId] || topStoreId || 'Sin datos';

    return {
      habitualItems,
      totalSpentThisMonth,
      topStoreName,
      topStoreVisits,
    };
  },
};
