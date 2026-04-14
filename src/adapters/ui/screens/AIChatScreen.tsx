import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bot, ChefHat, Clock3, Heart, Wrench } from 'lucide-react-native';
import { apiClient } from '../../external/api/apiClient';
import { COLORS } from '../../../shared/theme/colors';

type SuggestionIngredient = {
  productId: string;
  productName: string;
  quantityUsed: number;
  quantityAvailable: number;
};

type SuggestionRecipe = {
  id: string;
  title: string;
  instructions: string;
  servings: number;
  prep_time: number;
  appliance_needed: string;
  difficulty: string;
  created_at: string;
  ingredientsUsed: SuggestionIngredient[];
};

type SuggestionResponse = {
  suggestionId: string;
  recipe: SuggestionRecipe;
};

const DARK = '#0D1F17';

const AIChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionResponse | null>(null);
  const [servingsInput, setServingsInput] = useState('2');

  const requestSuggestion = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const servings = Number.parseInt(servingsInput, 10);
      if (!Number.isFinite(servings) || servings < 1) {
        throw new Error('Indica un numero valido de comensales.');
      }

      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        throw new Error('No se encontro el token de usuario.');
      }

      const response = await apiClient.post<SuggestionResponse>(
        '/households/me/recipes/suggestions',
        { servings },
        {
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuggestion(response.data);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        'No se pudo generar la receta ahora mismo.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const addRecipeToFavorites = async () => {
    if (!suggestion?.recipe.id) return;

    setIsSavingFavorite(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        throw new Error('No se encontro el token de usuario.');
      }

      await apiClient.post(
        '/user-favorites/me/from-suggestion',
        { recipeId: suggestion.recipe.id },
        {
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess('Receta anadida a favoritos.');
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        'No se pudo anadir la receta a favoritos.';
      setError(message);
    } finally {
      setIsSavingFavorite(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={DARK} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={DARK} strokeWidth={2.7} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat de recetas IA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.botBubble}>
          <Bot size={16} color={COLORS.primary} strokeWidth={2.7} />
          <Text style={styles.botBubbleText}>
            Te ayudo a crear una receta con lo que tienes en casa.
          </Text>
        </View>

        <View style={styles.userQuestionBubble}>
          <Text style={styles.userQuestionText}>Cuantos comensales son?</Text>
        </View>

        <View style={styles.servingsCard}>
          <Text style={styles.servingsLabel}>Comensales</Text>
          <View style={styles.servingsRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => {
                const current = Number.parseInt(servingsInput, 10);
                const safeCurrent = Number.isFinite(current) ? current : 1;
                setServingsInput(String(Math.max(1, safeCurrent - 1)));
              }}
              activeOpacity={0.86}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.servingsInput}
              value={servingsInput}
              onChangeText={(text) => setServingsInput(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="2"
              placeholderTextColor="#8BAA97"
            />

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => {
                const current = Number.parseInt(servingsInput, 10);
                const safeCurrent = Number.isFinite(current) ? current : 1;
                setServingsInput(String(Math.min(99, safeCurrent + 1)));
              }}
              activeOpacity={0.86}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
          onPress={requestSuggestion}
          activeOpacity={0.86}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <ChefHat size={15} color={COLORS.white} strokeWidth={2.7} />
              <Text style={styles.generateButtonText}>Pedir sugerencia</Text>
            </>
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        {suggestion ? (
          <View style={styles.recipeCard}>
            <Text style={styles.recipeBadge}>{suggestion.recipe.difficulty}</Text>
            <Text style={styles.recipeTitle}>{suggestion.recipe.title}</Text>
            <Text style={styles.recipeInstructions}>{suggestion.recipe.instructions}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Clock3 size={12} color={COLORS.primary} strokeWidth={2.4} />
                <Text style={styles.metaText}>{suggestion.recipe.prep_time} min</Text>
              </View>
              <View style={styles.metaPill}>
                <Wrench size={12} color={DARK} strokeWidth={2.4} />
                <Text style={styles.metaText}>{suggestion.recipe.appliance_needed}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Ingredientes usados</Text>
            {suggestion.recipe.ingredientsUsed?.length ? (
              suggestion.recipe.ingredientsUsed.map((ingredient) => (
                <View key={`${ingredient.productId}-${ingredient.productName}`} style={styles.ingredientRow}>
                  <Text style={styles.ingredientName}>{ingredient.productName}</Text>
                  <Text style={styles.ingredientQty}>
                    {ingredient.quantityUsed} / {ingredient.quantityAvailable}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.recipeInstructions}>Sin detalle de ingredientes.</Text>
            )}

            <TouchableOpacity
              style={[styles.favoriteButton, isSavingFavorite && styles.buttonDisabled]}
              onPress={addRecipeToFavorites}
              activeOpacity={0.86}
              disabled={isSavingFavorite}
            >
              {isSavingFavorite ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Heart size={14} color={COLORS.white} fill={COLORS.white} strokeWidth={2.4} />
                  <Text style={styles.favoriteButtonText}>Anadir a favoritos</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 10 },
  android: { elevation: 4 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9F5EE' },
  header: {
    backgroundColor: DARK,
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D7EDE0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 34,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDECE1',
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    ...SHADOW,
  },
  botBubbleText: {
    color: DARK,
    flex: 1,
    lineHeight: 20,
    fontSize: 13,
  },
  userQuestionBubble: {
    alignSelf: 'flex-end',
    backgroundColor: DARK,
    borderRadius: 14,
    borderBottomRightRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: '78%',
  },
  userQuestionText: {
    color: '#E7F3EB',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  servingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDECE1',
    padding: 12,
    ...SHADOW,
  },
  servingsLabel: {
    color: DARK,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.58,
    marginBottom: 8,
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EAF4EE',
    borderWidth: 1,
    borderColor: '#D5E6DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    color: DARK,
    fontSize: 19,
    fontWeight: '800',
    marginTop: -1,
  },
  servingsInput: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D6E7DA',
    backgroundColor: '#F7FCF8',
    textAlign: 'center',
    fontSize: 18,
    color: DARK,
    fontWeight: '800',
    paddingHorizontal: 10,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 13,
    ...SHADOW,
  },
  generateButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '700',
  },
  successText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDECE1',
    padding: 14,
    ...SHADOW,
  },
  recipeBadge: {
    alignSelf: 'flex-start',
    color: '#895313',
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent + '55',
    borderWidth: 1,
    borderRadius: 14,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  recipeTitle: {
    color: DARK,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 29,
    marginBottom: 8,
  },
  recipeInstructions: {
    color: DARK,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.82,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDEAE0',
    backgroundColor: '#F1F8F3',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaText: {
    color: DARK,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: DARK,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    opacity: 0.58,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDEAE0',
    backgroundColor: '#F7FCF8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 7,
  },
  ingredientName: {
    color: DARK,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  ingredientQty: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  favoriteButton: {
    marginTop: 12,
    backgroundColor: DARK,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  favoriteButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default AIChatScreen;
