import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { pushRecipeDetail } from '../navigation/routes';
import { favoriteService, UserFavorite } from '../../external/api/FavoriteService';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  GestureResponderEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChefHat, Clock3, Flame, Heart, Trash2 } from 'lucide-react-native';
import { Recipe } from '../../../core/domain/recipe.types';
import { COLORS } from '../../../shared/theme/colors';
import { useNetwork } from '../../../shared/network/NetworkProvider';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppStateView from '../components/AppStateView';
import AppBanner from '../components/AppBanner';
import AppEmptyState from '../components/AppEmptyState';

// ─── Constantes de tema (idénticas al resto de pantallas) ─────────────────────
const DARK_GREEN = '#0D1F17';

// ─── Componente Tarjeta de Receta ─────────────────────────────────────────────
const RecipeCard: React.FC<{
  favorite: UserFavorite;
  isDark: boolean;
  onPress: () => void;
  onRemove: () => void;
}> = ({ favorite, isDark, onPress, onRemove }) => {
  const { recipe } = favorite;
  const cardDescription =
    recipe.description && recipe.description !== 'Sin descripcion.'
      ? recipe.description
      : recipe.instructions;
  const showCalories = Number.isFinite(recipe.calories) && recipe.calories > 0;
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={[styles.recipeCardWrap, { transform: [{ scale }] }]}> 
      <TouchableOpacity
        style={[styles.recipeCard, isDark && { backgroundColor: '#11351A', borderWidth: 1, borderColor: COLORS.secondary + '55' }]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Abrir receta ${recipe.title}`}
        accessibilityHint="Abre el detalle de esta receta"
      >
        {/* Info */}
        <View style={styles.recipeInfo}>
          <View style={styles.recipeTopRow}>
            <View style={styles.recipeTitleWrap}>
              <View style={styles.recipeTitleAccent} />
              <Text style={[styles.recipeTitle, isDark && { color: COLORS.white }]} numberOfLines={2}>{recipe.title}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeBadgeInline}
              onPress={(event: GestureResponderEvent) => {
                event.stopPropagation();
                onRemove();
              }}
              activeOpacity={0.85}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${recipe.title} de favoritos`}
              accessibilityHint="Elimina esta receta de tu lista"
            >
              <Trash2 size={13} color={COLORS.white} strokeWidth={2.6} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.recipeDesc, isDark && { color: COLORS.white, opacity: 0.78 }]} numberOfLines={2}>{cardDescription}</Text>

          <View style={styles.recipeStats}>
            <View style={[styles.statItem, isDark && { backgroundColor: COLORS.white + '10', borderColor: COLORS.white + '26' }]}>
              <Clock3 size={12} color={isDark ? COLORS.white : DARK_GREEN} strokeWidth={2.4} />
              <Text style={[styles.statText, isDark && { color: COLORS.white, opacity: 0.9 }]}>{recipe.prep_time}m</Text>
            </View>
            {showCalories ? (
              <View style={[styles.statItem, isDark && { backgroundColor: COLORS.white + '10', borderColor: COLORS.white + '26' }]}>
                <Flame size={12} color={COLORS.accent} strokeWidth={2.4} />
                <Text style={[styles.statText, isDark && { color: COLORS.white, opacity: 0.9 }]}>{recipe.calories} kcal</Text>
              </View>
            ) : null}
            <View style={[styles.statItem, isDark && { backgroundColor: COLORS.white + '10', borderColor: COLORS.white + '26' }]}>
              <ChefHat size={12} color={COLORS.primary} strokeWidth={2.4} />
              <Text style={[styles.statText, isDark && { color: COLORS.white, opacity: 0.9 }]}>{recipe.appliance_needed}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const FavoriteRecipesScreen: React.FC = () => {
  const { isOnline } = useNetwork();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppliance, setSelectedAppliance] = useState<string>('TODOS');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('TODOS');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  const sortedFavorites = useMemo(
    () =>
      [...favorites].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [favorites]
  );

  const applianceOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        favorites
          .map((item) => item.recipe.appliance_needed)
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));
    return ['TODOS', ...values];
  }, [favorites]);

  const timeOptions = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Hasta 15m', value: 'LTE_15' },
    { label: 'Hasta 30m', value: 'LTE_30' },
    { label: 'Hasta 45m', value: 'LTE_45' },
    { label: 'Mas de 45m', value: 'GT_45' },
  ] as const;

  const filteredFavorites = useMemo(() => {
    return sortedFavorites.filter((item) => {
      const applianceMatches = selectedAppliance === 'TODOS' || item.recipe.appliance_needed === selectedAppliance;
      const prepTime = Number.isFinite(item.recipe.prep_time) ? item.recipe.prep_time : 0;

      const timeMatches =
        selectedTimeFilter === 'TODOS' ||
        (selectedTimeFilter === 'LTE_15' && prepTime <= 15) ||
        (selectedTimeFilter === 'LTE_30' && prepTime <= 30) ||
        (selectedTimeFilter === 'LTE_45' && prepTime <= 45) ||
        (selectedTimeFilter === 'GT_45' && prepTime > 45);

      return applianceMatches && timeMatches;
    });
  }, [selectedAppliance, selectedTimeFilter, sortedFavorites]);

  const hasActiveFilters = selectedAppliance !== 'TODOS' || selectedTimeFilter !== 'TODOS';

  const resetFilters = () => {
    setSelectedAppliance('TODOS');
    setSelectedTimeFilter('TODOS');
  };

  const fetchFavorites = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const list = isOnline
        ? await favoriteService.getMine()
        : await favoriteService.getMineOffline();
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
  }, [isOnline]);

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
    if (!isOnline) {
      Alert.alert('Sin conexión', 'Sin internet solo podes consultar favoritos guardados localmente.');
      return;
    }

    Alert.alert(
      'Quitar de favoritos',
      `Vas a quitar "${recipeTitle}" de tu lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            const previousFavorites = favorites;
            setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
            try {
              await favoriteService.deleteMine(favoriteId);
            } catch (e: any) {
              setFavorites(previousFavorites);
              const message =
                e?.response?.data?.message ||
                e?.message ||
                'No se pudo quitar la receta de favoritos.';
              Alert.alert('Ups', message);
            } finally {
              fetchFavorites(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <AppStateView
        variant="loading"
        title="Cargando favoritos"
        message="Estamos preparando tus recetas guardadas."
        isDark={isDark}
      />
    );
  }

  if (error && favorites.length === 0) {
    return (
      <AppStateView
        variant="error"
        title="No se pudieron cargar tus favoritos"
        message={error}
        actionLabel="Reintentar"
        onAction={() => fetchFavorites(true)}
        isDark={isDark}
      />
    );
  }

  return (
    <View style={[styles.root, isDark && { backgroundColor: '#0C100D' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0C100D' : DARK_GREEN} translucent={false} />
      {/* ══ BODY ══ */}
      <Animated.View
        style={[
          { flex: 1, paddingTop: insets.top + 2, paddingBottom: Math.max(110, insets.bottom + 90) },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <FlatList
          data={filteredFavorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard
              favorite={item}
              isDark={isDark}
              onPress={() => pushRecipeDetail(item.recipe as Recipe)}
              onRemove={() => handleDeleteFavorite(item.id, item.recipe.title)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={(
            <View style={styles.scroll}>
              <View style={[styles.heroCard, isDark && styles.heroCardDark]}>
                <View style={[styles.heroAccent, isDark && styles.heroAccentDark]} />
                <View style={[styles.sectionIconWrap, isDark && styles.sectionIconWrapDark]}>
                  <Heart size={15} color={isDark ? COLORS.white : COLORS.error} fill={isDark ? COLORS.white : COLORS.error} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, isDark && { color: COLORS.white }]}>Recetas favoritas</Text>
                  <Text style={[styles.sectionSubtitle, isDark && { color: COLORS.white, opacity: 0.68 }]}>{filteredFavorites.length} guardadas para cocinar rapido</Text>
                </View>
                <View style={[styles.countBadge, isDark && styles.countBadgeDark]}>
                  <Text style={[styles.countBadgeText, isDark && { color: COLORS.white }]}>{filteredFavorites.length}</Text>
                </View>
              </View>

              <View style={[styles.filtersBlock, isDark && styles.filtersBlockDark]}>
                <View style={styles.filtersTopRow}>
                  <Text style={[styles.filtersTitle, isDark && { color: COLORS.white, opacity: 0.85 }]}>Filtros</Text>
                  {hasActiveFilters ? (
                    <TouchableOpacity
                      style={styles.clearFiltersBtn}
                      onPress={resetFilters}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Limpiar filtros"
                      accessibilityHint="Restablece utensilio y tiempo"
                    >
                      <Text style={styles.clearFiltersText}>Limpiar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={[styles.filterGroupLabel, isDark && { color: COLORS.white, opacity: 0.62 }]}>Utensilio</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                  {applianceOptions.map((option) => {
                    const isActive = selectedAppliance === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setSelectedAppliance(option)}
                        activeOpacity={0.85}
                        style={[
                          styles.filterChip,
                          isDark && styles.filterChipDark,
                          isActive && styles.filterChipActive,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={option === 'TODOS' ? 'Filtro utensilio todos' : `Filtro utensilio ${option}`}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isDark && { color: COLORS.white, opacity: 0.8 },
                            isActive && styles.filterChipTextActive,
                          ]}
                        >
                          {option === 'TODOS' ? 'Utensilio: Todos' : option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.filterGroupLabel, isDark && { color: COLORS.white, opacity: 0.62 }]}>Tiempo</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                  {timeOptions.map((option) => {
                    const isActive = selectedTimeFilter === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setSelectedTimeFilter(option.value)}
                        activeOpacity={0.85}
                        style={[
                          styles.filterChip,
                          isDark && styles.filterChipDark,
                          isActive && styles.filterChipActive,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Filtro tiempo ${option.label}`}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isDark && { color: COLORS.white, opacity: 0.8 },
                            isActive && styles.filterChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {!isOnline ? (
                <View style={styles.bannerWrap}>
                  <AppBanner
                    variant="warning"
                    title="Modo sin conexion"
                    message="Mostrando favoritos almacenados localmente."
                    isDark={isDark}
                  />
                </View>
              ) : null}

              {error ? (
                <View style={styles.bannerWrap}>
                  <AppBanner
                    variant="error"
                    title="No se pudo actualizar favoritos"
                    message={error}
                    isDark={isDark}
                    onClose={() => setError(null)}
                  />
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => fetchFavorites(false)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Reintentar carga de favoritos"
                  >
                    <Text style={styles.retryBtnText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={(
            <AppEmptyState
              title="No hay recetas para esos filtros"
              message="Proba otro utensilio o cambia el rango de tiempo."
              isDark={isDark}
              actionLabel={hasActiveFilters ? 'Limpiar filtros' : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          )}
          contentContainerStyle={{ paddingBottom: 6 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
          }
        />
      </Animated.View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 3 },
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

  // ── Scroll body
  scroll: { paddingHorizontal: 14, paddingTop: 6 },

  heroCard: {
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E9DE',
    backgroundColor: '#F7FCF9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  heroCardDark: {
    backgroundColor: '#102A1D',
    borderColor: COLORS.secondary + '55',
  },
  heroAccent: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -35,
    top: -70,
    backgroundColor: '#DFF4E8',
  },
  heroAccentDark: {
    backgroundColor: COLORS.white + '10',
  },

  // Section header
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEDED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7D4D4',
  },
  sectionIconWrapDark: {
    backgroundColor: COLORS.white + '15',
    borderColor: COLORS.white + '24',
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: DARK_GREEN, letterSpacing: 0.1 },
  sectionSubtitle: { fontSize: 11, fontWeight: '600', color: DARK_GREEN, opacity: 0.58 },
  countBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 8,
    backgroundColor: COLORS.primary + '18',
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeDark: {
    backgroundColor: COLORS.white + '15',
    borderColor: COLORS.white + '30',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },

  listContainer: {
    gap: 10,
  },
  filtersBlock: {
    marginBottom: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DAEADF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 9,
    ...SHADOW_SM,
  },
  filtersTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK_GREEN,
    opacity: 0.78,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  filterGroupLabel: {
    marginTop: -2,
    marginBottom: -2,
    fontSize: 11,
    fontWeight: '700',
    color: DARK_GREEN,
    opacity: 0.54,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clearFiltersBtn: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E7A4E',
    justifyContent: 'center',
  },
  clearFiltersText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  filtersBlockDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '50',
  },
  filtersRow: {
    gap: 8,
    paddingRight: 12,
  },
  filterChip: {
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: '#F4FAF6',
    borderWidth: 1,
    borderColor: '#D6E8DB',
  },
  filterChipDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '55',
  },
  filterChipActive: {
    backgroundColor: '#157347',
    borderColor: '#157347',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK_GREEN,
    opacity: 0.82,
  },
  filterChipTextActive: {
    color: COLORS.white,
    opacity: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  bannerWrap: {
    marginBottom: 12,
    gap: 8,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D7E9DD',
    ...SHADOW_SM,
  },
  bookmarkBadgeInline: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#F6D8D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBadgeInline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E05A5A',
    borderWidth: 1,
    borderColor: '#F9C3C3',
  },
  recipeInfo: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  recipeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  recipeTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  recipeTitleAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK_GREEN,
    flexShrink: 1,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  recipeDesc: {
    fontSize: 12,
    color: DARK_GREEN,
    opacity: 0.62,
    marginBottom: 14,
    lineHeight: 17,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4FAF6',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
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
