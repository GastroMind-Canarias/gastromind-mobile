export interface NotificationPreferences {
  enabled: boolean;
  daysBeforeExpiry: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  timezone: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  daysBeforeExpiry: 2,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};
