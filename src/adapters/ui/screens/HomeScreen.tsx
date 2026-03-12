import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ItemStatus } from '../../../core/domain/fridgeItem.types';
import { COLORS } from '../../../shared/theme/colors';
import { fridgeService } from '../../external/api/FridgeService';
import { profileService } from '../../external/api/ProfileService';
import { AuthContext } from '../navigation/AuthContext';

// ─── Constantes de tema (idénticas al resto de pantallas) ─────────────────────
const DARK_GREEN = '#0D1F17';
const MID_GREEN = '#1A3826';
const ICE = '#C8F0DC';

// ─── Helper: hora del día ─────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 13) return '¡Buenos días';
  if (h < 20) return '¡Buenas tardes';
  return '¡Buenas noches';
}

// ─── Avatar mini ──────────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2);
  const palette = ['#4dc763', '#FF9F1C', '#5BBCFF', '#C879FF', '#FF6B6B'];
  const bg = palette[name.charCodeAt(0) % palette.length];
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

// ─── Stat chip (la misma que en las otras pantallas) ─────────────────────────
function StatChip({ emoji, value, label, color }: { emoji: string; value: string | number; label: string; color: string }) {
  return (
    <View style={[styles.statChip, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Quick-action card ────────────────────────────────────────────────────────
function QuickCard({
  emoji, title, subtitle, accentColor, onPress,
}: {
  emoji: string; title: string; subtitle: string; accentColor: string; onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={[styles.quickCard, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
        style={{ flex: 1 }} activeOpacity={1}
      >
        <View style={[styles.quickCardStrip, { backgroundColor: accentColor }]} />
        <View style={styles.quickCardBody}>
          <View style={[styles.quickCardIconWrap, { backgroundColor: accentColor + '22' }]}>
            <Text style={styles.quickCardEmoji}>{emoji}</Text>
          </View>
          <Text style={styles.quickCardTitle}>{title}</Text>
          <Text style={styles.quickCardSub}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const { logout } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const [profile] = useState(() => profileService.get());
  const [fridgeItems] = useState(() => fridgeService.getAll());

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const expiredCount = fridgeItems.filter(i => i.status === ItemStatus.EXPIRED).length;
  const freshCount = fridgeItems.filter(i => i.status === ItemStatus.GOOD).length;
  const memberCount = profile.householdMembers.length;
  const toolCount = profile.kitchenTools.length;

  const firstName = profile.name.split(' ')[0];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* ══ HEADER PANEL ══ */}
      <View style={styles.header}>
        {/* Top bar */}
        <View style={styles.headerTopBar}>
          <View style={styles.ledRow}>
            <View style={styles.led} />
            <Text style={styles.headerEyebrow}>GastroMind</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutIcon}>⎋</Text>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Greeting + avatar */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={styles.greetingSub}>{getGreeting()},</Text>
            <Text style={styles.greetingName}>{firstName}! 👋</Text>
          </View>
          <View style={styles.avatarRing}>
            <Avatar name={profile.name} size={56} />
          </View>
        </View>

        {/* Stats fila */}
        <View style={styles.statsRow}>
          <StatChip emoji="🧊" value={fridgeItems.length} label="En nevera" color={COLORS.primary} />
          <StatChip emoji="⚠️" value={expiredCount} label="Caducados" color={COLORS.error} />
          <StatChip emoji="🏠" value={memberCount} label="Personas" color={COLORS.accent} />
          <StatChip emoji="🍳" value={toolCount} label="Utensilios" color="#5BBCFF" />
        </View>
      </View>

      {/* ══ BODY ══ */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* Alerta caducados */}
          {expiredCount > 0 && (
            <TouchableOpacity
              style={styles.alertBanner}
              onPress={() => navigation.navigate('Nevera')}
              activeOpacity={0.85}
            >
              <Text style={styles.alertBannerEmoji}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertBannerTitle}>
                  {expiredCount === 1
                    ? '1 producto caducado en tu nevera'
                    : `${expiredCount} productos caducados en tu nevera`}
                </Text>
                <Text style={styles.alertBannerSub}>Toca para revisar tu nevera →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Accesos rápidos ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.quickGrid}>
            <QuickCard
              emoji="🧊"
              title="Mi Nevera"
              subtitle={`${freshCount} frescos`}
              accentColor={COLORS.primary}
              onPress={() => navigation.navigate('Nevera')}
            />
            <QuickCard
              emoji="👤"
              title="Mi Perfil"
              subtitle={`${toolCount} utensilios`}
              accentColor="#5BBCFF"
              onPress={() => navigation.navigate('Perfil')}
            />
          </View>

          {/* ── Recetas IA ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recetas con IA</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.recipeHero}>
            {/* Decoraciones */}
            <View style={styles.recipeHeroDeco1} />
            <View style={styles.recipeHeroDeco2} />

            <View style={styles.recipeHeroInner}>
              <View style={styles.recipeHeroBadge}>
                <Text style={styles.recipeHeroBadgeText}>✨ IA</Text>
              </View>
              <Text style={styles.recipeHeroTitle}>Tu próxima creación</Text>
              <Text style={styles.recipeHeroSub}>
                GastroMind analizará tu nevera y tus utensilios para generar recetas personalizadas solo para ti.
              </Text>
              <TouchableOpacity style={styles.recipeHeroBtn} activeOpacity={0.85}>
                <Text style={styles.recipeHeroBtnText}>🍽️  Generar receta</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Miembros del hogar ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hogar</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.householdCard}>
            <View style={styles.householdAvatars}>
              {profile.householdMembers.map((m, i) => (
                <View
                  key={m.id}
                  style={[styles.householdAvatarWrap, { marginLeft: i === 0 ? 0 : -10, zIndex: profile.householdMembers.length - i }]}
                >
                  <Avatar name={m.name} size={40} />
                </View>
              ))}
            </View>
            <View style={styles.householdInfo}>
              <Text style={styles.householdNames}>
                {profile.householdMembers.map(m => m.name).join(', ')}
              </Text>
              <Text style={styles.householdSub}>
                {memberCount === 1 ? '1 persona en el hogar' : `${memberCount} personas en el hogar`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.householdArrow}
              onPress={() => navigation.navigate('Perfil')}
            >
              <Text style={styles.householdArrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 3 },
});
const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 10 },
});
const SHADOW_PRIMARY = Platform.select({
  ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10 },
  android: { elevation: 10 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9F5EE' },

  // ── Header
  header: {
    backgroundColor: DARK_GREEN,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOW_MD,
  },
  headerTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  ledRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  led: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
      android: { elevation: 2 },
    }),
  },
  headerEyebrow: { color: ICE, fontSize: 14, fontWeight: '700', letterSpacing: 1, opacity: 0.8 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: MID_GREEN,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.error + '55',
  },
  logoutIcon: { color: COLORS.error, fontSize: 14 },
  logoutText: { color: COLORS.error, fontWeight: '700', fontSize: 13 },

  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  greetingText: { flex: 1 },
  greetingSub: { color: ICE, fontSize: 14, fontWeight: '500', opacity: 0.65, marginBottom: 2 },
  greetingName: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  avatarRing: {
    borderRadius: 34, borderWidth: 2.5, borderColor: COLORS.primary, padding: 2,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOpacity: 0.7, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
      android: { elevation: 6 },
    }),
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flex: 1, alignItems: 'center', paddingVertical: 9,
    borderRadius: 14, borderWidth: 1.5,
  },
  statEmoji: { fontSize: 14, marginBottom: 2 },
  statValue: { fontSize: 17, fontWeight: '900' },
  statLabel: { fontSize: 9, color: ICE, opacity: 0.65, fontWeight: '600', marginTop: 1 },

  // ── Scroll body
  scroll: { paddingHorizontal: 18, paddingTop: 20 },

  // Alert banner
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.error + '15',
    borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1.5, borderColor: COLORS.error + '44',
  },
  alertBannerEmoji: { fontSize: 26 },
  alertBannerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.error },
  alertBannerSub: { fontSize: 12, color: COLORS.error, opacity: 0.7, marginTop: 2 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: DARK_GREEN, opacity: 0.5, letterSpacing: 0.9, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1, backgroundColor: DARK_GREEN + '15' },

  // Quick grid
  quickGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickCard: {
    flex: 1, backgroundColor: COLORS.white,
    borderRadius: 20, overflow: 'hidden',
    ...SHADOW_SM,
  },
  quickCardStrip: { height: 5 },
  quickCardBody: { padding: 16 },
  quickCardIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  quickCardEmoji: { fontSize: 24 },
  quickCardTitle: { fontSize: 15, fontWeight: '800', color: DARK_GREEN, marginBottom: 3 },
  quickCardSub: { fontSize: 12, color: DARK_GREEN, opacity: 0.45, fontWeight: '500' },

  // Recipe hero card
  recipeHero: {
    backgroundColor: DARK_GREEN,
    borderRadius: 24, overflow: 'hidden',
    marginBottom: 24,
    ...SHADOW_MD,
  },
  recipeHeroDeco1: {
    position: 'absolute', width: 160, height: 160,
    borderRadius: 80, backgroundColor: COLORS.primary + '18',
    top: -40, right: -30,
  },
  recipeHeroDeco2: {
    position: 'absolute', width: 100, height: 100,
    borderRadius: 50, backgroundColor: COLORS.accent + '15',
    bottom: -20, left: 20,
  },
  recipeHeroInner: { padding: 24 },
  recipeHeroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '30',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1.2, borderColor: COLORS.primary + '55',
    marginBottom: 14,
  },
  recipeHeroBadgeText: { color: COLORS.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  recipeHeroTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 8 },
  recipeHeroSub: { fontSize: 13, color: ICE, opacity: 0.65, lineHeight: 19, marginBottom: 20 },
  recipeHeroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingVertical: 13,
    borderRadius: 14,
    ...SHADOW_PRIMARY,
  },
  recipeHeroBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  // Household card
  householdCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 24,
    ...SHADOW_SM,
  },
  householdAvatars: { flexDirection: 'row', alignItems: 'center' },
  householdAvatarWrap: {
    borderRadius: 22, borderWidth: 2, borderColor: COLORS.white,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  householdInfo: { flex: 1 },
  householdNames: { fontSize: 14, fontWeight: '800', color: DARK_GREEN },
  householdSub: { fontSize: 12, color: DARK_GREEN, opacity: 0.45, marginTop: 2 },
  householdArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary + '18',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.2, borderColor: COLORS.primary + '44',
  },
  householdArrowText: { color: COLORS.primary, fontSize: 22, fontWeight: '700', lineHeight: 28 },
});

export default HomeScreen;