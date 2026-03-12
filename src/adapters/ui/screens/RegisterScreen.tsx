import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ArrowRight, Check, ChefHat, House, Lock, Mail, ShieldAlert, Sparkles, User, UtensilsCrossed } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/theme/colors';
import { apiClient } from '../../external/api/apiClient';
import { CustomButton } from '../components/CustomButton';
import { CustomInput } from '../components/CustomInput';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigationProp } from '../navigation/types';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 4;

// ─── Palette extras ────────────────────────────────────────────────────────────
const DARK_GREEN = '#0D1F17';
const MID_GREEN  = '#1A3826';
const ICE_BLUE   = '#C8F0DC';
const CARD_BG    = '#FFFFFF';
const FIELD_BG   = '#EEF8F2';

// ─── Allergen items (mapped to backend) ────────────────────────────────────────
interface AllergenOption {
  id: string;
  name: string;
  emoji: string;
}

const ALLERGEN_EMOJIS: Record<string, string> = {
  GLUTEN: '🌾', LACTOSA: '🥛', FRUTOS_SECOS: '🥜', HUEVO: '🥚',
  MARISCO: '🦐', PESCADO: '🐟', SOJA: '🫘', CACAHUETE: '🥜',
  APIO: '🥬', MOSTAZA: '🟡', SESAMO: '🫘', ALTRAMUZ: '🌿',
  MOLUSCOS: '🐚', SULFITOS: '🍷',
};

// ─── Appliance items ───────────────────────────────────────────────────────────
interface ApplianceOption {
  key: string;
  label: string;
  emoji: string;
}

const APPLIANCES: ApplianceOption[] = [
  { key: 'HORNO',        label: 'Horno',           emoji: '🔥' },
  { key: 'MICROONDAS',   label: 'Microondas',      emoji: '📡' },
  { key: 'AIR_FRYER',    label: 'Air Fryer',       emoji: '🌀' },
  { key: 'VITROCERAMICA',label: 'Vitrocerámica',   emoji: '🍳' },
  { key: 'ROBOT_COCINA', label: 'Robot de cocina',  emoji: '🤖' },
  { key: 'BATIDORA',     label: 'Batidora',        emoji: '🥤' },
  { key: 'SARTEN',       label: 'Sartén',          emoji: '🍳' },
];

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={i} style={styles.stepItemWrap}>
            <View
              style={[
                styles.stepDot,
                done && styles.stepDotDone,
                active && styles.stepDotActive,
              ]}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`Paso ${i + 1} de ${total}${done ? ', completado' : active ? ', actual' : ''}`}
            >
              {done ? (
                <Check size={12} color={COLORS.white} strokeWidth={3} />
              ) : (
                <Text style={[styles.stepDotText, active && styles.stepDotTextActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            {i < total - 1 && (
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Toggle chip ───────────────────────────────────────────────────────────────
function ToggleChip({
  emoji, label, selected, onToggle, accessibilityHint,
}: {
  emoji: string; label: string; selected: boolean;
  onToggle: () => void; accessibilityHint?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[
        styles.chip,
        selected && styles.chipSelected,
      ]}
    >
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
      {selected && (
        <View style={styles.chipCheck}>
          <Check size={12} color={COLORS.white} strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp>();
  const { signUp, loading: authLoading, error: apiError } = useAuth();

  // ── Step 0 – account
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
  });

  // ── Step 1 – household
  const [householdName, setHouseholdName] = useState('');
  const [memberCount, setMemberCount] = useState(1);

  // ── Step 2 – allergens (fetched from backend)
  const [allergenOptions, setAllergenOptions] = useState<AllergenOption[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [allergensLoading, setAllergensLoading] = useState(false);

  // ── Step 3 – appliances
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]);

  // ── General
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  // ── Fetch allergens from backend when step 2 is reached
  useEffect(() => {
    if (step === 2 && allergenOptions.length === 0) {
      fetchAllergens();
    }
  }, [step]);

  const fetchAllergens = async () => {
    setAllergensLoading(true);
    try {
      const res = await apiClient.get('/allergens');
      const mapped: AllergenOption[] = res.data.map((a: any) => ({
        id: a.id,
        name: a.name,
        emoji: ALLERGEN_EMOJIS[a.name?.toUpperCase()] || '⚠️',
      }));
      setAllergenOptions(mapped);
    } catch (e) {
      console.error('Error fetching allergens:', e);
    } finally {
      setAllergensLoading(false);
    }
  };

  // ── Animations ──
  const animateTransition = (direction: 1 | -1, cb: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: direction * -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideAnim.setValue(direction * 30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  // ── Validation per step ──
  const validateStep = (): boolean => {
    setLocalError(null);
    switch (step) {
      case 0:
        if (!form.username || !form.email || !form.password || !form.confirmPassword) {
          setLocalError('Por favor, completa todos los campos');
          return false;
        }
        if (form.password !== form.confirmPassword) {
          setLocalError('Las contraseñas no coinciden');
          return false;
        }
        if (form.password.length < 6) {
          setLocalError('La contraseña debe tener al menos 6 caracteres');
          return false;
        }
        return true;
      case 1:
        if (!householdName.trim()) {
          setLocalError('Introduce el nombre de tu hogar');
          return false;
        }
        if (memberCount < 1) {
          setLocalError('Debe haber al menos 1 miembro');
          return false;
        }
        return true;
      case 2:
        return true; // allergens are optional
      case 3:
        return true; // appliances are optional
      default:
        return true;
    }
  };

  // ── Next step ──
  const handleNext = async () => {
    if (!validateStep()) return;

    if (step === 0) {
      // Register account on backend
      setSaving(true);
      try {
        await signUp({
          username: form.username,
          email: form.email,
          password: form.password,
          role: 'ROLE_OWNER',
        });
        animateTransition(1, () => setStep(1));
      } catch (e: any) {
        setLocalError(apiError || 'Error al crear la cuenta');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step < TOTAL_STEPS - 1) {
      animateTransition(1, () => setStep(s => s + 1));
    }
  };

  // ── Back ──
  const handleBack = () => {
    setLocalError(null);
    if (step === 0) {
      navigation.goBack();
    } else {
      animateTransition(-1, () => setStep(s => s - 1));
    }
  };

  // ── Finish – Create household, allergens, appliances ──
  const handleFinish = async () => {
    setSaving(true);
    setLocalError(null);
    try {
      // 1) Find userId by username from users list
      const usersRes = await apiClient.get('/users');
      const me = usersRes.data.find((u: any) =>
        u.name?.toLowerCase() === form.username.toLowerCase()
      );
      if (!me) {
        setLocalError('No se encontró tu usuario. Intenta de nuevo.');
        setSaving(false);
        return;
      }
      const userId = me.id;

      // 2) Create household with owner
      const hhRes = await apiClient.post(
        `/households/create-with-owner?userId=${userId}`,
        { name: householdName.trim() }
      );
      const householdId = hhRes.data.id;

      // 3) Add allergens to user
      for (const allergenId of selectedAllergens) {
        try {
          await apiClient.post(`/users/${userId}/allergens/${allergenId}`);
        } catch (e) {
          console.warn('Error adding allergen', allergenId, e);
        }
      }

      // 4) Add appliances to household
      for (const appliance of selectedAppliances) {
        try {
          await apiClient.post(`/households/${householdId}/appliances?appliance=${appliance}`);
        } catch (e) {
          console.warn('Error adding appliance', appliance, e);
        }
      }

      Alert.alert(
        '¡Bienvenido, Chef! 🎉',
        'Tu hogar y perfil han sido configurados correctamente.',
        [{ text: 'Ir al Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e: any) {
      console.error('Error finishing setup:', e);
      setLocalError(e?.response?.data?.message || 'Error al configurar tu hogar');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle helpers ──
  const toggleAllergen = (id: string) => {
    setSelectedAllergens(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };
  const toggleAppliance = (key: string) => {
    setSelectedAppliances(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    );
  };

  // ── Step titles ──
  const stepMeta = [
    { icon: <User size={20} color={COLORS.white} />,             title: 'Crear cuenta',        subtitle: 'Tu información personal' },
    { icon: <House size={20} color={COLORS.white} />,             title: 'Tu hogar',            subtitle: 'Configura tu unidad familiar' },
    { icon: <ShieldAlert size={20} color={COLORS.white} />,      title: 'Alérgenos',           subtitle: 'Selecciona tus intolerancias' },
    { icon: <UtensilsCrossed size={20} color={COLORS.white} />,  title: 'Electrodomésticos',   subtitle: '¿Qué tienes en tu cocina?' },
  ];

  const isLastStep = step === TOTAL_STEPS - 1;
  const currentLoading = authLoading || saving;

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Back button ── */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessible
              accessibilityRole="button"
              accessibilityLabel={step === 0 ? 'Volver al login' : 'Paso anterior'}
            >
              <ArrowLeft size={22} color={COLORS.text} />
            </TouchableOpacity>

            {/* ── Logo ── */}
            <View style={styles.logoContainer}>
              <View style={styles.iconCircle}>
                <ChefHat size={30} color={COLORS.white} />
                <View style={styles.sparkleTag}>
                  <Sparkles size={11} color={COLORS.white} />
                </View>
              </View>
            </View>

            {/* ── Step indicator ── */}
            <StepIndicator current={step} total={TOTAL_STEPS} />

            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.brandName}>{stepMeta[step].title}</Text>
              <View style={styles.accentBar} />
              <Text style={styles.subtitle}>{stepMeta[step].subtitle}</Text>
            </View>

            {/* ── Errors ── */}
            {(localError || apiError) && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorEmoji}>⚠️</Text>
                <Text style={styles.errorText}>{localError || apiError}</Text>
              </View>
            )}

            {/* ── Step content (animated) ── */}
            <Animated.View
              style={[styles.stepContent, {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }]}
            >
              {step === 0 && (
                <View>
                  <CustomInput
                    icon={User}
                    placeholder="Nombre de usuario"
                    value={form.username}
                    autoCapitalize="none"
                    onChangeText={(text) => setForm({ ...form, username: text })}
                    accessibilityLabel="Nombre de usuario"
                  />
                  <CustomInput
                    icon={Mail}
                    placeholder="Correo electrónico"
                    value={form.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={(text) => setForm({ ...form, email: text })}
                    accessibilityLabel="Correo electrónico"
                  />
                  <CustomInput
                    icon={Lock}
                    placeholder="Contraseña"
                    isPassword
                    value={form.password}
                    autoCapitalize="none"
                    onChangeText={(text) => setForm({ ...form, password: text })}
                    accessibilityLabel="Contraseña"
                  />
                  <CustomInput
                    icon={Lock}
                    placeholder="Confirma tu contraseña"
                    isPassword
                    value={form.confirmPassword}
                    autoCapitalize="none"
                    onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                    accessibilityLabel="Confirmar contraseña"
                  />
                </View>
              )}

              {step === 1 && (
                <View>
                  {/* Household name */}
                  <Text style={styles.fieldLabel}>Nombre del hogar</Text>
                  <View style={styles.fieldWrap}>
                    <House size={18} color={COLORS.text} opacity={0.45} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Ej. Casa García"
                      placeholderTextColor={COLORS.text + '44'}
                      value={householdName}
                      onChangeText={setHouseholdName}
                      accessibilityLabel="Nombre del hogar"
                    />
                  </View>

                  {/* Member count */}
                  <Text style={styles.fieldLabel}>Miembros de la unidad familiar</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={[styles.counterBtn, memberCount <= 1 && styles.counterBtnDisabled]}
                      onPress={() => setMemberCount(c => Math.max(1, c - 1))}
                      disabled={memberCount <= 1}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="Reducir miembros"
                    >
                      <Text style={[styles.counterBtnText, memberCount <= 1 && { opacity: 0.3 }]}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.counterDisplay}>
                      <Text style={styles.counterValue}>{memberCount}</Text>
                      <Text style={styles.counterLabel}>
                        {memberCount === 1 ? 'persona' : 'personas'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setMemberCount(c => c + 1)}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="Añadir miembro"
                    >
                      <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.infoCard}>
                    <Text style={styles.infoEmoji}>🏠</Text>
                    <Text style={styles.infoText}>
                      El hogar agrupa a toda la familia. Podrás invitar a más miembros después.
                    </Text>
                  </View>
                </View>
              )}

              {step === 2 && (
                <View>
                  {allergensLoading ? (
                    <View style={styles.loadingWrap}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                      <Text style={styles.loadingText}>Cargando alérgenos…</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.sectionNote}>
                        Selecciona los alérgenos que apliquen a tu hogar. Puedes cambiarlos después.
                      </Text>
                      <View style={styles.chipGrid}>
                        {allergenOptions.map(a => (
                          <ToggleChip
                            key={a.id}
                            emoji={a.emoji}
                            label={a.name}
                            selected={selectedAllergens.includes(a.id)}
                            onToggle={() => toggleAllergen(a.id)}
                            accessibilityHint={`Toca para ${selectedAllergens.includes(a.id) ? 'desactivar' : 'activar'} ${a.name}`}
                          />
                        ))}
                      </View>
                      {allergenOptions.length === 0 && (
                        <View style={styles.infoCard}>
                          <Text style={styles.infoEmoji}>ℹ️</Text>
                          <Text style={styles.infoText}>
                            No se encontraron alérgenos en el sistema. Puedes añadirlos más tarde desde tu perfil.
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text style={styles.sectionNote}>
                    Marca los electrodomésticos de tu cocina. Las recetas de IA se adaptarán a lo que tengas.
                  </Text>
                  <View style={styles.chipGrid}>
                    {APPLIANCES.map(a => (
                      <ToggleChip
                        key={a.key}
                        emoji={a.emoji}
                        label={a.label}
                        selected={selectedAppliances.includes(a.key)}
                        onToggle={() => toggleAppliance(a.key)}
                        accessibilityHint={`Toca para ${selectedAppliances.includes(a.key) ? 'quitar' : 'añadir'} ${a.label}`}
                      />
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>

            {/* ── Action buttons ── */}
            <View style={styles.actionRow}>
              {isLastStep ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, currentLoading && { opacity: 0.6 }]}
                  onPress={handleFinish}
                  disabled={currentLoading}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Finalizar registro"
                >
                  {currentLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Check size={20} color={COLORS.white} strokeWidth={3} />
                      <Text style={styles.primaryBtnText}>  Finalizar</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryBtn, currentLoading && { opacity: 0.6 }]}
                  onPress={handleNext}
                  disabled={currentLoading}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Siguiente paso"
                >
                  {currentLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Siguiente  </Text>
                      <ArrowRight size={18} color={COLORS.white} strokeWidth={2.5} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ── Footer (only step 0) ── */}
            {step === 0 && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  accessible
                  accessibilityRole="link"
                  accessibilityLabel="Ir a iniciar sesión"
                >
                  <Text style={styles.loginText}>Inicia sesión</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STYLES ───────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
  android: { elevation: 3 },
}) as any;
const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14 },
  android: { elevation: 8 },
}) as any;
const SHADOW_PRIMARY = Platform.select({
  ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10 },
  android: { elevation: 10 },
}) as any;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1, paddingHorizontal: 28,
    paddingTop: 60, paddingBottom: 40,
  },

  // Background circles
  circle: { position: 'absolute', borderRadius: 1000, opacity: 0.12 },
  circle1: { width: 320, height: 320, backgroundColor: COLORS.accent, top: -90, right: -110 },
  circle2: { width: 260, height: 260, backgroundColor: COLORS.primary, bottom: -110, left: -90 },

  // Back
  backButton: {
    position: 'absolute', top: 16, left: 0, zIndex: 10,
    padding: 12, backgroundColor: CARD_BG + 'CC',
    borderRadius: 16, ...SHADOW_SM,
  },

  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 16, marginTop: 36 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 22,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    transform: [{ rotate: '10deg' }], ...SHADOW_PRIMARY,
  },
  sparkleTag: {
    position: 'absolute', top: -6, left: -6,
    backgroundColor: COLORS.accent, padding: 5, borderRadius: 10,
  },

  // Step indicator
  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20, marginTop: 4,
  },
  stepItemWrap: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: FIELD_BG, borderWidth: 2,
    borderColor: COLORS.text + '18',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotDone: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
  },
  stepDotActive: {
    backgroundColor: CARD_BG, borderColor: COLORS.primary,
    borderWidth: 2.5, ...SHADOW_SM,
  },
  stepDotText: { fontSize: 11, fontWeight: '800', color: COLORS.text + '55' },
  stepDotTextActive: { color: COLORS.primary },
  stepLine: {
    width: 28, height: 2.5, backgroundColor: COLORS.text + '12',
    marginHorizontal: 4, borderRadius: 2,
  },
  stepLineDone: { backgroundColor: COLORS.primary },

  // Header
  header: { alignItems: 'center', marginBottom: 24 },
  brandName: { fontSize: 30, fontWeight: '900', color: COLORS.text, letterSpacing: -0.8 },
  accentBar: { width: 36, height: 4.5, backgroundColor: COLORS.accent, borderRadius: 10, marginTop: 5 },
  subtitle: { fontSize: 14, color: COLORS.text, opacity: 0.55, marginTop: 8, fontWeight: '500' },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.error + '12', borderRadius: 14,
    padding: 14, marginBottom: 16,
    borderWidth: 1.5, borderColor: COLORS.error + '33',
  },
  errorEmoji: { fontSize: 18 },
  errorText: { flex: 1, color: COLORS.error, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // Step content
  stepContent: { minHeight: 200 },

  // Field styles (for step 1 & beyond)
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.text,
    opacity: 0.5, marginBottom: 7, letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, height: 60, borderRadius: 16,
    paddingHorizontal: 18, marginBottom: 20,
    borderWidth: 1, borderColor: '#e8f5ed', gap: 12,
    ...SHADOW_SM,
  },
  fieldInput: {
    flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '600',
  },

  // Counter
  counterRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 16, marginBottom: 24,
  },
  counterBtn: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: CARD_BG, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary + '44', ...SHADOW_SM,
  },
  counterBtnDisabled: { borderColor: COLORS.text + '15' },
  counterBtnText: { fontSize: 26, fontWeight: '700', color: COLORS.primary, lineHeight: 30 },
  counterDisplay: { alignItems: 'center', minWidth: 80 },
  counterValue: { fontSize: 40, fontWeight: '900', color: DARK_GREEN, lineHeight: 46 },
  counterLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, opacity: 0.45 },

  // Info card
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.primary + '0D', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: COLORS.primary + '22',
  },
  infoEmoji: { fontSize: 18, marginTop: 1 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.text, opacity: 0.6, lineHeight: 19, fontWeight: '500' },

  // Section note
  sectionNote: {
    fontSize: 13, color: COLORS.text, opacity: 0.55,
    lineHeight: 19, marginBottom: 18, fontWeight: '500', textAlign: 'center',
  },

  // Chip grid
  chipGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, backgroundColor: CARD_BG,
    borderWidth: 1.5, borderColor: COLORS.text + '15',
    ...SHADOW_SM,
  },
  chipSelected: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  chipEmoji: { fontSize: 18 },
  chipLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  chipLabelSelected: { color: COLORS.primary },
  chipCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  // Loading
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.text, opacity: 0.5, fontWeight: '600' },

  // Action row
  actionRow: { marginTop: 28 },
  primaryBtn: {
    flexDirection: 'row', height: 60, borderRadius: 18,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    ...SHADOW_PRIMARY,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14, color: COLORS.text, opacity: 0.55 },
  loginText: { fontSize: 14, color: COLORS.accent, fontWeight: '800' },
});

export default RegisterScreen;