import type { FridgeItem } from '@/src/core/domain/fridgeItem.types';

const DAY_MS = 1000 * 60 * 60 * 24;

export function getDaysUntilExpiry(expirationDate: string, fromDate: Date = new Date()): number {
  const exp = new Date(`${expirationDate}T00:00:00`);
  if (Number.isNaN(exp.getTime())) return Number.NaN;

  const startOfDay = new Date(fromDate);
  startOfDay.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - startOfDay.getTime()) / DAY_MS);
}

export function isNearExpiry(expirationDate: string, daysBeforeExpiry: number): boolean {
  const days = getDaysUntilExpiry(expirationDate);
  if (Number.isNaN(days)) return false;
  return days >= 0 && days <= daysBeforeExpiry;
}

export function getNearExpiryItems(items: FridgeItem[], daysBeforeExpiry: number): FridgeItem[] {
  return items.filter((item) => isNearExpiry(item.expirationDate, daysBeforeExpiry));
}
