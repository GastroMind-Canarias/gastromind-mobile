import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Check,
  ChevronDown,
  ChevronUp,
  CookingPot,
  House,
  LogOut,
  Microwave,
  Moon,
  Plus,
  ShieldAlert,
  Sparkles,
  Sun,
  User,
  UserRoundMinus,
  UtensilsCrossed,
  Wheat,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KitchenTool,
  UserProfile,
} from "../../../core/domain/profile.types";
import { COLORS } from "../../../shared/theme/colors";
import { useTheme } from "../../../shared/theme/ThemeProvider";
import { useNetwork } from "../../../shared/network/NetworkProvider";
import {
  BackendAllergen,
  profileService,
} from "../../external/api/ProfileService";
import * as Clipboard from "expo-clipboard";
import { apiClient } from "../../external/api/apiClient";
import { AppBottomSheet } from "../components/AppBottomSheet";
import { AppDialog, type AppDialogAction } from "../components/AppDialog";
import AppBanner from "../components/AppBanner";
import AppActionBar from "../components/AppActionBar";
import AppField from "../components/AppField";
import { useAuth } from "../hooks/useAuth";

// ─── Constantes de diseño ─────────────────────────────────────────────────────
const DARK_GREEN = "#0D1F17";
const MID_GREEN = "#1A3826";
const ICE = "#C8F0DC";

// ─── Config de utensilios ─────────────────────────────────────────────────────
const TOOL_CONFIG: Record<
  KitchenTool,
  { icon: LucideIcon; label: string; tint: string }
> = {
  [KitchenTool.HORNO]: { icon: CookingPot, label: "Horno", tint: COLORS.primary },
  [KitchenTool.MICROONDAS]: {
    icon: Microwave,
    label: "Microondas",
    tint: "#5BBCFF",
  },
  [KitchenTool.AIR_FRYER]: {
    icon: Sparkles,
    label: "Air Fryer",
    tint: COLORS.accent,
  },
  [KitchenTool.VITROCERAMICA]: {
    icon: Zap,
    label: "Vitrocerámica",
    tint: COLORS.accent,
  },
  [KitchenTool.ROBOT_COCINA]: {
    icon: Sparkles,
    label: "Robot de cocina",
    tint: "#7E9EFF",
  },
  [KitchenTool.BATIDORA]: { icon: Sparkles, label: "Batidora", tint: "#6CC5B7" },
  [KitchenTool.SARTEN]: { icon: UtensilsCrossed, label: "Olla express", tint: COLORS.primary },
};

const ALLERGEN_ICONS: Record<string, LucideIcon> = {
  GLUTEN: Wheat,
  LACTOSA: ShieldAlert,
  FRUTOS_SECOS: ShieldAlert,
  HUEVO: ShieldAlert,
  MARISCO: ShieldAlert,
  PESCADO: ShieldAlert,
  SOJA: ShieldAlert,
  CACAHUETE: ShieldAlert,
  APIO: ShieldAlert,
  MOSTAZA: ShieldAlert,
  SESAMO: ShieldAlert,
  ALTRAMUZ: ShieldAlert,
  MOLUSCOS: ShieldAlert,
  SULFITOS: ShieldAlert,
};

function getAllergenIcon(name: string): LucideIcon {
  return ALLERGEN_ICONS[name?.toUpperCase()] || ShieldAlert;
}

function StatCard({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <View style={styles.quickStatCard}>
      <View style={styles.quickStatIconWrap}>
        <Icon size={14} color={COLORS.primary} strokeWidth={2.5} />
      </View>
      <Text style={styles.quickStatNum}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Mini avatar ─────────────────────────────────────────────────────────────
function Avatar({ name: _name, size = 42 }: { name: string; size?: number }) {
  const iconSize = Math.max(14, size * 0.45);
  return (
    <View
      style={[
        avatarStyles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.primary,
        },
      ]}
    >
      <User size={iconSize} color={COLORS.white} strokeWidth={2.5} />
    </View>
  );
}
const avatarStyles = StyleSheet.create({
  wrap: { justifyContent: "center", alignItems: "center" },
});

// ─── Pill animada para utensilio ─────────────────────────────────────────────
function ToolPill({
  tool,
  active,
  onPress,
  isEditing,
  isDarkMode,
}: {
  tool: KitchenTool;
  active: boolean;
  onPress?: () => void;
  isEditing: boolean;
  isDarkMode: boolean;
}) {
  const cfg = TOOL_CONFIG[tool];
  const Icon = cfg.icon;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!onPress) return;
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 80,
        bounciness: 0,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 8,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={!isEditing}
        style={[
          styles.toolPill,
          active
            ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
            : {
                backgroundColor: isDarkMode ? "#1A2E1F" : COLORS.white,
                borderColor: isDarkMode
                  ? COLORS.secondary + "70"
                  : COLORS.text + "18",
              },
          !isEditing && styles.toolPillDisabled,
        ]}
        activeOpacity={0.85}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: active, disabled: !isEditing }}
        accessibilityLabel={cfg.label}
        accessibilityHint={
          isEditing
            ? active
              ? "Doble toque para quitar"
              : "Doble toque para activar"
            : "Activa modo edicion para cambiar este valor"
        }
      >
        <View style={[styles.toolIconWrap, { backgroundColor: cfg.tint + "22" }]}>
          <Icon size={14} color={active ? COLORS.white : cfg.tint} strokeWidth={2.4} />
        </View>
        <Text
          style={[
            styles.toolLabel,
            { color: active ? COLORS.white : isDarkMode ? COLORS.white : COLORS.text },
          ]}
        >
          {cfg.label}
        </Text>
        {active && isEditing && (
          <Check size={13} color={COLORS.white} strokeWidth={3} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function AllergenPillBackend({
  allergen,
  active,
  onPress,
  isEditing,
  isDarkMode,
}: {
  allergen: BackendAllergen;
  active: boolean;
  onPress?: () => void;
  isEditing: boolean;
  isDarkMode: boolean;
}) {
  const Icon = getAllergenIcon(allergen.name);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!onPress) return;
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 80,
        bounciness: 0,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 8,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={!isEditing}
        style={[
          styles.toolPill,
          active
            ? { backgroundColor: COLORS.error, borderColor: COLORS.error }
            : {
                backgroundColor: isDarkMode ? "#1A2E1F" : COLORS.white,
                borderColor: isDarkMode
                  ? COLORS.secondary + "70"
                  : COLORS.text + "18",
              },
          !isEditing && styles.toolPillDisabled,
        ]}
        activeOpacity={0.85}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: active, disabled: !isEditing }}
        accessibilityLabel={allergen.name}
        accessibilityHint={
          isEditing
            ? active
              ? "Doble toque para quitar"
              : "Doble toque para activar"
            : "Activa modo edicion para cambiar este valor"
        }
      >
        <View
          style={[
            styles.toolIconWrap,
            { backgroundColor: active ? COLORS.white + "30" : COLORS.error + "18" },
          ]}
        >
          <Icon
            size={14}
            color={active ? COLORS.white : COLORS.error}
            strokeWidth={2.4}
          />
        </View>
        <Text
          style={[
            styles.toolLabel,
            { color: active ? COLORS.white : isDarkMode ? COLORS.white : COLORS.text },
          ]}
        >
          {allergen.name}
        </Text>
        {active && isEditing && <X size={13} color={COLORS.white} strokeWidth={2.8} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { isOnline } = useNetwork();
  const { mode, toggleMode } = useTheme();
  const isDarkMode = mode === "dark";

  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    householdId: "",
    name: "",
    email: "",
    kitchenTools: [],
    householdMembers: [],
    allergens: [],
    customAllergens: [],
  });
  const [allAllergens, setAllAllergens] = useState<BackendAllergen[]>([]);
  const [userAllergenNames, setUserAllergenNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingTools, setIsEditingTools] = useState(false);
  const [isEditingAllergens, setIsEditingAllergens] = useState(false);
  const [draftKitchenTools, setDraftKitchenTools] = useState<KitchenTool[]>([]);
  const [draftAllergenNames, setDraftAllergenNames] = useState<string[]>([]);
  const [savingSection, setSavingSection] = useState<"tools" | "allergens" | null>(
    null,
  );
  const [showAddAllergen, setShowAddAllergen] = useState(false);
  const [newAllergenName, setNewAllergenName] = useState("");
  const [houseActionLoading, setHouseActionLoading] = useState<
    "invite" | "change" | null
  >(null);
  const [showHouseActionModal, setShowHouseActionModal] = useState(false);
  const [houseActionValue, setHouseActionValue] = useState("");
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    variant?: "info" | "success" | "warning" | "danger";
    actions: AppDialogAction[];
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<"home" | "tools" | "allergens">("home");

  const closeDialog = () => setDialog(null);
  const showDialog = (config: {
    title: string;
    message: string;
    variant?: "info" | "success" | "warning" | "danger";
    actions?: AppDialogAction[];
  }) => {
    setDialog({
      title: config.title,
      message: config.message,
      variant: config.variant,
      actions: config.actions ?? [{ label: "Cerrar", onPress: closeDialog }],
    });
  };

  // ── Load profile & allergens on mount ──
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [profileData, allergens] = await Promise.all([
        profileService.get(),
        profileService.getAllAllergens(),
      ]);
      setProfile(profileData);
      setAllAllergens(allergens);

      // Build list of user's active allergen names (enum + custom)
      const names = [
        ...profileData.allergens.map((a) => a.toString()),
        ...profileData.customAllergens,
      ];
      const normalizedNames = names.map((n) => n.toUpperCase());
      setUserAllergenNames(normalizedNames);
      setDraftKitchenTools(profileData.kitchenTools);
      setDraftAllergenNames(normalizedNames);
    } catch (e) {
      console.error("Error loading profile data:", e);
      const message =
        (e as any)?.response?.data?.message ||
        (e as any)?.message ||
        "No se pudo cargar el perfil.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      const profileData = await profileService.get();
      setProfile(profileData);
      const names = [
        ...profileData.allergens.map((a) => a.toString()),
        ...profileData.customAllergens.map((n) => n.toUpperCase()),
      ];
      setUserAllergenNames(names);

      if (!isEditingTools) {
        setDraftKitchenTools(profileData.kitchenTools);
      }

      if (!isEditingAllergens) {
        setDraftAllergenNames(names);
      }
      setLoadError(null);
    } catch (e) {
      console.error("Error refreshing profile:", e);
      const message =
        (e as any)?.response?.data?.message ||
        (e as any)?.message ||
        "No se pudo actualizar el perfil.";
      setLoadError(message);
    }
  };

  const toggleToolDraft = (tool: KitchenTool) => {
    setDraftKitchenTools((prev) =>
      prev.includes(tool)
        ? prev.filter((currentTool) => currentTool !== tool)
        : [...prev, tool],
    );
  };

  const toggleAllergenDraft = (allergen: BackendAllergen) => {
    const nameKey = allergen.name.toUpperCase();
    setDraftAllergenNames((prev) =>
      prev.includes(nameKey)
        ? prev.filter((name) => name !== nameKey)
        : [...prev, nameKey],
    );
  };

  const handleToggleToolsEditMode = async () => {
    if (!isOnline) {
      setLoadError("Sin internet no se pueden guardar cambios de utensilios.");
      return;
    }
    if (!isEditingTools) {
      setDraftKitchenTools(profile.kitchenTools);
      setIsEditingTools(true);
      return;
    }

    const previousTools = profile.kitchenTools;
    setSavingSection("tools");
    setProfile((prev) => ({ ...prev, kitchenTools: draftKitchenTools }));
    setIsEditingTools(false);
    try {
      await profileService.updateAppliancesBatch(draftKitchenTools);
      showDialog({
        title: "Utensilios actualizados",
        message: "Tus cambios de utensilios se han guardado.",
        variant: "success",
      });
    } catch (error) {
      setProfile((prev) => ({ ...prev, kitchenTools: previousTools }));
      setIsEditingTools(true);
      console.error("Error saving appliances:", error);
      showDialog({
        title: "Error",
        message: "No se pudieron guardar los utensilios.",
        variant: "danger",
      });
    } finally {
      refresh().catch((refreshError) => {
        console.error("Error refreshing profile after saving appliances:", refreshError);
      });
      setSavingSection(null);
    }
  };

  const handleCancelToolsEdit = () => {
    setDraftKitchenTools(profile.kitchenTools);
    setIsEditingTools(false);
  };

  const handleToggleAllergensEditMode = async () => {
    if (!isOnline) {
      setLoadError("Sin internet no se pueden guardar cambios de alergias.");
      return;
    }
    if (!isEditingAllergens) {
      setDraftAllergenNames(userAllergenNames);
      setIsEditingAllergens(true);
      return;
    }

    const selectedAllergenIds = allAllergens
      .filter((allergen) =>
        draftAllergenNames.includes(allergen.name?.toUpperCase()),
      )
      .map((allergen) => allergen.id);

    const previousAllergenNames = userAllergenNames;
    setSavingSection("allergens");
    setUserAllergenNames(draftAllergenNames);
    setIsEditingAllergens(false);
    try {
      await profileService.updateAllergensBatch(selectedAllergenIds);
      showDialog({
        title: "Alergenos actualizados",
        message: "Tus cambios de alergias se han guardado.",
        variant: "success",
      });
    } catch (error) {
      setUserAllergenNames(previousAllergenNames);
      setIsEditingAllergens(true);
      console.error("Error saving allergens:", error);
      showDialog({
        title: "Error",
        message: "No se pudieron guardar los alergenos.",
        variant: "danger",
      });
    } finally {
      refresh().catch((refreshError) => {
        console.error("Error refreshing profile after saving allergens:", refreshError);
      });
      setSavingSection(null);
    }
  };

  const handleCancelAllergensEdit = () => {
    setDraftAllergenNames(userAllergenNames);
    setIsEditingAllergens(false);
  };

  // ── Add custom allergen ──
  const handleAddCustomAllergen = async () => {
    if (!isOnline) {
      setLoadError("Sin internet no se pueden anadir alergenos.");
      return;
    }
    if (!newAllergenName.trim()) return;
    setShowAddAllergen(false);
    const name = newAllergenName.trim();
    setNewAllergenName("");

    await profileService.addCustomAllergen(name);

    // Refresh allergen list (new one might have been created)
    const allergens = await profileService.getAllAllergens();
    setAllAllergens(allergens);
    refresh();
  };

  // ── Remove member ──
  const handleRemoveMember = (id: string, name: string) => {
    if (!isOnline) {
      setLoadError("Sin internet no se pueden gestionar miembros del hogar.");
      return;
    }
    showDialog({
      title: "Eliminar miembro",
      message: `¿Eliminar a "${name}" del hogar?`,
      variant: "warning",
      actions: [
        { label: "Cancelar", tone: "secondary", onPress: closeDialog },
        {
          label: "Eliminar",
          tone: "danger",
          onPress: async () => {
            closeDialog();
            const previousMembers = profile.householdMembers;
            setProfile((prev) => ({
              ...prev,
              householdMembers: prev.householdMembers.filter((member) => member.id !== id),
            }));
            try {
              await profileService.removeMember(id);
            } catch (error: any) {
              setProfile((prev) => ({ ...prev, householdMembers: previousMembers }));
              const status = error?.response?.status;
              if (status === 403) {
                showDialog({
                  title: "Permisos insuficientes",
                  message: "Solo el administrador del hogar puede expulsar miembros.",
                  variant: "warning",
                });
                return;
              }

              showDialog({
                title: "Error",
                message: "No se pudo expulsar al miembro del hogar.",
                variant: "danger",
              });
            } finally {
              refresh().catch(() => {});
            }
          },
        },
      ],
    });
  };

  const extractInviteToken = (payload: any): string | null => {
    if (!payload) return null;
    if (typeof payload === "string") return payload;

    const candidates = [
      payload.token,
      payload.inviteToken,
      payload.invitationToken,
      payload.code,
      payload.inviteCode,
      payload.invitationCode,
      payload.data?.token,
      payload.data?.inviteToken,
      payload.data?.invitationToken,
      payload.data?.code,
      payload.data?.inviteCode,
      payload.data?.invitationCode,
    ];

    const found = candidates.find(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
    return found ? found.trim() : null;
  };

  const handleGenerateInviteToken = async () => {
    if (!isOnline) {
      setLoadError("Sin internet no se puede generar invitaciones.");
      return;
    }
    if (!profile.householdId) {
      showDialog({
        title: "Error",
        message: "No se encontró el ID de tu hogar.",
        variant: "danger",
      });
      return;
    }

    setHouseActionLoading("invite");
    try {
      const response = await apiClient.post(
        "/households/me/invite",
        {}
      );
      const token = extractInviteToken(response.data);

      if (token) {
        showDialog({
          title: "Token generado",
          message: `Comparte este token para que la otra persona lo use en \"Cambiar de casa\":\n\n${token}`,
          variant: "success",
          actions: [
            { label: "Cerrar", tone: "secondary", onPress: closeDialog },
            {
              label: "Copiar token",
              onPress: async () => {
                closeDialog();
                await Clipboard.setStringAsync(token);
                showDialog({
                  title: "Copiado",
                  message: "Token copiado al portapapeles.",
                  variant: "success",
                });
              },
            },
          ],
        });
      } else {
        showDialog({
          title: "Invitacion creada",
          message:
            "Se genero la invitacion, pero no se encontro el token en la respuesta.",
          variant: "warning",
        });
      }
      refresh();
    } catch (error: any) {
      const status = error?.response?.status;
      console.error("Error generando token de invitacion:", error);

      if (status === 403) {
        showDialog({
          title: "Permisos insuficientes",
          message: "No eres administrador del hogar. Solo un admin puede generar invitaciones.",
          variant: "warning",
        });
        return;
      }

      showDialog({
        title: "Error",
        message: "No se pudo generar el token de invitacion.",
        variant: "danger",
      });
    } finally {
      setHouseActionLoading(null);
    }
  };

  const handleChangeHouse = async () => {
    if (!isOnline) {
      setLoadError("Sin internet no se puede cambiar de hogar.");
      return;
    }
    const token = houseActionValue.trim();
    if (!token) return;

    setHouseActionLoading("change");
    try {
      await apiClient.post(`/households/me/join?token=${encodeURIComponent(token)}`);
      showDialog({
        title: "Hecho",
        message: "Te has unido al hogar correctamente.",
        variant: "success",
      });
      setShowHouseActionModal(false);
      setHouseActionValue("");
      refresh();
    } catch (error) {
      console.error("Error cambiando de casa:", error);
      showDialog({
        title: "Error",
        message: "No se pudo cambiar de casa con ese token.",
        variant: "danger",
      });
    } finally {
      setHouseActionLoading(null);
    }
  };

  const openChangeHouseModal = () => {
    setHouseActionValue("");
    setShowHouseActionModal(true);
  };

  const toolList = Object.values(KitchenTool);
  const visibleTools = isEditingTools ? draftKitchenTools : profile.kitchenTools;
  const visibleAllergenNames = isEditingAllergens
    ? draftAllergenNames
    : userAllergenNames;
  const activeToolCount = visibleTools.length;
  const activeAllergenCount = visibleAllergenNames.length;

  // ── Loading state ──
  if (loading) {
    return (
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={{
            marginTop: 16,
            fontSize: 15,
            color: COLORS.text,
            opacity: 0.5,
            fontWeight: "600",
          }}
        >
          Cargando perfil…
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isDarkMode ? "#0C100D" : COLORS.background },
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#0C100D" : DARK_GREEN}
        translucent={false}
      />
      <ScrollView
        contentContainerStyle={[
          styles.pageScroll,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(110, insets.bottom + 90),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
      >
        {loadError ? (
          <AppBanner
            variant="error"
            title="No se pudo actualizar perfil"
            message={loadError}
            isDark={isDarkMode}
            onClose={() => setLoadError(null)}
          />
        ) : null}

        <View style={styles.topBand}>
          <View style={styles.topBandGlow} />
          <View style={styles.topBandGlowSecondary} />
          <View style={styles.topBandAccentSlash} />
          <View style={styles.topBandHeader}>
            <View>
              <View style={styles.topBandBadge}>
                <Sparkles size={11} color={COLORS.accent} strokeWidth={2.6} />
                <Text style={styles.topBandBadgeText}>Zona personal</Text>
              </View>
              <Text style={styles.topBandTitle}>Perfil</Text>
              <Text style={styles.topBandSub}>Gestiona tu hogar y preferencias</Text>
            </View>
            <TouchableOpacity
              onPress={signOut}
              style={styles.topBandLogoutBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesion"
              accessibilityHint="Sale de la cuenta actual"
            >
              <LogOut size={16} color={COLORS.error} strokeWidth={2.6} />
              <Text style={styles.topBandLogoutText}>Salir</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editHintCardTopBand}>
            <Text style={styles.editHintCardTopBandText}>
              Edita utensilios y alergias por separado desde cada seccion.
            </Text>
          </View>
        </View>

        <View style={[styles.identityPanel, isDarkMode && styles.identityPanelDark]}>
          <View style={[styles.identityPanelGlow, isDarkMode && styles.identityPanelGlowDark]} />
          <View style={styles.profileInfo}>
            <View style={styles.avatarRing}>
              <Avatar name={profile.name || "?"} size={72} />
            </View>
            <View style={styles.identityTextBlock}>
              <Text style={[styles.profileNameDark, isDarkMode && styles.profileNameDarkMode]}>{profile.name}</Text>
              <Text style={[styles.profileEmailDark, isDarkMode && styles.profileEmailDarkMode]}>{profile.email}</Text>
              <View style={styles.identityMetaRow}>
                <View style={[styles.metaPill, isDarkMode && styles.metaPillDark]}>
                  <Sparkles size={11} color={COLORS.primary} strokeWidth={2.6} />
                  <Text style={[styles.metaPillText, isDarkMode && styles.metaPillTextDark]}>Cuenta activa</Text>
                </View>
                <View style={[styles.metaPill, isDarkMode && styles.metaPillDark]}>
                  <ShieldAlert size={11} color={COLORS.error} strokeWidth={2.8} />
                  <Text style={[styles.metaPillText, isDarkMode && styles.metaPillTextDark]}>Privacidad</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              value={profile.householdMembers.length}
              label="En el hogar"
              icon={House}
            />
            <StatCard value={activeToolCount} label="Utensilios" icon={UtensilsCrossed} />
            <StatCard value={activeAllergenCount} label="Alergenos" icon={ShieldAlert} />
          </View>
        </View>

        <View style={styles.quickActionGrid}>
          <TouchableOpacity
            onPress={handleGenerateInviteToken}
            disabled={houseActionLoading !== null || !isOnline}
            style={[
              styles.quickActionBtn,
              houseActionLoading !== null && styles.houseActionBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Invitar a alguien al hogar"
            accessibilityHint="Genera un token para compartir"
          >
            {houseActionLoading === "invite" ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Plus size={16} color={COLORS.white} strokeWidth={2.7} />
                <Text style={styles.quickActionText}>Invitar miembro</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openChangeHouseModal}
            disabled={houseActionLoading !== null || !isOnline}
            style={[styles.quickActionBtn, styles.quickActionBtnSecondary]}
            accessibilityRole="button"
            accessibilityLabel="Cambiar de casa"
            accessibilityHint="Abre un formulario para poner un token"
          >
            <House size={16} color={COLORS.primary} strokeWidth={2.7} />
            <Text style={styles.quickActionTextSecondary}>Cambiar de casa</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={toggleMode}
          style={[
            styles.themeToggleBtn,
            isDarkMode && styles.themeToggleBtnDark,
          ]}
          accessibilityRole="switch"
          accessibilityState={{ checked: isDarkMode }}
          accessibilityLabel="Cambiar modo oscuro"
          accessibilityHint="Activa o desactiva la paleta oscura de la app"
        >
          {isDarkMode ? (
            <Moon size={16} color={COLORS.white} strokeWidth={2.8} />
          ) : (
            <Sun size={16} color={COLORS.forest} strokeWidth={2.8} />
          )}
          <Text style={[styles.themeToggleText, isDarkMode && styles.themeToggleTextDark]}>
            {isDarkMode ? "Modo oscuro activado" : "Cambiar a modo oscuro"}
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.editHintCard,
            (isEditingTools || isEditingAllergens) && styles.editHintCardActive,
          ]}
        >
          <Text
            style={[
              styles.editHintText,
              (isEditingTools || isEditingAllergens) && styles.editHintTextActive,
            ]}
          >
            {isEditingTools || isEditingAllergens
              ? "Toca las opciones para preparar el JSON y pulsa Guardar en esa seccion."
              : "Pulsa Editar en cada seccion para preparar cambios antes de enviarlos."}
          </Text>
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedSection(expandedSection === "home" ? "tools" : "home")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Alternar seccion Mi hogar"
          >
            <View style={[styles.sectionTitleWrap, isDarkMode && styles.sectionTitleWrapDark]}>
              <House size={17} color={COLORS.primary} strokeWidth={2.4} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Mi hogar</Text>
            </View>
            {expandedSection === "home" ? (
              <ChevronUp size={18} color={isDarkMode ? COLORS.white : COLORS.text} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={18} color={isDarkMode ? COLORS.white : COLORS.text} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
          {expandedSection === "home" ? (
            <>
          <Text style={[styles.sectionSub, isDarkMode && styles.sectionSubDark]}>
            {profile.householdMembers.length === 0
              ? "No hay miembros en el hogar"
              : profile.householdMembers.length === 1
                ? "1 persona en el hogar"
                : `${profile.householdMembers.length} personas en el hogar`}
          </Text>

          {profile.householdMembers.length === 0 ? (
            <View style={styles.emptyMembers}>
              <View style={styles.emptyMembersIconWrap}>
                <House size={24} color={COLORS.primary} strokeWidth={2.4} />
              </View>
              <Text style={[styles.emptyMembersText, isDarkMode && styles.emptyMembersTextDark]}>
                Aún no hay nadie en el hogar
              </Text>
            </View>
          ) : (
            <View style={[styles.memberList, isDarkMode && styles.memberListDark]}>
              {profile.householdMembers.map((member, idx) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberRow,
                    isDarkMode && styles.memberRowDark,
                    idx === 0 ? ({ borderTopWidth: 0 } as any) : {},
                  ]}
                >
                  <Avatar name={member.name} size={42} />
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, isDarkMode && styles.memberNameDark]}>{member.name}</Text>
                    <Text style={[styles.memberRole, isDarkMode && styles.memberRoleDark]}>
                      {idx === 0 ? "Administrador" : "Miembro"}
                    </Text>
                  </View>
                  {idx !== 0 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(member.id, member.name)}
                      style={styles.memberDeleteBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar a ${member.name} del hogar`}
                      accessibilityHint="Quita este miembro del hogar"
                    >
                      <UserRoundMinus
                        size={14}
                        color={COLORS.error}
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  )}
                  {idx === 0 && (
                    <View style={styles.memberOwnerBadge}>
                      <Text style={styles.memberOwnerBadgeText}>Tú</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
            </>
          ) : null}
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedSection(expandedSection === "tools" ? "allergens" : "tools")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Alternar seccion Utensilios"
          >
            <View style={[styles.sectionTitleWrap, isDarkMode && styles.sectionTitleWrapDark]}>
              <UtensilsCrossed size={17} color={COLORS.primary} strokeWidth={2.4} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Utensilios de cocina</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {activeToolCount} / {toolList.length}
              </Text>
            </View>
            {expandedSection === "tools" ? (
              <ChevronUp size={18} color={isDarkMode ? COLORS.white : COLORS.text} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={18} color={isDarkMode ? COLORS.white : COLORS.text} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
          {expandedSection === "tools" ? (
            <>
          <Text style={[styles.sectionSub, isDarkMode && styles.sectionSubDark]}>
            Selecciona los que tienes disponibles. Se usarán para personalizar
            tus recetas.
          </Text>

          <AppActionBar
            primaryLabel={isEditingTools ? "Guardar utensilios" : "Editar utensilios"}
            onPrimary={handleToggleToolsEditMode}
            loading={savingSection === "tools"}
            disabled={savingSection !== null || !isOnline}
            secondaryLabel={isEditingTools ? "Cancelar" : undefined}
            onSecondary={isEditingTools ? handleCancelToolsEdit : undefined}
            isDark={isDarkMode}
          />

          <View style={styles.toolGrid}>
            {toolList.map((tool) => (
              <ToolPill
                key={tool}
                tool={tool}
                active={visibleTools.includes(tool)}
                onPress={isEditingTools ? () => toggleToolDraft(tool) : undefined}
                isEditing={isEditingTools}
                isDarkMode={isDarkMode}
              />
            ))}
          </View>
            </>
          ) : null}
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedSection(expandedSection === "allergens" ? "home" : "allergens")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Alternar seccion Alergias"
          >
            <View style={[styles.sectionTitleWrap, isDarkMode && styles.sectionTitleWrapDark]}>
              <ShieldAlert size={17} color={COLORS.error} strokeWidth={2.4} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Alergias e intolerancias</Text>
            </View>
            <View
              style={[
                styles.sectionBadge,
                {
                  backgroundColor: COLORS.error + "20",
                  borderColor: COLORS.error + "55",
                },
              ]}
            >
              <Text style={[styles.sectionBadgeText, { color: COLORS.error }]}> 
                {activeAllergenCount}
              </Text>
            </View>
            {expandedSection === "allergens" ? (
              <ChevronUp size={18} color={isDarkMode ? COLORS.white : COLORS.text} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={18} color={isDarkMode ? COLORS.white : COLORS.text} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
          {expandedSection === "allergens" ? (
            <>
          <Text style={[styles.sectionSub, isDarkMode && styles.sectionSubDark]}>
            Marca los ingredientes que debes evitar.
          </Text>

          <AppActionBar
            primaryLabel={isEditingAllergens ? "Guardar alergenos" : "Editar alergenos"}
            onPrimary={handleToggleAllergensEditMode}
            loading={savingSection === "allergens"}
            disabled={savingSection !== null || !isOnline}
            secondaryLabel={isEditingAllergens ? "Cancelar" : undefined}
            onSecondary={isEditingAllergens ? handleCancelAllergensEdit : undefined}
            primaryTone="danger"
            isDark={isDarkMode}
          />

          <View style={styles.toolGrid}>
            {allAllergens.map((allergen) => (
              <AllergenPillBackend
                key={allergen.id}
                allergen={allergen}
                active={visibleAllergenNames.includes(
                  allergen.name?.toUpperCase(),
                )}
                onPress={
                  isEditingAllergens
                    ? () => toggleAllergenDraft(allergen)
                    : undefined
                }
                isEditing={isEditingAllergens}
                isDarkMode={isDarkMode}
              />
            ))}

            {isEditingAllergens && (
              <TouchableOpacity
                style={[
                  styles.toolPill,
                  {
                    backgroundColor: isDarkMode ? "#1A2E1F" : COLORS.white,
                    borderColor: isDarkMode
                      ? COLORS.secondary + "70"
                      : COLORS.text + "25",
                    borderStyle: "dashed",
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setShowAddAllergen(true)}
                accessibilityRole="button"
                accessibilityLabel="Anadir otro alergeno"
              >
                <View style={styles.toolIconWrap}>
                  <Plus size={14} color={isDarkMode ? COLORS.white : COLORS.text} strokeWidth={2.8} />
                </View>
                <Text style={[styles.toolLabel, { color: isDarkMode ? COLORS.white : COLORS.text }]}> 
                  Otro...
                </Text>
              </TouchableOpacity>
            )}
          </View>
            </>
          ) : null}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ══ MODAL AÑADIR ALÉRGENO ══ */}
      <AppBottomSheet
        visible={showAddAllergen}
        onClose={() => setShowAddAllergen(false)}
        title="Añadir alérgeno"
        icon={ShieldAlert}
        iconColor={COLORS.error}
      >
        <AppField
          label="Nombre del ingrediente"
          value={newAllergenName}
          onChangeText={setNewAllergenName}
          placeholder="Ej. Cacahuete"
          isDark={isDarkMode}
          accessibilityLabel="Nombre del ingrediente"
          onSubmitEditing={handleAddCustomAllergen}
          returnKeyType="done"
        />

        <View style={styles.sheetFooter}>
          <TouchableOpacity
            onPress={() => setShowAddAllergen(false)}
            style={[styles.sheetBtnCancel, isDarkMode && { backgroundColor: '#11351A', borderColor: COLORS.secondary + '66' }]}
          >
            <Text style={[styles.sheetBtnCancelText, isDarkMode && { color: COLORS.white }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddCustomAllergen}
            style={[
              styles.sheetBtnSave,
              { backgroundColor: COLORS.error },
              !newAllergenName.trim() && { opacity: 0.4 },
            ]}
            disabled={!newAllergenName.trim()}
          >
            <Text style={styles.sheetBtnSaveText}>Añadir</Text>
          </TouchableOpacity>
        </View>
      </AppBottomSheet>

      <AppBottomSheet
        visible={showHouseActionModal}
        onClose={() => setShowHouseActionModal(false)}
        title="Cambiar de casa"
        icon={House}
      >
        <AppField
          label="Token de invitacion"
          value={houseActionValue}
          onChangeText={setHouseActionValue}
          placeholder="Ej. ABCD-1234"
          isDark={isDarkMode}
          accessibilityLabel="Token de invitacion"
          onSubmitEditing={handleChangeHouse}
          returnKeyType="done"
        />

        <View style={styles.sheetFooter}>
          <TouchableOpacity
            onPress={() => setShowHouseActionModal(false)}
            style={[styles.sheetBtnCancel, isDarkMode && { backgroundColor: '#11351A', borderColor: COLORS.secondary + '66' }]}
            disabled={houseActionLoading !== null}
          >
            <Text style={[styles.sheetBtnCancelText, isDarkMode && { color: COLORS.white }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleChangeHouse}
            style={[
              styles.sheetBtnSave,
              !houseActionValue.trim() && { opacity: 0.4 },
            ]}
            disabled={!houseActionValue.trim() || houseActionLoading !== null}
          >
            {houseActionLoading === "change" ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.sheetBtnSaveText}>Enviar</Text>
            )}
          </TouchableOpacity>
        </View>
      </AppBottomSheet>

      <AppDialog
        visible={!!dialog}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        variant={dialog?.variant}
        actions={dialog?.actions ?? [{ label: "Cerrar", onPress: closeDialog }]}
        onClose={closeDialog}
      />
    </View>
  );
}

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
  android: { elevation: 8 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  pageScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },

  topBand: {
    backgroundColor: DARK_GREEN,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + "28",
    padding: 16,
    overflow: "hidden",
    ...SHADOW_MD,
  },
  topBandGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary + "2D",
    top: -70,
    right: -40,
  },
  topBandGlowSecondary: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.secondary + "16",
    bottom: -130,
    left: -95,
  },
  topBandAccentSlash: {
    position: "absolute",
    width: 120,
    height: 12,
    borderRadius: 999,
    backgroundColor: COLORS.accent + "70",
    right: -24,
    top: 26,
    transform: [{ rotate: "-24deg" }],
  },
  topBandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  topBandBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.white + "14",
    borderColor: COLORS.accent + "60",
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  topBandBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  topBandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.4,
  },
  topBandSub: {
    marginTop: 2,
    fontSize: 12,
    color: ICE,
    opacity: 0.8,
    fontWeight: "600",
  },
  topBandLogoutBtn: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error + "44",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  topBandLogoutText: {
    color: COLORS.error,
    fontWeight: "800",
    fontSize: 12,
  },
  topBandEditBtn: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: MID_GREEN,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOW_PRIMARY,
  },
  topBandEditBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  topBandEditText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  editHintCardTopBand: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.white + "2E",
    backgroundColor: COLORS.white + "14",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  editHintCardTopBandText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
    textAlign: "center",
  },

  identityPanel: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.primary + "24",
    padding: 16,
    ...SHADOW_SM,
  },
  identityPanelDark: {
    backgroundColor: "#11351A",
    borderColor: COLORS.secondary + "66",
  },
  identityPanelGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.secondary + "1C",
    right: -90,
    top: -96,
  },
  identityPanelGlowDark: {
    backgroundColor: COLORS.primary + "24",
  },
  identityTextBlock: { flex: 1 },
  identityMetaRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "#F3FAF6",
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  metaPillDark: {
    backgroundColor: COLORS.white + "12",
    borderColor: COLORS.white + "2D",
  },
  metaPillText: {
    color: COLORS.text,
    opacity: 0.8,
    fontSize: 10,
    fontWeight: "700",
  },
  metaPillTextDark: {
    color: COLORS.white,
    opacity: 0.84,
  },
  statsGrid: {
    marginTop: 4,
    flexDirection: "row",
    gap: 10,
  },

  quickActionGrid: {
    flexDirection: "row",
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: DARK_GREEN,
    borderWidth: 1,
    borderColor: DARK_GREEN,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  quickActionBtnSecondary: {
    backgroundColor: COLORS.primary + "12",
    borderColor: COLORS.primary + "55",
  },
  quickActionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  quickActionTextSecondary: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  themeToggleBtn: {
    marginTop: 10,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.forest + "35",
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  themeToggleBtnDark: {
    backgroundColor: COLORS.forest,
    borderColor: COLORS.primary + "45",
  },
  themeToggleText: {
    color: COLORS.forest,
    fontSize: 13,
    fontWeight: "800",
  },
  themeToggleTextDark: {
    color: COLORS.white,
  },

  editHintCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.text + "14",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editHintCardActive: {
    borderColor: COLORS.primary + "40",
    backgroundColor: COLORS.primary + "12",
  },
  editHintText: {
    color: COLORS.text,
    opacity: 0.7,
    fontSize: 12,
    fontWeight: "600",
  },
  editHintTextActive: {
    color: MID_GREEN,
    opacity: 1,
  },

  // ── Profile Header
  profileHeader: {
    backgroundColor: DARK_GREEN,
    paddingHorizontal: 22,
    paddingBottom: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    ...SHADOW_MD,
  },
  headerGlowA: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.primary + "1F",
    top: -70,
    right: -45,
  },
  headerGlowB: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.accent + "16",
    bottom: -40,
    left: -30,
  },
  headerTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerEyebrowWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerEyebrow: {
    color: ICE,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.8,
    opacity: 0.7,
  },
  headerTopHint: {
    color: ICE,
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.75,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.white + "15",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.white + "30",
  },
  editText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: MID_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.error + "55",
  },
  logoutText: { color: COLORS.error, fontWeight: "700", fontSize: 13 },

  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 22,
  },
  avatarRing: {
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.6,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 6 },
    }),
  },
  profileText: { flex: 1 },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    ...SHADOW_MD,
  },
  profileNameDark: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  profileNameDarkMode: {
    color: COLORS.white,
  },
  profileEmailDark: { fontSize: 13, color: COLORS.text, opacity: 0.6, marginTop: 3 },
  profileEmailDarkMode: { color: COLORS.white, opacity: 0.76 },
  profileTagSolid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F3FAF6",
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
  },
  profileTagTextDark: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.text,
    opacity: 0.8,
    letterSpacing: 0.3,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  profileEmail: { fontSize: 13, color: ICE, opacity: 0.6, marginTop: 3 },
  profileTagRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  profileTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.white + "16",
    borderWidth: 1,
    borderColor: COLORS.white + "24",
  },
  profileTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: ICE,
    opacity: 0.9,
    letterSpacing: 0.3,
  },

  quickStats: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: MID_GREEN,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: COLORS.white + "08",
    borderWidth: 1,
    borderColor: COLORS.primary + "24",
  },
  quickStatIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "20",
    marginBottom: 6,
  },
  quickStatNum: { fontSize: 23, fontWeight: "900", color: COLORS.primary },
  quickStatLabel: {
    fontSize: 10,
    color: COLORS.text,
    opacity: 0.65,
    marginTop: 2,
    fontWeight: "600",
  },
  quickStatsLight: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F6FCF8",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary + "22",
  },

  controlPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "1E",
    ...SHADOW_SM,
  },
  controlPrimary: {
    width: "100%",
    minHeight: 54,
  },
  controlSecondary: {
    flex: 1,
    minWidth: 0,
    borderColor: COLORS.primary + "45",
  },

  actionStrip: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOW_PRIMARY,
  },
  actionBtnPrimaryActive: {
    backgroundColor: MID_GREEN,
    borderColor: MID_GREEN,
  },
  actionBtnPrimaryText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error + "45",
    minWidth: 140,
  },
  actionBtnSecondaryText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  actionBtnTertiary: {
    backgroundColor: COLORS.error + "12",
    borderWidth: 1,
    borderColor: COLORS.error + "45",
    minWidth: 94,
  },
  actionBtnTertiaryText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "800",
  },
  editStatusCard: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 2,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.text + "18",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editStatusCardActive: {
    backgroundColor: COLORS.primary + "12",
    borderColor: COLORS.primary + "45",
  },
  editStatusText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.75,
  },
  editStatusTextActive: {
    color: MID_GREEN,
    opacity: 1,
  },

  // ── Scroll
  scroll: { paddingHorizontal: 18, paddingTop: 18 },

  // ── Section
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
    padding: 18,
    marginBottom: 16,
    ...SHADOW_SM,
  },
  sectionDark: {
    backgroundColor: "#11351A",
    borderColor: COLORS.secondary + "66",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary + "10",
    borderWidth: 1,
    borderColor: COLORS.primary + "2A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sectionTitleWrapDark: {
    backgroundColor: COLORS.primary + "1F",
    borderColor: COLORS.primary + "55",
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  sectionTitleDark: { color: COLORS.white },
  sectionBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: COLORS.primary + "55",
  },
  sectionBadgeText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },
  sectionSub: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.45,
    marginBottom: 16,
    lineHeight: 17,
  },
  sectionSubDark: {
    color: COLORS.white,
    opacity: 0.72,
  },
  sectionActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  sectionActionBtn: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  sectionActionBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sectionActionBtnDanger: {
    flex: 1,
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  sectionActionBtnSecondary: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary + "45",
    minWidth: 110,
  },
  sectionActionBtnDisabled: {
    opacity: 0.6,
  },
  sectionActionBtnPrimaryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  sectionActionBtnSecondaryText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  houseActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  houseActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  houseActionBtnSecondary: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary + "55",
  },
  houseActionBtnDisabled: {
    opacity: 0.6,
  },
  houseActionBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  houseActionBtnTextSecondary: {
    color: COLORS.primary,
  },

  // ── Tool grid
  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  toolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  toolPillDisabled: { opacity: 0.7 },
  toolIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toolLabel: { fontSize: 13, fontWeight: "700" },

  // ── Member section
  memberList: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.text + "10",
  },
  memberListDark: {
    borderColor: COLORS.white + "24",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#F8FDF9",
    borderTopWidth: 1,
    borderTopColor: COLORS.text + "08",
  },
  memberRowDark: {
    backgroundColor: "#1A2E1F",
    borderTopColor: COLORS.white + "1A",
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  memberNameDark: { color: COLORS.white },
  memberRole: { fontSize: 11, color: COLORS.text, opacity: 0.45, marginTop: 1 },
  memberRoleDark: { color: COLORS.white, opacity: 0.68 },
  memberDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error + "15",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.error + "30",
  },
  memberOwnerBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
  },
  memberOwnerBadgeText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 11,
  },

  emptyMembers: { alignItems: "center", paddingVertical: 24 },
  emptyMembersIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "16",
    borderWidth: 1,
    borderColor: COLORS.primary + "35",
  },
  emptyMembersText: { fontSize: 14, color: COLORS.text, opacity: 0.45 },
  emptyMembersTextDark: { color: COLORS.white, opacity: 0.68 },

  // ── Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(13,31,23,0.55)",
  },
  sheetWrap: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 10,
    ...SHADOW_MD,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 5,
    backgroundColor: COLORS.text + "18",
    borderRadius: 3,
    marginBottom: 20,
  },
  sheetTitleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 22,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  sheetFooter: { flexDirection: "row", gap: 12, marginBottom: 8 },
  sheetBtnCancel: {
    flex: 1,
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#EEF8F2",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.text + "12",
  },
  sheetBtnCancelText: { color: COLORS.text, fontWeight: "600", fontSize: 15 },
  sheetBtnSave: {
    flex: 2,
    padding: 15,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    ...SHADOW_PRIMARY,
  },
  sheetBtnSaveText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
});
