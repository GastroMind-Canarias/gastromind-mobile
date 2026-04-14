import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { AppNavigationProp } from '../navigation/types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChefHat, Clock3, Flame, Heart, RefreshCw, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Recipe } from '../../../core/domain/recipe.types';
import { COLORS } from '../../../shared/theme/colors';
import { favoriteService, UserFavorite } from '../../external/api/FavoriteService';

// ─── Constantes de tema (idénticas al resto de pantallas) ─────────────────────
const DARK_GREEN = '#0D1F17';
const MID_GREEN = '#1A3826';
const ICE = '#C8F0DC';

// ─── Componente Tarjeta de Receta ─────────────────────────────────────────────
const RecipeCard: React.FC<{
  favorite: UserFavorite;
  onPress: () => void;
  onRemove: () => void;
}> = ({ favorite, onPress, onRemove }) => {
  const { recipe } = favorite;
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={[styles.recipeCardWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
      >
        {/* Imagen */}
        <Image style={styles.recipeImage} source={{ uri: recipe.image_url }} />

        <View style={styles.bookmarkBadge}>
          <Heart size={16} color={COLORS.error} fill={COLORS.error} strokeWidth={2.3} />
        </View>

        <TouchableOpacity style={styles.removeBadge} onPress={onRemove} activeOpacity={0.85}>
          <Trash2 size={14} color={COLORS.white} strokeWidth={2.6} />
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.recipeInfo}>
          <View style={styles.recipeHeader}>
            <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
          </View>
          <Text style={styles.recipeDesc} numberOfLines={2}>{recipe.description}</Text>

          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <Clock3 size={12} color={DARK_GREEN} strokeWidth={2.4} />
              <Text style={styles.statText}>{recipe.prep_time}m</Text>
            </View>
            <View style={styles.statItem}>
              <Flame size={12} color={COLORS.accent} strokeWidth={2.4} />
              <Text style={styles.statText}>{recipe.calories} kcal</Text>
            </View>
            <View style={styles.statItem}>
              <ChefHat size={12} color={COLORS.primary} strokeWidth={2.4} />
              <Text style={styles.statText}>{recipe.appliance_needed}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const FavoriteRecipesScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  const sortedFavorites = useMemo(
    () =>
      [...favorites].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [favorites]
  );

  const fetchFavorites = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const list = await favoriteService.getMine();
      setFavorites(list);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        'No pudimos cargar tus favoritos por ahora.';
      setError(message);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites(true);
    }, [fetchFavorites])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites(false);
  };

  const handleDeleteFavorite = (favoriteId: string, recipeTitle: string) => {
    Alert.alert(
      'Quitar de favoritos',
      `Vas a quitar "${recipeTitle}" de tu lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoriteService.deleteMine(favoriteId);
              setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
            } catch (e: any) {
              const message =
                e?.response?.data?.message ||
                e?.message ||
                'No se pudo quitar la receta de favoritos.';
              Alert.alert('Ups', message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="light-content" backgroundColor={DARK_GREEN} translucent={false} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tus recetas favoritas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_GREEN} translucent={false} />
      {/* ══ HEADER PANEL ══ */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopBar}>
          <View style={styles.ledRow}>
            <View style={styles.led} />
            <Text style={styles.headerEyebrow}>Tus Colecciones</Text>
          </View>
        </View>

        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={styles.greetingName}>Recetas Favoritas</Text>
            <Text style={styles.greetingSub}>{sortedFavorites.length} guardadas</Text>
          </View>
          <TouchableOpacity style={styles.reloadButton} onPress={() => fetchFavorites(false)} activeOpacity={0.85}>
            <RefreshCw size={14} color={ICE} strokeWidth={2.5} />
            <Text style={styles.reloadButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══ BODY ══ */}
      <Animated.View
        style={[
          { flex: 1, paddingBottom: Math.max(110, insets.bottom + 90) },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
          }
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Platos Guardados</Text>
            <View style={styles.sectionLine} />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.listContainer}>
            {sortedFavorites.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Heart size={24} color={COLORS.error} strokeWidth={2.4} />
                </View>
                <Text style={styles.emptyTitle}>Todavia no tenes favoritos</Text>
                <Text style={styles.emptySubtitle}>
                  Genera recetas con IA o guarda una desde sugerencias para verla aca.
                </Text>
              </View>
            ) : (
              sortedFavorites.map((favorite) => (
                <RecipeCard
                  key={favorite.id}
                  favorite={favorite}
                  onPress={() => {
                    navigation.navigate('RecipeDetail', { recipe: favorite.recipe as Recipe });
                  }}
                  onRemove={() => handleDeleteFavorite(favorite.id, favorite.recipe.title)}
                />
              ))
            )}
          </View>

        </ScrollView>
      </Animated.View>
    </View>
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

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: '#E9F5EE',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GREEN,
    opacity: 0.7,
  },
  root: { flex: 1, backgroundColor: '#E9F5EE' },

  // ── Header
  header: {
    backgroundColor: DARK_GREEN,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOW_MD,
  },
  headerTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
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

  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { flex: 1 },
  greetingSub: { color: ICE, fontSize: 14, fontWeight: '500', opacity: 0.65, marginTop: 4 },
  greetingName: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MID_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ICE + '44',
  },
  reloadButtonText: {
    color: ICE,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Scroll body
  scroll: { paddingHorizontal: 18, paddingTop: 20 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: DARK_GREEN, opacity: 0.5, letterSpacing: 0.9, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1, backgroundColor: DARK_GREEN + '15' },

  listContainer: {
    gap: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0ECE5',
    ...SHADOW_SM,
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.error + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK_GREEN,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: DARK_GREEN,
    opacity: 0.55,
    lineHeight: 19,
    textAlign: 'center',
  },

  // ── Recipe Card
  recipeCardWrap: {
    marginBottom: 0,
  },
  recipeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  recipeImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#D1E6DA',
  },
  bookmarkBadge: {
    position: 'absolute',
    top: 16, right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOW_SM,
  },
  removeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: DARK_GREEN + 'D9',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white + '50',
  },
  recipeInfo: {
    padding: 18,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK_GREEN,
    flex: 1,
    letterSpacing: -0.2,
  },
  recipeDesc: {
    fontSize: 13,
    color: DARK_GREEN,
    opacity: 0.6,
    marginBottom: 16,
    lineHeight: 18,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F9F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK_GREEN,
    opacity: 0.8,
  },
});

export default FavoriteRecipesScreen;
