import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { COLORS } from '@/src/shared/theme/colors';

interface AppEmptyStateProps {
  title: string;
  message: string;
  isDark?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

const DARK_GREEN = '#0D1F17';

export default function AppEmptyState({
  title,
  message,
  isDark = false,
  actionLabel,
  onAction,
}: AppEmptyStateProps) {
  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={[styles.iconWrap, isDark && styles.iconWrapDark]}>
        <Inbox size={24} color={COLORS.primary} strokeWidth={2.4} />
      </View>
      <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
      <Text style={[styles.message, isDark && styles.messageDark]}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0ECE5',
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  cardDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '55',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconWrapDark: {
    backgroundColor: COLORS.white + '14',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: DARK_GREEN,
    marginBottom: 6,
    textAlign: 'center',
  },
  titleDark: { color: COLORS.white },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: DARK_GREEN,
    opacity: 0.58,
    textAlign: 'center',
  },
  messageDark: {
    color: COLORS.white,
    opacity: 0.78,
  },
  button: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
