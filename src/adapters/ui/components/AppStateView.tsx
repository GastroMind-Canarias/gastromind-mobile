import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, Inbox } from 'lucide-react-native';
import { COLORS } from '@/src/shared/theme/colors';

type AppStateVariant = 'loading' | 'error' | 'empty';

interface AppStateViewProps {
  variant: AppStateVariant;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  isDark?: boolean;
}

const DARK_BG = '#0C100D';
const LIGHT_BG = '#E9F5EE';
const DARK_GREEN = '#0D1F17';

export default function AppStateView({
  variant,
  title,
  message,
  actionLabel,
  onAction,
  isDark = false,
}: AppStateViewProps) {
  const isLoading = variant === 'loading';
  const Icon = variant === 'error' ? AlertTriangle : Inbox;
  const iconColor = variant === 'error' ? COLORS.error : COLORS.primary;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? DARK_BG : LIGHT_BG }]}>
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <View style={[styles.iconWrap, isDark && styles.iconWrapDark]}>
          <Icon size={22} color={iconColor} strokeWidth={2.5} />
        </View>
      )}

      <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
      {message ? <Text style={[styles.message, isDark && styles.messageDark]}>{message}</Text> : null}

      {!isLoading && actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#DFECE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconWrapDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '55',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK_GREEN,
    textAlign: 'center',
    marginBottom: 6,
  },
  titleDark: {
    color: COLORS.white,
  },
  message: {
    fontSize: 13,
    color: DARK_GREEN,
    opacity: 0.68,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  messageDark: {
    color: COLORS.white,
    opacity: 0.78,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
});
