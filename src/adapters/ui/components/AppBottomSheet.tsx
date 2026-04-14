import React from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Sparkles, type LucideIcon } from "lucide-react-native";
import { COLORS } from "../../../shared/theme/colors";
import { useTheme } from "../../../shared/theme/ThemeProvider";

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
  const { isDark, colors } = useTheme();
  const openProgress = React.useRef(new Animated.Value(0)).current;
  const dragY = React.useRef(new Animated.Value(0)).current;

  const enterTranslateY = openProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [140, 0],
  });
  const overlayOpacity = openProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const sheetScale = openProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });
  const translateY = Animated.add(enterTranslateY, dragY);

  React.useEffect(() => {
    if (!visible) return;
    openProgress.setValue(0);
    dragY.setValue(0);
    Animated.spring(openProgress, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 210,
      mass: 0.9,
    }).start();
  }, [dragY, openProgress, visible]);

  const dismissSheet = React.useCallback(
    (extraDrag = 160) => {
      Animated.parallel([
        Animated.timing(openProgress, {
          toValue: 0,
          duration: 190,
          useNativeDriver: true,
        }),
        Animated.timing(dragY, {
          toValue: extraDrag,
          duration: 190,
          useNativeDriver: true,
        }),
      ]).start(() => {
        dragY.setValue(0);
        openProgress.setValue(0);
        onClose();
      });
    },
    [dragY, onClose, openProgress]
  );

  const resetPosition = React.useCallback(() => {
    Animated.spring(dragY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 200,
      mass: 0.7,
    }).start();
  }, [dragY]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
        onPanResponderMove: (_, gestureState) => {
          const nextY = Math.max(0, gestureState.dy);
          dragY.setValue(nextY);
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose = gestureState.dy > 110 || gestureState.vy > 1.2;
          if (shouldClose) {
            dismissSheet(Math.max(160, gestureState.dy + gestureState.vy * 120));
            return;
          }
          resetPosition();
        },
        onPanResponderTerminate: resetPosition,
      }),
    [dismissSheet, dragY, resetPosition]
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayOpacity },
          isDark && { backgroundColor: "rgba(3,9,6,0.8)" },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dismissSheet()} />
        <Pressable>
          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY }, { scale: sheetScale }] },
              isDark && {
                backgroundColor: colors.surface,
                borderTopColor: colors.secondary + "66",
              },
            ]}
          >
            <View style={[styles.glowA, isDark && { backgroundColor: colors.primary + "1D" }]} />
            <View style={[styles.glowB, isDark && { backgroundColor: colors.accent + "19" }]} />
            <View style={styles.dragHandleHitArea} {...panResponder.panHandlers}>
              <View style={[styles.handle, isDark && { backgroundColor: colors.white + "34" }]} />
            </View>
            <View style={styles.titleRow}>
              <View
                style={[
                  styles.iconWrap,
                  { borderColor: iconColor + "44" },
                  isDark && { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Icon size={16} color={iconColor} strokeWidth={2.6} />
              </View>
              <Text style={[styles.title, isDark && { color: colors.white }]}>{title}</Text>
            </View>
            {children}
          </Animated.View>
        </Pressable>
      </Animated.View>
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
  dragHandleHitArea: {
    alignSelf: "center",
    width: 90,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.text + "1F",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
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
