import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/src/shared/theme/colors';

type PrimaryTone = 'primary' | 'danger';

interface AppActionBarProps {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  loading?: boolean;
  disabled?: boolean;
  isDark?: boolean;
  primaryTone?: PrimaryTone;
}

export default function AppActionBar({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  loading = false,
  disabled = false,
  isDark = false,
  primaryTone = 'primary',
}: AppActionBarProps) {
  const primaryBg = primaryTone === 'danger' ? COLORS.error : COLORS.primary;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onPrimary}
        disabled={disabled}
        style={[
          styles.button,
          styles.primary,
          { backgroundColor: primaryBg, borderColor: primaryBg },
          disabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        )}
      </TouchableOpacity>

      {secondaryLabel && onSecondary ? (
        <TouchableOpacity
          onPress={onSecondary}
          disabled={disabled}
          style={[
            styles.button,
            styles.secondary,
            isDark && styles.secondaryDark,
            disabled && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
        >
          <Text style={[styles.secondaryText, isDark && styles.secondaryTextDark]}>{secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  button: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  primary: {
    flex: 1,
  },
  secondary: {
    minWidth: 110,
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary + '45',
  },
  secondaryDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '60',
  },
  primaryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryTextDark: {
    color: COLORS.white,
  },
  disabled: {
    opacity: 0.6,
  },
});
