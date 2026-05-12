import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react-native";
import { COLORS } from "../../../shared/theme/colors";
import { useTheme } from "../../../shared/theme/ThemeProvider";

type DialogVariant = "info" | "success" | "warning" | "danger";
type DialogButtonTone = "primary" | "secondary" | "danger";

export type AppDialogAction = {
  label: string;
  onPress: () => void;
  tone?: DialogButtonTone;
};

type AppDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose?: () => void;
  variant?: DialogVariant;
  actions: AppDialogAction[];
};

const getVariantMeta = (primary: string, error: string): Record<
  DialogVariant,
  { color: string; icon: LucideIcon; glow: string }
> => ({
  info: { color: "#2D8CFF", icon: Info, glow: "#2D8CFF1F" },
  success: { color: primary, icon: CheckCircle2, glow: primary + "20" },
  warning: { color: "#E58A12", icon: AlertTriangle, glow: "#E58A121F" },
  danger: { color: error, icon: ShieldAlert, glow: error + "1F" },
});

export function AppDialog({
  visible,
  title,
  message,
  onClose,
  variant = "info",
  actions,
}: AppDialogProps) {
  const { isDark, colors } = useTheme();
  const meta = getVariantMeta(colors.primary, colors.error)[variant];
  const Icon = meta.icon;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[
          styles.overlay,
          isDark && { backgroundColor: "rgba(3,9,6,0.78)" },
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.card,
            isDark && {
              backgroundColor: colors.surface,
              borderColor: colors.secondary + "66",
            },
          ]}
        >
          <View style={[styles.topGlow, { backgroundColor: meta.glow }]} />
          <View
            style={[
              styles.iconWrap,
              { borderColor: meta.color + "44" },
              isDark && { backgroundColor: colors.surfaceAlt },
            ]}
          >
            <Icon size={20} color={meta.color} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, isDark && { color: colors.white }]}>{title}</Text>
          <Text style={[styles.message, isDark && { color: colors.white, opacity: 0.8 }]}>{message}</Text>
          <View style={styles.actionsRow}>
            {actions.map((action) => {
              const tone = action.tone ?? "primary";
              return (
                <TouchableOpacity
                  key={action.label}
                  style={[
                    styles.actionBtn,
                    tone === "secondary" && styles.actionBtnSecondary,
                    tone === "danger" && styles.actionBtnDanger,
                    tone === "secondary" &&
                      isDark && {
                        backgroundColor: colors.surfaceAlt,
                        borderColor: colors.secondary + "66",
                      },
                    tone === "danger" && { backgroundColor: colors.error, borderColor: colors.error },
                    tone === "primary" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.actionText,
                      tone === "secondary" && styles.actionTextSecondary,
                      tone === "secondary" && isDark && { color: colors.white },
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  android: { elevation: 14 },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(8,18,14,0.58)",
  },
  card: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#FCFFFD",
    borderWidth: 1,
    borderColor: "#D5F0E0",
    overflow: "hidden",
    ...SHADOW,
  },
  topGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -50,
    right: -30,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    color: COLORS.text,
    opacity: 0.72,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionBtnSecondary: {
    backgroundColor: "#FFFFFF",
    borderColor: COLORS.text + "22",
  },
  actionBtnDanger: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  actionTextSecondary: {
    color: COLORS.text,
  },
});
