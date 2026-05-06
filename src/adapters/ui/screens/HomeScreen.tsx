import * as React from "react";
import { router } from "expo-router";
import { ROUTES } from "../navigation/routes";
import { useCallback, useEffect, useRef, useState } from "react";
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  const fetchData = useCallback(async () => {
    setLoadingProfile(true);
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
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

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
        onAction={fetchData}
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
                onPress={fetchData}
                accessibilityRole="button"
                accessibilityLabel="Reintentar carga de inicio"
              >
                <Text style={styles.retryInlineBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ── Accesos rápidos ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? COLORS.white : DARK_GREEN, opacity: isDark ? 0.8 : 0.5 }]}>Accesos rápidos</Text>
            <View style={[styles.sectionLine, isDark && { backgroundColor: COLORS.white + "26" }]} />
          </View>

          <View style={styles.quickGrid}>
            <QuickCard
              icon={Snowflake}
              title="Mi Nevera"
              subtitle={`${freshCount} frescos`}
              accentColor={COLORS.primary}
              isDark={isDark}
              onPress={() => router.push(ROUTES.appTabFridge)}
            />
          </View>

          {/* ── Recetas IA ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? COLORS.white : DARK_GREEN, opacity: isDark ? 0.8 : 0.5 }]}>Recetas con IA</Text>
            <View style={[styles.sectionLine, isDark && { backgroundColor: COLORS.white + "26" }]} />
          </View>

          <View style={[styles.recipeHero, isDark && { borderWidth: 1, borderColor: COLORS.secondary + "4D" }]}>
            {/* Decoraciones */}
            <View style={styles.recipeHeroDeco1} />
            <View style={styles.recipeHeroDeco2} />

            <View style={styles.recipeHeroInner}>
              <View style={styles.recipeHeroBadge}>
                <Sparkles size={12} color={COLORS.primary} strokeWidth={2.6} />
                <Text style={styles.recipeHeroBadgeText}>IA</Text>
              </View>
              <Text style={[styles.recipeHeroTitle, { color: isDark ? COLORS.white : COLORS.white }]}>Tu próxima creación</Text>
              <Text style={[styles.recipeHeroSub, { color: isDark ? COLORS.white : ICE, opacity: isDark ? 0.78 : 0.65 }]}>
                GastroMind analizará tu nevera y tus utensilios para generar
                recetas personalizadas solo para ti.
              </Text>
              <TouchableOpacity
                style={[styles.recipeHeroBtn, !isOnline && { opacity: 0.5 }]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!isOnline) return;
                  router.push(ROUTES.aiChat);
                }}
                disabled={!isOnline}
                accessibilityRole="button"
                accessibilityLabel="Generar receta con inteligencia artificial"
              >
                <ChefHat size={14} color={COLORS.white} strokeWidth={2.6} />
                <Text style={[styles.recipeHeroBtnText, { color: COLORS.white }]}>Generar receta</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Miembros del hogar ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? COLORS.white : DARK_GREEN, opacity: isDark ? 0.8 : 0.5 }]}>Hogar</Text>
            <View style={[styles.sectionLine, isDark && { backgroundColor: COLORS.white + "26" }]} />
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
  scroll: { paddingHorizontal: 16, paddingTop: 12 },

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

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: DARK_GREEN,
    opacity: 0.5,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: DARK_GREEN + "15" },

  // Quick grid
  quickGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
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
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 18,
    ...SHADOW_MD,
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
  recipeHeroSub: {
    fontSize: 12,
    color: ICE,
    opacity: 0.65,
    lineHeight: 17,
    marginBottom: 12,
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
  recipeHeroBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },

  // Household card
  householdCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
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
  householdNames: { fontSize: 14, fontWeight: "800", color: DARK_GREEN },
  householdSub: {
    fontSize: 12,
    color: DARK_GREEN,
    opacity: 0.45,
    marginTop: 2,
  },
});

export default HomeScreen;
