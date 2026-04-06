import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Sparkles, type LucideIcon } from "lucide-react-native";
import { COLORS } from "../../../shared/theme/colors";

type AppBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
};

export function AppBottomSheet({
  visible,
  onClose,
  title,
  icon: Icon = Sparkles,
  iconColor = COLORS.primary,
  children,
}: AppBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { borderColor: iconColor + "44" }]}>
              <Icon size={16} color={iconColor} strokeWidth={2.6} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const SHADOW_MD = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
  },
  android: { elevation: 12 },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(7,20,14,0.62)",
  },
  sheet: {
    backgroundColor: "#F8FFFB",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#D0F0DD",
    overflow: "hidden",
    ...SHADOW_MD,
  },
  glowA: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primary + "14",
    top: -40,
    right: -20,
  },
  glowB: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.accent + "12",
    bottom: -20,
    left: -14,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.text + "1F",
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 18,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});
