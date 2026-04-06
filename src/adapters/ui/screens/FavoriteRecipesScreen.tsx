import { pushRecipeDetail } from '../navigation/routes';
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { ChefHat, Clock3, Flame, Heart } from 'lucide-react-native';
import { Recipe } from '../../../core/domain/recipe.types';
import { COLORS } from '../../../shared/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Constantes de tema (idénticas al resto de pantallas) ─────────────────────
const DARK_GREEN = '#0D1F17';
const MID_GREEN = '#1A3826';
const ICE = '#C8F0DC';

// ─── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Ensalada César con Pollo',
    instructions: 'Mezcla la lechuga con la salsa César, añade crutones, queso parmesano y tiras de pollo a la plancha.',
    servings: 2,
    prep_time: 15,
    appliance_needed: 'Sartén',
    difficulty: 'Fácil',
    description: 'Una ensalada clásica, fresca y perfecta para una cena ligera.',
    calories: 350,
    image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=400',
    created_at: '2026-03-08T10:00:00Z',
  },
  {
    id: '2',
    title: 'Salmón al Horno con Espárragos',
    instructions: 'Condimenta el salmón con limón y eneldo. Hornea junto a los espárragos a 200°C por 15 min.',
    servings: 2,
    prep_time: 25,
    appliance_needed: 'Horno',
    difficulty: 'Media',
    description: 'Plato saludable, alto en proteínas y omega 3, ideal para comer rápido y sano.',
    calories: 420,
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400',
    created_at: '2026-03-07T12:30:00Z',
  },
  {
    id: '3',
    title: 'Smoothie de Frutos Rojos',
    instructions: 'Licúa fresas, arándanos, plátano, espinaca y leche de almendras hasta obtener consistencia suave.',
    servings: 1,
    prep_time: 5,
    appliance_needed: 'Licuadora',
    difficulty: 'Fácil',
    description: 'Carga de energía por la mañana, lleno de antioxidantes.',
    calories: 210,
    image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=400',
    created_at: '2026-03-05T08:15:00Z',
  },
  {
    id: '4',
    title: 'Pasta al Pesto con Tomates Cherry',
    instructions: 'Hierve la pasta. Encurte los tomates cherry y mézclalos con pesto fresco y queso parmesano.',
    servings: 3,
    prep_time: 20,
    appliance_needed: 'Olla',
    difficulty: 'Media',
    description: 'Un manjar italiano sencillo, muy aromático y con un gran sabor a albahaca.',
    calories: 550,
    image_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=400',
    created_at: '2026-03-06T19:00:00Z',
  }
];

// ─── Componente Tarjeta de Receta ─────────────────────────────────────────────
const RecipeCard: React.FC<{ recipe: Recipe; onPress: () => void }> = ({ recipe, onPress }) => {
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

        {/* Decorativo de guardado */}
        <View style={styles.bookmarkBadge}>
          <Heart size={16} color={COLORS.error} fill={COLORS.error} strokeWidth={2.3} />
        </View>

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
  const insets = useSafeAreaInsets();
  const [recipes] = useState<Recipe[]>(MOCK_RECIPES);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.root}>
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
            <Text style={styles.greetingSub}>{recipes.length} guardadas</Text>
          </View>
        </View>
      </View>

      {/* ══ BODY ══ */}
      <Animated.View style={[{ flex: 1, paddingBottom: insets.bottom + 100 }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Platos Guardados</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.listContainer}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onPress={() => pushRecipeDetail(recipe)}
              />
            ))}
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

  // ── Scroll body
  scroll: { paddingHorizontal: 18, paddingTop: 20 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: DARK_GREEN, opacity: 0.5, letterSpacing: 0.9, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1, backgroundColor: DARK_GREEN + '15' },

  listContainer: {
    gap: 16,
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
