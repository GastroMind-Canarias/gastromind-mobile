import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { FridgeItem } from '@/src/core/domain/fridgeItem.types';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '@/src/core/domain/notification.types';
import { getNearExpiryItems } from '@/src/shared/utils/expiry';

const PREFS_KEY = 'notificationPreferences';
const EXPIRY_NOTIFICATION_TYPE = 'expiry-near';
let notificationsModule: typeof import('expo-notifications') | null = null;
let notificationHandlerConfigured = false;

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

async function getNotificationsModule(): Promise<typeof import('expo-notifications') | null> {
  if (Platform.OS === 'web' || isExpoGo()) return null;
  if (notificationsModule) return notificationsModule;

  notificationsModule = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return notificationsModule;
}

async function ensureAndroidChannel(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('expiry-alerts', {
    name: 'Avisos de caducidad',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#4DC763',
  });
}

function normalizePreferences(raw: Partial<NotificationPreferences> | null): NotificationPreferences {
  if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;

  return {
    enabled: raw.enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.enabled,
    daysBeforeExpiry:
      typeof raw.daysBeforeExpiry === 'number' && raw.daysBeforeExpiry >= 0
        ? Math.floor(raw.daysBeforeExpiry)
        : DEFAULT_NOTIFICATION_PREFERENCES.daysBeforeExpiry,
    quietHoursStart:
      typeof raw.quietHoursStart === 'number' ? raw.quietHoursStart : DEFAULT_NOTIFICATION_PREFERENCES.quietHoursStart,
    quietHoursEnd:
      typeof raw.quietHoursEnd === 'number' ? raw.quietHoursEnd : DEFAULT_NOTIFICATION_PREFERENCES.quietHoursEnd,
    timezone: raw.timezone || DEFAULT_NOTIFICATION_PREFERENCES.timezone,
  };
}

async function clearPreviousExpiryNotifications(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const targets = scheduled.filter(
    (notification: import('expo-notifications').NotificationRequest) =>
      notification.content.data?.type === EXPIRY_NOTIFICATION_TYPE,
  );

  await Promise.all(
    targets.map((item: import('expo-notifications').NotificationRequest) =>
      Notifications.cancelScheduledNotificationAsync(item.identifier),
    ),
  );
}

function createTriggerDate(expirationDate: string, daysBeforeExpiry: number): Date | null {
  const expiry = new Date(`${expirationDate}T10:00:00`);
  if (Number.isNaN(expiry.getTime())) return null;

  expiry.setDate(expiry.getDate() - daysBeforeExpiry);
  if (expiry.getTime() <= Date.now()) return null;
  return expiry;
}

export const notificationService = {
  getPreferences: async (): Promise<NotificationPreferences> => {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
      return normalizePreferences(JSON.parse(raw));
    } catch {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  },

  updatePreferences: async (
    patch: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> => {
    const current = await notificationService.getPreferences();
    const next = normalizePreferences({ ...current, ...patch });
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
    return next;
  },

  getPermissionStatus: async (): Promise<'granted' | 'denied' | 'undetermined'> => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return 'denied';
    const status = await Notifications.getPermissionsAsync();
    return status.status;
  },

  requestPermission: async (): Promise<'granted' | 'denied' | 'undetermined'> => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return 'denied';
    const result = await Notifications.requestPermissionsAsync();
    return result.status;
  },

  enableLocalNotificationsAsync: async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    await ensureAndroidChannel();

    let permission = await notificationService.getPermissionStatus();
    if (permission !== 'granted') {
      permission = await notificationService.requestPermission();
    }
    return permission === 'granted';
  },

  bootstrap: async (): Promise<void> => {
    if (Platform.OS === 'web' || isExpoGo()) return;
    await ensureAndroidChannel();
  },

  syncLocalExpiryNotifications: async (items: FridgeItem[]): Promise<void> => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    const prefs = await notificationService.getPreferences();
    const permission = await notificationService.getPermissionStatus();
    if (!prefs.enabled || permission !== 'granted') {
      await clearPreviousExpiryNotifications();
      return;
    }

    await clearPreviousExpiryNotifications();
    const nearExpiryItems = getNearExpiryItems(items, prefs.daysBeforeExpiry);

    await Promise.all(
      nearExpiryItems.map(async (item) => {
        const trigger = createTriggerDate(item.expirationDate, prefs.daysBeforeExpiry);
        if (!trigger) return;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Producto por caducar',
            body: `${item.product} caduca pronto. Revísalo en tu nevera.`,
            data: {
              type: EXPIRY_NOTIFICATION_TYPE,
              route: '/(app)/(tabs)/fridge',
              itemId: item.id,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger,
          },
        });
      }),
    );
  },

  addNotificationResponseListener: (
    listener: (response: import('expo-notifications').NotificationResponse) => void,
  ): { remove: () => void } => {
    const noOp = { remove: () => {} };

    if (Platform.OS === 'web' || isExpoGo()) {
      return noOp;
    }

    void getNotificationsModule().then((Notifications) => {
      if (!Notifications) return;
      const sub = Notifications.addNotificationResponseReceivedListener(listener);
      noOp.remove = () => sub.remove();
    });

    return noOp;
  },
};
