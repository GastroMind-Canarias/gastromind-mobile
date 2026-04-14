import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, ChefHat, Clock3, Flame, Heart, UtensilsCrossed } from 'lucide-react-native';
import { AppStackParamList } from '../navigation/types';
import { COLORS } from '../../../shared/theme/colors';
import { favoriteService } from '../../external/api/FavoriteService';

// ─── Constantes de tema ─────────────────────
const DARK_GREEN = '#0D1F17';
const MID_GREEN = '#1A3826';
const ICE = '#C8F0DC';

type RecipeDetailRouteProp = RouteProp<AppStackParamList, 'RecipeDetail'>;

const RecipeDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RecipeDetailRouteProp>();
  const { recipe } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const syncFavoriteState = useCallback(async () => {
    try {
      const favorite = await favoriteService.findMineByRecipeId(recipe.id);
      setIsFavorite(Boolean(favorite));
      setFavoriteId(favorite?.id ?? null);
    } catch {
      setIsFavorite(false);
      setFavoriteId(null);
    }
  }, [recipe.id]);

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
      } else {
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

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* HERO IMAGE */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.image_url }} style={styles.heroImage} />
          
          {/* OVERLAY & BACK BUTTON */}
          <SafeAreaView edges={['top']} style={styles.backButtonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color={DARK_GREEN} strokeWidth={2.8} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bookmarkButton, favoriteLoading && styles.bookmarkButtonDisabled]}
              onPress={handleToggleFavorite}
              disabled={favoriteLoading}
              activeOpacity={0.85}
            >
              <Heart
                size={18}
                color={isFavorite ? COLORS.error : DARK_GREEN}
                fill={isFavorite ? COLORS.error : 'transparent'}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </SafeAreaView>
          
          <View style={styles.imageOverlay} />
        </View>

        {/* CONTENT */}
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          <View style={styles.titleRow}>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
            </View>
            <Text style={styles.title}>{recipe.title}</Text>
          </View>
          
          <Text style={styles.description}>{recipe.description}</Text>

          {/* STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Clock3 size={18} color={COLORS.primary} strokeWidth={2.6} />
              <Text style={styles.statValue}>{recipe.prep_time}m</Text>
              <Text style={styles.statLabel}>Preparación</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Flame size={18} color={COLORS.accent} strokeWidth={2.6} />
              <Text style={styles.statValue}>{recipe.calories}</Text>
              <Text style={styles.statLabel}>Calorías</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <UtensilsCrossed size={18} color={COLORS.text} strokeWidth={2.6} />
              <Text style={styles.statValue}>{recipe.servings}</Text>
              <Text style={styles.statLabel}>Raciones</Text>
            </View>
          </View>

          <View style={styles.infoPillContainer}>
            <View style={styles.infoPill}>
              <ChefHat size={14} color={COLORS.primary} strokeWidth={2.6} />
              <Text style={styles.infoPillText}>Necesitas: <Text style={{ fontWeight: '800' }}>{recipe.appliance_needed}</Text></Text>
            </View>
          </View>

          {/* INSTRUCTIONS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ChefHat size={14} color={DARK_GREEN} strokeWidth={2.6} />
              <Text style={styles.sectionTitle}>Instrucciones</Text>
              <View style={styles.sectionLine} />
            </View>
            
            <View style={styles.instructionCard}>
              <Text style={styles.instructionText}>
                {recipe.instructions}
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
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
const SHADOW_PRIMARY = Platform.select({
  ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10 },
  android: { elevation: 8 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9F5EE' },
  
  // Hero Image
  imageContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#D1E6DA',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,31,23,0.15)',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButton: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
    ...SHADOW_SM,
  },
  bookmarkButton: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
    ...SHADOW_SM,
  },
  bookmarkButtonDisabled: {
    opacity: 0.6,
  },

  // Content
  contentContainer: {
    flex: 1,
    backgroundColor: '#E9F5EE',
    marginTop: -32,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  titleRow: {
    marginBottom: 12,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.primary + '55',
    marginBottom: 8,
  },
  difficultyText: {
    color: COLORS.primary, fontWeight: '800', fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  title: {
    fontSize: 28, fontWeight: '900',
    color: DARK_GREEN, letterSpacing: -0.5,
    lineHeight: 34,
  },
  description: {
    fontSize: 15, color: DARK_GREEN, opacity: 0.65,
    lineHeight: 22, marginBottom: 24,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20, paddingVertical: 16,
    marginBottom: 20,
    ...SHADOW_SM,
  },
  statBox: {
    flex: 1, alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '900', color: DARK_GREEN },
  statLabel: { fontSize: 11, color: DARK_GREEN, opacity: 0.5, fontWeight: '600', marginTop: 2 },
  statDivider: {
    width: 1, height: '80%',
    backgroundColor: DARK_GREEN + '10',
    alignSelf: 'center',
  },

  infoPillContainer: { flexDirection: 'row', marginBottom: 32 },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#D7EDE0', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  infoPillText: { fontSize: 13, color: DARK_GREEN, opacity: 0.8 },

  // Instructions
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: DARK_GREEN, opacity: 0.5, letterSpacing: 0.9, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1, backgroundColor: DARK_GREEN + '15' },

  instructionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24, padding: 20,
    ...SHADOW_SM,
  },
  instructionText: {
    fontSize: 15, lineHeight: 24, color: DARK_GREEN, opacity: 0.85,
  },
});

export default RecipeDetailScreen;
