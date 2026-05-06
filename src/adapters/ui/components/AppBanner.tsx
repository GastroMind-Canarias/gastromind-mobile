import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react-native';
import { COLORS } from '@/src/shared/theme/colors';

type AppBannerVariant = 'info' | 'success' | 'warning' | 'error';

interface AppBannerProps {
  title?: string;
  message: string;
  variant?: AppBannerVariant;
  isDark?: boolean;
  onClose?: () => void;
}

const DARK_GREEN = '#0D1F17';

const VARIANT_MAP: Record<AppBannerVariant, { color: string; bg: string; border: string; icon: React.ComponentType<any> }> = {
  info: { color: '#2364AA', bg: '#EAF2FF', border: '#C9DCF8', icon: Info },
  success: { color: '#1E8E5A', bg: '#EAF8F1', border: '#CBEBD9', icon: CheckCircle2 },
  warning: { color: '#C27A00', bg: '#FFF6E6', border: '#F2D8A0', icon: TriangleAlert },
  error: { color: COLORS.error, bg: '#FFECEC', border: '#F6C4C4', icon: AlertTriangle },
};

export default function AppBanner({ title, message, variant = 'info', isDark = false, onClose }: AppBannerProps) {
  const cfg = VARIANT_MAP[variant];
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
        isDark && styles.rootDark,
      ]}
    >
      <View style={[styles.iconWrap, isDark && styles.iconWrapDark]}>
        <cfg.icon size={16} color={cfg.color} strokeWidth={2.4} />
      </View>

      <View style={styles.content}>
        {title ? <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text> : null}
        <Text style={[styles.message, isDark && styles.messageDark]}>{message}</Text>
      </View>

      {onClose ? (
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={14} color={isDark ? COLORS.white : DARK_GREEN} strokeWidth={2.6} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  rootDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '66',
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  iconWrapDark: {
    backgroundColor: COLORS.white + '18',
  },
  content: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: DARK_GREEN,
    marginBottom: 1,
  },
  titleDark: { color: COLORS.white },
  message: {
    fontSize: 12,
    lineHeight: 17,
    color: DARK_GREEN,
    opacity: 0.75,
  },
  messageDark: {
    color: COLORS.white,
    opacity: 0.8,
  },
  closeBtn: {
    paddingTop: 2,
  },
});
