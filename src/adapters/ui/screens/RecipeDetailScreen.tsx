import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChefHat, Clock3, Flame, Heart, UtensilsCrossed } from 'lucide-react-native';
import { Recipe } from '../../../core/domain/recipe.types';
import { COLORS } from '../../../shared/theme/colors';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { favoriteService } from '../../external/api/FavoriteService';

// ─── Constantes de tema ─────────────────────
const DARK_GREEN = '#0D1F17';

const RecipeDetailScreen: React.FC = () => {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const { recipe: recipeParam } = useLocalSearchParams<{ recipe: string }>();

  const recipe = useMemo((): Recipe | null => {
    const raw = Array.isArray(recipeParam) ? recipeParam[0] : recipeParam;
    if (!raw || typeof raw !== 'string') return null;
    try {
      return JSON.parse(raw) as Recipe;
    } catch {
      return null;
    }
  }, [recipeParam]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const syncFavoriteState = useCallback(async () => {
    if (!recipe) return;
    try {
      const favorite = await favoriteService.findMineByRecipeId(recipe.id);
      setIsFavorite(Boolean(favorite));
      setFavoriteId(favorite?.id ?? null);
    } catch {
      setIsFavorite(false);
      setFavoriteId(null);
    }
  }, [recipe]);

  useEffect(() => {
    syncFavoriteState();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, syncFavoriteState]);

  const handleToggleFavorite = async () => {
    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite && favoriteId) {
        await favoriteService.deleteMine(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
      } else if (recipe) {
        const created = await favoriteService.addMineByRecipeId(recipe.id);
        if (created) {
          setIsFavorite(true);
          setFavoriteId(created.id);
        } else {
          await syncFavoriteState();
        }
      }
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        'No se pudo actualizar favoritos.';
      Alert.alert('Ups', message);
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    if (recipeParam != null && recipe === null) {
      router.back();
    }
  }, [recipe, recipeParam, router]);

  if (!recipe) {
    return null;
  }

  return (
    <View style={[styles.root, isDark && { backgroundColor: '#0C100D' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0C100D' : '#E9F5EE'} translucent={false} />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.scrollContent}>
        <SafeAreaView edges={['top']} style={styles.topActions}>
          <TouchableOpacity style={[styles.iconButton, isDark && styles.iconButtonDark]} onPress={() => router.back()} activeOpacity={0.9}>
            <ArrowLeft size={20} color={isDark ? COLORS.white : DARK_GREEN} strokeWidth={2.8} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isDark && styles.iconButtonDark, favoriteLoading && styles.bookmarkButtonDisabled]}
            onPress={handleToggleFavorite}
            disabled={favoriteLoading}
            activeOpacity={0.85}
          >
            <Heart
              size={18}
              color={isFavorite ? COLORS.error : isDark ? COLORS.white : DARK_GREEN}
              fill={isFavorite ? COLORS.error : 'transparent'}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </SafeAreaView>

        <Animated.View style={[styles.mainWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.heroCard, isDark && styles.heroCardDark]}>
            <View style={styles.headerContent}>
              <View style={[styles.difficultyBadge, isDark && { borderColor: colors.secondary + '66', backgroundColor: colors.secondary + '22' }]}>
                <Text style={[styles.difficultyText, isDark && { color: COLORS.white }]}>{recipe.difficulty}</Text>
              </View>
              <Text style={[styles.title, isDark && { color: COLORS.white }]}>{recipe.title}</Text>
              <Text style={[styles.description, isDark && { color: COLORS.white, opacity: 0.75 }]}>{recipe.description}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statItem, isDark && styles.statItemDark]}>
              <Clock3 size={14} color={COLORS.primary} strokeWidth={2.4} />
              <Text style={[styles.statValue, isDark && { color: COLORS.white }]}>{recipe.prep_time}m</Text>
              <Text style={[styles.statLabel, isDark && { color: COLORS.white, opacity: 0.65 }]}>Preparacion</Text>
            </View>
            <View style={[styles.statItem, isDark && styles.statItemDark]}>
              <Flame size={14} color={COLORS.accent} strokeWidth={2.4} />
              <Text style={[styles.statValue, isDark && { color: COLORS.white }]}>{recipe.calories}</Text>
              <Text style={[styles.statLabel, isDark && { color: COLORS.white, opacity: 0.65 }]}>Calorias</Text>
            </View>
            <View style={[styles.statItem, isDark && styles.statItemDark]}>
              <UtensilsCrossed size={14} color={COLORS.secondary} strokeWidth={2.4} />
              <Text style={[styles.statValue, isDark && { color: COLORS.white }]}>{recipe.servings}</Text>
              <Text style={[styles.statLabel, isDark && { color: COLORS.white, opacity: 0.65 }]}>Raciones</Text>
            </View>
          </View>

          <View style={[styles.applianceCard, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '55' }]}>
            <ChefHat size={16} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={[styles.applianceText, isDark && { color: COLORS.white, opacity: 0.9 }]}>Necesitas: <Text style={styles.applianceValue}>{recipe.appliance_needed}</Text></Text>
          </View>

          <View style={styles.sectionHeader}>
            <ChefHat size={14} color={isDark ? COLORS.white : DARK_GREEN} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, isDark && { color: COLORS.white, opacity: 0.82 }]}>Instrucciones</Text>
            <View style={[styles.sectionLine, isDark && { backgroundColor: COLORS.white + '24' }]} />
          </View>

          <View style={[styles.instructionsCard, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '45' }]}>
            <Text style={[styles.instructionText, isDark && { color: COLORS.white, opacity: 0.9 }]}>{recipe.instructions}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 3 },
});
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9F5EE' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 36 },
  topActions: {
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#DCEBE2',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
  },
  iconButtonDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '55',
  },
  bookmarkButtonDisabled: {
    opacity: 0.6,
  },
  mainWrap: {
    gap: 14,
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#DCEBE2',
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  heroCardDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '55',
  },
  headerContent: {
    padding: 16,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '1C',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    marginBottom: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    color: DARK_GREEN,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: DARK_GREEN,
    opacity: 0.66,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statItem: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#DCEBE2',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    ...SHADOW_SM,
  },
  statItemDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '55',
  },
  statValue: {
    marginTop: 7,
    fontSize: 15,
    fontWeight: '800',
    color: DARK_GREEN,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: DARK_GREEN,
    opacity: 0.55,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  applianceCard: {
    borderRadius: 16,
    backgroundColor: '#DDEFE4',
    borderWidth: 1,
    borderColor: '#C5DECF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applianceText: {
    fontSize: 13,
    color: DARK_GREEN,
    opacity: 0.78,
  },
  applianceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK_GREEN,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: DARK_GREEN,
    opacity: 0.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: DARK_GREEN + '15',
  },
  instructionsCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCEBE2',
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 16,
    ...SHADOW_SM,
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 24,
    color: DARK_GREEN,
    opacity: 0.84,
  },
});

export default RecipeDetailScreen;
