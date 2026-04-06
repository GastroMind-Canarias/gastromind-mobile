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

const VARIANT_META: Record<
  DialogVariant,
  { color: string; icon: LucideIcon; glow: string }
> = {
  info: { color: "#2D8CFF", icon: Info, glow: "#2D8CFF1F" },
  success: { color: COLORS.primary, icon: CheckCircle2, glow: COLORS.primary + "20" },
  warning: { color: "#E58A12", icon: AlertTriangle, glow: "#E58A121F" },
  danger: { color: COLORS.error, icon: ShieldAlert, glow: COLORS.error + "1F" },
};

export function AppDialog({
  visible,
  title,
  message,
  onClose,
  variant = "info",
  actions,
}: AppDialogProps) {
  const meta = VARIANT_META[variant];
  const Icon = meta.icon;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card}>
          <View style={[styles.topGlow, { backgroundColor: meta.glow }]} />
          <View style={[styles.iconWrap, { borderColor: meta.color + "44" }]}>
            <Icon size={20} color={meta.color} strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
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
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.actionText,
                      tone === "secondary" && styles.actionTextSecondary,
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
