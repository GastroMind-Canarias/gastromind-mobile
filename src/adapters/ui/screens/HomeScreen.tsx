import * as React from "react";
import { router } from "expo-router";
import { ROUTES } from "../navigation/routes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChefHat,
  Home,
  LogOut,
  ShieldAlert,
  Snowflake,
  Sparkles,
  User,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FridgeItem, ItemStatus } from "../../../core/domain/fridgeItem.types";
import { COLORS } from "../../../shared/theme/colors";
import { useTheme } from "../../../shared/theme/ThemeProvider";
import { useNetwork } from "../../../shared/network/NetworkProvider";
import { fridgeService } from "../../external/api/FridgeService";
import { profileService } from "../../external/api/ProfileService";
import { UserProfile } from "../../../core/domain/profile.types";
import { useAuth } from "../hooks/useAuth";
import AppStateView from "../components/AppStateView";
import AppBanner from "../components/AppBanner";
import { notificationService } from "../../external/notifications/NotificationService";
import { getNearExpiryItems } from "../../../shared/utils/expiry";

// ─── Constantes de tema (idénticas al resto de pantallas) ─────────────────────
const DARK_GREEN = "#0D1F17";
const MID_GREEN = "#1A3826";
const ICE = "#C8F0DC";

// ─── Helper: hora del día ─────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 13) return "¡Buenos días";
  if (h < 20) return "¡Buenas tardes";
  return "¡Buenas noches";
}

// ─── Avatar mini ──────────────────────────────────────────────────────────────
function Avatar({ name: _name, size = 44 }: { name: string; size?: number }) {
  const iconSize = Math.max(14, size * 0.45);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.primary,
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <User size={iconSize} color={COLORS.white} strokeWidth={2.5} />
    </View>
  );
}

// ─── Header metric tile ───────────────────────────────────────────────────────
function HeaderMetric({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.headerMetricTile,
        { borderColor: color + "55" },
      ]}
    >
      <View style={[styles.headerMetricIconWrap, { backgroundColor: color + "2A" }]}>
        <Icon size={12} color={color} strokeWidth={2.5} />
      </View>
      <Text style={[styles.headerMetricValue, { color }]}>{value}</Text>
      <Text style={styles.headerMetricLabel}>{label}</Text>
    </View>
  );
}

// ─── Quick-action card ────────────────────────────────────────────────────────
function QuickCard({
  icon: Icon,
  title,
  subtitle,
  accentColor,
  isDark,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accentColor: string;
  isDark: boolean;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <Animated.View
      style={[
        styles.quickCard,
        isDark && { backgroundColor: "#11351A", borderWidth: 1, borderColor: COLORS.secondary + "44" },
        { transform: [{ scale }] },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={{ flex: 1 }}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={subtitle}
      >
        <View
          style={[styles.quickCardStrip, { backgroundColor: accentColor }]}
        />
        <View style={styles.quickCardBody}>
          <View
            style={[
              styles.quickCardIconWrap,
              { backgroundColor: accentColor + "22" },
            ]}
          >
            <Icon size={20} color={accentColor} strokeWidth={2.4} />
          </View>
          <Text style={[styles.quickCardTitle, { color: isDark ? COLORS.white : DARK_GREEN }]}>{title}</Text>
          <Text
            style={[
              styles.quickCardSub,
              { color: isDark ? COLORS.white : DARK_GREEN, opacity: isDark ? 0.72 : 0.45 },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const HEADER_TOP_GAP = 8;

const HomeScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { isOnline } = useNetwork();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pushPermissionGranted, setPushPermissionGranted] = useState(false);
  const [notificationDaysBeforeExpiry, setNotificationDaysBeforeExpiry] = useState(2);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoadingProfile(true);
    setLoadError(null);
    try {
      const [items, p] = await Promise.all([
        fridgeService.getAll(),
        profileService.get(),
      ]);
      setFridgeItems(items);
      setProfile(p);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "No pudimos cargar el inicio.";
      setLoadError(message);
      setProfile(null);
    } finally {
      if (showLoader) setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData(false).catch(() => {});
    }, [fetchData]),
  );

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      const [permission, prefs] = await Promise.all([
        notificationService.getPermissionStatus(),
        notificationService.getPreferences(),
      ]);
      setPushPermissionGranted(permission === "granted");
      setNotificationDaysBeforeExpiry(prefs.daysBeforeExpiry);
    };

    fetchNotificationSettings().catch(() => {});
  }, []);


  if (loadingProfile) {
    return (
      <AppStateView
        variant="loading"
        title="Cargando inicio"
        message="Estamos preparando tu panel de cocina."
        isDark={isDark}
      />
    );
  }

  if (!profile) {
    return (
      <AppStateView
        variant="error"
        title="No se pudo cargar el inicio"
        message={loadError ?? "Intenta nuevamente en unos segundos."}
        actionLabel="Reintentar"
        onAction={() => fetchData(true)}
        isDark={isDark}
      />
    );
  }

  const expiredCount = fridgeItems.filter(
    (i) => i.status === ItemStatus.EXPIRED,
  ).length;
  const freshCount = fridgeItems.filter(
    (i) => i.status === ItemStatus.GOOD,
  ).length;
  const nearExpiryCount = getNearExpiryItems(fridgeItems, notificationDaysBeforeExpiry).length;
  const memberCount = profile.householdMembers.length;
  const toolCount = profile.kitchenTools.length;

  const firstName = (profile.name || "Chef").split(" ")[0] || "Chef";

  return (
    <View style={[styles.root, isDark && { backgroundColor: "#0C100D" }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0C100D" : DARK_GREEN}
        translucent={false}
      />
      {/* ══ HEADER PANEL ══ */}
      <View style={[styles.header, isDark && styles.headerDark, { paddingTop: insets.top + HEADER_TOP_GAP }]}> 
        <View style={styles.headerDecoA} />
        <View style={styles.headerDecoB} />
        <View style={styles.headerDecoC} />

        <View style={styles.headerTopBar}>
          <View style={styles.ledRow}>
            <View style={styles.led} />
            <Text style={styles.headerEyebrow}>GastroMind</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesion"
          >
            <LogOut size={13} color={COLORS.error} strokeWidth={2.6} />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroRow}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.greetingSub}>{getGreeting()},</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
            <Text style={styles.heroCaption}>
              Tu cocina en control: estado del hogar y nevera en un solo vistazo.
            </Text>
          </View>

          <View style={styles.heroDotCol}>
            <View style={styles.heroDot} />
            <View style={[styles.heroDot, styles.heroDotSoft]} />
          </View>
        </View>

        <View style={styles.headerMetricGrid}>
          <HeaderMetric
            icon={Snowflake}
            value={fridgeItems.length}
            label="En nevera"
            color={COLORS.primary}
          />
          <HeaderMetric
            icon={ShieldAlert}
            value={expiredCount}
            label="Caducados"
            color={COLORS.error}
          />
          <HeaderMetric
            icon={Home}
            value={memberCount}
            label="Personas"
            color={COLORS.accent}
          />
          <HeaderMetric
            icon={UtensilsCrossed}
            value={toolCount}
            label="Utensilios"
            color="#5BBCFF"
          />
        </View>

      </View>

      {/* ══ BODY ══ */}
      <Animated.View
        style={[
          { flex: 1 },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <ScrollView
          key={isDark ? "home-dark" : "home-light"}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {!isOnline ? (
            <View style={{ marginBottom: 12 }}>
              <AppBanner
                variant="warning"
                title="Modo sin conexion"
                message="La generacion de recetas IA no esta disponible sin internet."
                isDark={isDark}
              />
            </View>
          ) : null}

          {nearExpiryCount > 0 && !pushPermissionGranted ? (
            <TouchableOpacity
              style={styles.pushBanner}
              onPress={() => router.push(ROUTES.appTabProfile)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Configurar avisos de caducidad"
            >
              <View style={styles.alertBannerIconWrap}>
                <Sparkles size={18} color={COLORS.accent} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pushBannerTitle, isDark && { color: "#FFEFD1" }]}>Activa avisos de caducidad</Text>
                <Text style={[styles.pushBannerSub, isDark && { color: "#FFEFD1", opacity: 0.82 }]}>Tienes {nearExpiryCount} producto{nearExpiryCount === 1 ? "" : "s"} cerca de caducar.</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Alerta caducados */}
          {expiredCount > 0 && (
            <TouchableOpacity
              style={[
                styles.alertBanner,
                isDark && { backgroundColor: COLORS.error + "20", borderColor: COLORS.error + "66" },
              ]}
              onPress={() => router.push(ROUTES.appTabFridge)}
              activeOpacity={0.85}
            >
              <View style={styles.alertBannerIconWrap}>
                <ShieldAlert size={18} color={COLORS.error} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertBannerTitle, isDark && { color: "#FFD6D6" }]}>
                  {expiredCount === 1
                    ? "1 producto caducado en tu nevera"
                    : `${expiredCount} productos caducados en tu nevera`}
                </Text>
                <Text style={[styles.alertBannerSub, isDark && { color: "#FFD6D6", opacity: 0.82 }]}>
                  Toca para revisar tu nevera →
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {loadError ? (
            <View style={{ marginBottom: 14, gap: 8 }}>
              <AppBanner
                variant="error"
                title="No se pudo actualizar inicio"
                message={loadError}
                isDark={isDark}
                onClose={() => setLoadError(null)}
              />
              <TouchableOpacity
                style={styles.retryInlineBtn}
                activeOpacity={0.85}
                onPress={() => fetchData(true)}
                accessibilityRole="button"
                accessibilityLabel="Reintentar carga de inicio"
              >
                <Text style={styles.retryInlineBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={[styles.organicPanel, isDark && styles.organicPanelDark]}>
            <View style={styles.organicPanelDecoA} />
            <View style={styles.organicPanelDecoB} />
            <View style={[styles.organicDot, styles.organicDotA, isDark && styles.organicDotDark]} />
            <View style={[styles.organicDot, styles.organicDotB, isDark && styles.organicDotDark]} />
            <View style={[styles.organicDot, styles.organicDotC, isDark && styles.organicDotDark]} />
            <View style={[styles.organicDot, styles.organicDotD, isDark && styles.organicDotDark]} />
            <View style={[styles.organicDotSoft, styles.organicDotE, isDark && styles.organicDotSoftDark]} />
            <View style={[styles.organicDotSoft, styles.organicDotF, isDark && styles.organicDotSoftDark]} />

          <View style={[styles.recipeHero, styles.recipeHeroPrimary, isDark && { borderWidth: 1, borderColor: COLORS.secondary + "4D" }]}>
            <View style={styles.recipeHeroDeco1} />
            <View style={styles.recipeHeroDeco2} />

            <View style={styles.recipeHeroInner}>
              <View style={styles.recipeHeroTopRow}>
                <View style={styles.recipeHeroBadge}>
                  <Sparkles size={12} color={COLORS.primary} strokeWidth={2.6} />
                  <Text style={styles.recipeHeroBadgeText}>IA principal</Text>
                </View>
                <View style={[styles.aiChip, !isOnline && styles.aiChipOffline]}>
                  <Text style={styles.aiChipText}>{isOnline ? "En linea" : "Sin conexion"}</Text>
                </View>
              </View>
              <Text style={[styles.recipeHeroTitle, styles.recipeHeroTitlePrimary, { color: COLORS.white }]}>Tu asistente de cocina IA</Text>
              <Text style={[styles.recipeHeroSub, styles.recipeHeroSubPrimary, { color: isDark ? COLORS.white : ICE, opacity: isDark ? 0.8 : 0.7 }]}> 
                Analiza tu nevera y utensilios para sugerirte recetas viables hoy.
              </Text>
              <TouchableOpacity
                style={[styles.recipeHeroBtn, styles.recipeHeroBtnPrimary, !isOnline && { opacity: 0.5 }]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!isOnline) return;
                  router.push(ROUTES.aiChat);
                }}
                disabled={!isOnline}
                accessibilityRole="button"
                accessibilityLabel="Abrir asistente de recetas con inteligencia artificial"
              >
                <ChefHat size={15} color={COLORS.white} strokeWidth={2.7} />
                <Text style={[styles.recipeHeroBtnText, { color: COLORS.white }]}>Abrir asistente IA</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.utilityGrid}>
            <TouchableOpacity
              style={[styles.utilityCard, isDark && styles.utilityCardDark]}
              activeOpacity={0.85}
              onPress={() => router.push(ROUTES.appTabFridge)}
              accessibilityRole="button"
              accessibilityLabel="Abrir nevera"
            >
              <View style={[styles.utilityIconWrap, { backgroundColor: COLORS.primary + "20" }]}>
                <Snowflake size={16} color={COLORS.primary} strokeWidth={2.5} />
              </View>
              <Text style={[styles.utilityTitle, isDark && styles.utilityTitleDark]}>Nevera</Text>
              <Text style={[styles.utilitySub, isDark && styles.utilitySubDark]}>Gestiona productos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.utilityCard, isDark && styles.utilityCardDark]}
              activeOpacity={0.85}
              onPress={() => router.push(ROUTES.appTabShopping)}
              accessibilityRole="button"
              accessibilityLabel="Abrir lista de compras"
            >
              <View style={[styles.utilityIconWrap, { backgroundColor: COLORS.accent + "20" }]}>
                <UtensilsCrossed size={16} color={COLORS.accent} strokeWidth={2.5} />
              </View>
              <Text style={[styles.utilityTitle, isDark && styles.utilityTitleDark]}>Compras</Text>
              <Text style={[styles.utilitySub, isDark && styles.utilitySubDark]}>Prepara tu lista</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.utilityCard, isDark && styles.utilityCardDark]}
              activeOpacity={0.85}
              onPress={() => router.push(ROUTES.appTabProfile)}
              accessibilityRole="button"
              accessibilityLabel="Abrir perfil"
            >
              <View style={[styles.utilityIconWrap, { backgroundColor: "#5BBCFF22" }]}>
                <User size={16} color="#5BBCFF" strokeWidth={2.5} />
              </View>
              <Text style={[styles.utilityTitle, isDark && styles.utilityTitleDark]}>Perfil</Text>
              <Text style={[styles.utilitySub, isDark && styles.utilitySubDark]}>Ajustes del hogar</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.householdCard, isDark && { backgroundColor: "#11351A", borderWidth: 1, borderColor: COLORS.secondary + "44" }]}> 
            <View style={styles.householdAvatars}>
              {profile.householdMembers.map((m, i) => (
                <View
                  key={m.id}
                  style={[
                    styles.householdAvatarWrap,
                    {
                      marginLeft: i === 0 ? 0 : -10,
                      zIndex: profile.householdMembers.length - i,
                    } as any,
                  ]}
                >
                  <Avatar name={m.name} size={40} />
                </View>
              ))}
            </View>
            <View style={styles.householdInfo}>
              <Text style={[styles.householdTopLabel, { color: isDark ? COLORS.white : DARK_GREEN }]}>Hogar</Text>
              <Text style={[styles.householdNames, { color: isDark ? COLORS.white : DARK_GREEN }]}>
                {profile.householdMembers.length
                  ? profile.householdMembers.map((m) => m.name).join(", ")
                  : "Sin miembros cargados"}
              </Text>
              <Text
                style={[
                  styles.householdSub,
                  { color: isDark ? COLORS.white : DARK_GREEN, opacity: isDark ? 0.72 : 0.45 },
                ]}
              >
                {memberCount === 1
                  ? "1 persona en el hogar"
                  : `${memberCount} personas en el hogar`}
              </Text>
            </View>
          </View>

          </View>

        </ScrollView>
      </Animated.View>

    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const SHADOW_SM = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
});
const SHADOW_MD = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  android: { elevation: 10 },
});
const SHADOW_PRIMARY = Platform.select({
  ios: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  android: { elevation: 10 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#E9F5EE" },

  // ── Header
  header: {
    backgroundColor: "#0A1B14",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
    ...SHADOW_MD,
  },
  headerDark: {
    backgroundColor: "#08140F",
  },
  headerDecoA: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.primary + "2A",
    top: -80,
    right: -46,
  },
  headerDecoB: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.accent + "22",
    bottom: -38,
    left: -42,
  },
  headerDecoC: {
    position: "absolute",
    width: 120,
    height: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primary + "66",
    right: -20,
    top: 24,
    transform: [{ rotate: "-24deg" }],
  },
  headerTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ledRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  led: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.9,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 2 },
    }),
  },
  headerEyebrow: {
    color: ICE,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.8,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: MID_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.error + "55",
  },
  logoutText: { color: COLORS.error, fontWeight: "700", fontSize: 13 },

  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  heroTextBlock: { flex: 1, paddingTop: 2 },
  greetingSub: {
    color: ICE,
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.84,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  greetingName: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  heroCaption: {
    marginTop: 6,
    color: ICE,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.68,
    fontWeight: "500",
    maxWidth: 230,
  },
  heroDotCol: {
    alignItems: "center",
    gap: 8,
    paddingRight: 2,
  },
  heroDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  heroDotSoft: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    opacity: 0.8,
  },

  // Header metrics
  headerMetricGrid: {
    flexDirection: "row",
    gap: 6,
  },
  headerMetricTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 13,
    borderWidth: 1.2,
    backgroundColor: COLORS.white + "08",
  },
  headerMetricIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerMetricValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  headerMetricLabel: {
    fontSize: 9,
    color: ICE,
    opacity: 0.75,
    fontWeight: "700",
    marginTop: 1,
    letterSpacing: 0.2,
  },

  // ── Scroll body
  scroll: { paddingHorizontal: 16, paddingTop: 10 },

  organicPanel: {
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingTop: 8,
    borderRadius: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    overflow: "visible",
  },
  organicPanelDark: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  organicPanelDecoA: {
    position: "absolute",
    width: 180,
    height: 120,
    borderRadius: 90,
    backgroundColor: COLORS.primary + "0D",
    top: -52,
    right: -36,
    transform: [{ rotate: "-14deg" }],
  },
  organicPanelDecoB: {
    position: "absolute",
    width: 130,
    height: 90,
    borderRadius: 65,
    backgroundColor: COLORS.accent + "12",
    bottom: -38,
    left: -34,
    transform: [{ rotate: "12deg" }],
  },
  organicDot: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary + "26",
  },
  organicDotSoft: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent + "2E",
  },
  organicDotDark: {
    backgroundColor: COLORS.primary + "3A",
  },
  organicDotSoftDark: {
    backgroundColor: COLORS.accent + "42",
  },
  organicDotA: { top: 24, right: 22 },
  organicDotB: { top: 72, left: 10 },
  organicDotC: { top: 168, right: 8 },
  organicDotD: { bottom: 30, left: 18 },
  organicDotE: { top: 116, right: 54 },
  organicDotF: { bottom: 92, right: 24 },

  // Alert banner
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.error + "15",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.error + "44",
  },
  alertBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.error + "20",
    borderWidth: 1,
    borderColor: COLORS.error + "4A",
  },
  alertBannerTitle: { fontSize: 14, fontWeight: "800", color: COLORS.error },
  alertBannerSub: {
    fontSize: 12,
    color: COLORS.error,
    opacity: 0.7,
    marginTop: 2,
  },
  retryInlineBtn: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryInlineBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  pushBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.accent + "16",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.accent + "44",
  },
  pushBannerTitle: { fontSize: 14, fontWeight: "800", color: "#8C5600" },
  pushBannerSub: {
    fontSize: 12,
    color: "#8C5600",
    opacity: 0.72,
    marginTop: 2,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: DARK_GREEN,
    opacity: 0.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  sectionLine: { flex: 1, height: 2, borderRadius: 99, backgroundColor: DARK_GREEN + "12" },

  // Quick grid
  quickGrid: { flexDirection: "row", gap: 10, marginBottom: 14 },
  snapRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF4ED",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DFECE3",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
    ...SHADOW_SM,
  },
  snapRowDark: {
    backgroundColor: "#133022",
    borderColor: COLORS.secondary + "40",
  },
  snapItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  snapValue: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  snapLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: DARK_GREEN,
    opacity: 0.6,
  },
  snapLabelDark: { color: COLORS.white, opacity: 0.72 },
  snapDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: DARK_GREEN + "16",
    marginVertical: 4,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#EDF6F0",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0EDE4",
    overflow: "hidden",
    ...SHADOW_SM,
  },
  quickCardStrip: { height: 5 },
  quickCardBody: { padding: 16 },
  quickCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickCardEmoji: { fontSize: 24 },
  quickCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: DARK_GREEN,
    marginBottom: 3,
  },
  quickCardSub: {
    fontSize: 12,
    color: DARK_GREEN,
    opacity: 0.45,
    fontWeight: "500",
  },

  // Recipe hero card
  recipeHero: {
    backgroundColor: DARK_GREEN,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 14,
    ...SHADOW_MD,
  },
  recipeHeroPrimary: {
    marginBottom: 12,
    borderRadius: 30,
  },
  recipeHeroDeco1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary + "18",
    top: -40,
    right: -30,
  },
  recipeHeroDeco2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent + "15",
    bottom: -20,
    left: 20,
  },
  recipeHeroInner: { paddingHorizontal: 18, paddingVertical: 16 },
  recipeHeroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  recipeHeroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary + "30",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: COLORS.primary + "55",
    marginBottom: 10,
  },
  recipeHeroBadgeText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  recipeHeroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  recipeHeroTitlePrimary: {
    fontSize: 23,
    marginBottom: 7,
  },
  recipeHeroSub: {
    fontSize: 12,
    color: ICE,
    opacity: 0.65,
    lineHeight: 17,
    marginBottom: 12,
  },
  recipeHeroSubPrimary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  recipeHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...SHADOW_PRIMARY,
  },
  recipeHeroBtnPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  recipeHeroBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  aiChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
    backgroundColor: COLORS.primary + "26",
  },
  aiChipOffline: {
    borderColor: COLORS.error + "66",
    backgroundColor: COLORS.error + "26",
  },
  aiChipText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  utilityGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: "#EDF6F0",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DEEBE2",
    paddingVertical: 12,
    paddingHorizontal: 10,
    ...SHADOW_SM,
  },
  utilityCardDark: {
    backgroundColor: "#123022",
    borderColor: COLORS.secondary + "38",
  },
  utilityIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  utilityTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: DARK_GREEN,
    marginBottom: 2,
  },
  utilityTitleDark: {
    color: COLORS.white,
  },
  utilitySub: {
    fontSize: 11,
    fontWeight: "500",
    color: DARK_GREEN,
    opacity: 0.58,
  },
  utilitySubDark: {
    color: COLORS.white,
    opacity: 0.72,
  },

  // Household card
  householdCard: {
    backgroundColor: "#EDF6F0",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0EDE4",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
    ...SHADOW_SM,
  },
  householdAvatars: { flexDirection: "row", alignItems: "center" },
  householdAvatarWrap: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  householdInfo: { flex: 1 },
  householdTopLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: 3,
  },
  householdNames: { fontSize: 14, fontWeight: "800", color: DARK_GREEN },
  householdSub: {
    fontSize: 12,
    color: DARK_GREEN,
    opacity: 0.45,
    marginTop: 2,
  },
});

export default HomeScreen;
