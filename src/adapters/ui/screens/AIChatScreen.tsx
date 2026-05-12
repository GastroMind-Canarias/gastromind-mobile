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
import { ArrowLeft, Bot, ChefHat, Clock3, Flame, Heart, Wrench } from 'lucide-react-native';
import { apiClient } from '../../external/api/apiClient';
import { COLORS } from '../../../shared/theme/colors';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { useNetwork } from '../../../shared/network/NetworkProvider';
import AppBanner from '../components/AppBanner';

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
  suggestionId?: string;
  suggestion_id?: string;
  recipe: SuggestionRecipe;
};

const getSuggestionId = (data: SuggestionResponse | null): string => {
  if (!data) return '';
  return data.suggestionId || data.suggestion_id || '';
};

const DARK = '#0D1F17';

const AIChatScreen: React.FC = () => {
  const { isDark, colors } = useTheme();
  const navigation = useNavigation<any>();
  const { isOnline } = useNetwork();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [isConsumingIngredients, setIsConsumingIngredients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionResponse | null>(null);
  const [favoriteAddedSuggestionId, setFavoriteAddedSuggestionId] = useState<string | null>(null);
  const [consumedSuggestionId, setConsumedSuggestionId] = useState<string | null>(null);
  const [servingsInput, setServingsInput] = useState('2');

  const requestSuggestion = async () => {
    if (!isOnline) {
      setError('Sin internet no podemos generar recetas IA ahora mismo.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const servings = Number.parseInt(servingsInput, 10);
      if (!Number.isFinite(servings) || servings < 1) {
        throw new Error('Indica un numero valido de comensales.');
      }

      const response = await apiClient.post<SuggestionResponse>(
        '/households/me/recipes/suggestions',
        { servings },
        {
          timeout: 60000,
        }
      );

      setSuggestion(response.data);
      setFavoriteAddedSuggestionId(null);
      setConsumedSuggestionId(null);
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
    if (!isOnline) {
      setError('Sin internet no se puede guardar en favoritos ahora mismo.');
      return;
    }
    const suggestionId = getSuggestionId(suggestion);
    if (!suggestionId) {
      setError('No llego suggestionId desde la receta sugerida.');
      return;
    }

    if (favoriteAddedSuggestionId === suggestionId) {
      setSuccess('Ya esta en favoritos.');
      return;
    }

    setIsSavingFavorite(true);
    setError(null);
    setSuccess(null);

    try {
      try {
        await apiClient.post('/user-favorites/me/from-suggestion', null, {
          params: { suggestionId },
        });
      } catch {
        try {
          await apiClient.post('/user-favorites/me/from-suggestion', null, {
            params: { suggestion_id: suggestionId },
          });
        } catch {
          await apiClient.post(`/user-favorites/me/from-suggestion?suggestionId=${encodeURIComponent(suggestionId)}`);
        }
      }

      setFavoriteAddedSuggestionId(suggestionId);
      setSuccess('Receta anadida a favoritos.');
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setFavoriteAddedSuggestionId(suggestionId);
        setSuccess('Ya esta en favoritos.');
        return;
      }
      const message =
        e?.response?.data?.message ||
        e?.message ||
        'No se pudo anadir la receta a favoritos.';
      setError(message);
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const consumeIngredientsFromSuggestion = async () => {
    if (!isOnline) {
      setError('Sin internet no se pueden descontar ingredientes ahora mismo.');
      return;
    }

    const ingredients = suggestion?.recipe?.ingredientsUsed || [];
    if (!ingredients.length) {
      setError('No hay ingredientes para descontar en esta receta.');
      return;
    }

    setIsConsumingIngredients(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = '/fridge-items/me/consume-from-recipe';
      const ingredientsUsed = ingredients
        .map((ingredient) => ({
          productId: String(ingredient.productId || '').trim(),
          productName: String(ingredient.productName || '').trim(),
          quantityUsed: Number(ingredient.quantityUsed),
        }))
        .filter((ingredient) => Boolean(ingredient.productId) && Number.isFinite(ingredient.quantityUsed) && ingredient.quantityUsed > 0);

      if (!ingredientsUsed.length) {
        throw new Error('No hay ingredientesUsed validos para consumir.');
      }

      const payload = { ingredientsUsed };

      await apiClient.put(endpoint, payload);

      const consumedId = getSuggestionId(suggestion);
      if (consumedId) setConsumedSuggestionId(consumedId);
      setSuccess('Ingredientes descontados de la nevera.');
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        'No se pudieron descontar los ingredientes.';
      setError(message);
    } finally {
      setIsConsumingIngredients(false);
    }
  };

  return (
    <View style={[styles.root, isDark && { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.background : DARK} />

      <View style={[styles.header, isDark && { backgroundColor: '#11351A' }]}> 
        <TouchableOpacity style={[styles.backButton, isDark && { backgroundColor: '#1A2E1F' }]} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={isDark ? COLORS.white : DARK} strokeWidth={2.7} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Asistente de recetas IA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!isOnline ? (
          <AppBanner
            variant="warning"
            title="Modo sin conexion"
            message="Puedes ver la pantalla, pero generar y guardar recetas requiere internet."
            isDark={isDark}
          />
        ) : null}

        <View style={[styles.botBubble, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]}>
          <Bot size={16} color={COLORS.primary} strokeWidth={2.7} />
          <Text style={[styles.botBubbleText, isDark && { color: COLORS.white, opacity: 0.92 }]}>
            Te ayudo a crear una receta con lo que tienes en casa.
          </Text>
        </View>

        <View style={[styles.userQuestionBubble, isDark && { backgroundColor: '#1A2E1F', borderWidth: 1, borderColor: colors.secondary + '66' }]}>
          <Text style={styles.userQuestionText}>Indica cuantos comensales necesitas</Text>
        </View>

        <View style={[styles.servingsCard, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]}>
          <Text style={[styles.servingsLabel, isDark && { color: COLORS.white, opacity: 0.76 }]}>Comensales</Text>
          <View style={styles.servingsRow}>
            <TouchableOpacity
              style={[styles.stepperButton, isDark && { backgroundColor: '#1A2E1F', borderColor: colors.secondary + '66' }]}
              onPress={() => {
                const current = Number.parseInt(servingsInput, 10);
                const safeCurrent = Number.isFinite(current) ? current : 1;
                setServingsInput(String(Math.max(1, safeCurrent - 1)));
              }}
              activeOpacity={0.86}
            >
              <Text style={[styles.stepperButtonText, isDark && { color: COLORS.white }]}>-</Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.servingsInput, isDark && { color: COLORS.white, backgroundColor: '#1A2E1F', borderColor: colors.secondary + '66' }]}
              value={servingsInput}
              onChangeText={(text) => setServingsInput(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="2"
              placeholderTextColor={isDark ? COLORS.white + '70' : '#8BAA97'}
            />

            <TouchableOpacity
              style={[styles.stepperButton, isDark && { backgroundColor: '#1A2E1F', borderColor: colors.secondary + '66' }]}
              onPress={() => {
                const current = Number.parseInt(servingsInput, 10);
                const safeCurrent = Number.isFinite(current) ? current : 1;
                setServingsInput(String(Math.min(99, safeCurrent + 1)));
              }}
              activeOpacity={0.86}
            >
              <Text style={[styles.stepperButtonText, isDark && { color: COLORS.white }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, (isGenerating || !isOnline) && styles.buttonDisabled]}
          onPress={requestSuggestion}
          activeOpacity={0.86}
          disabled={isGenerating || !isOnline}
          accessibilityState={{ disabled: isGenerating || !isOnline }}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <ChefHat size={15} color={COLORS.white} strokeWidth={2.7} />
               <Text style={styles.generateButtonText}>Generar receta</Text>
            </>
          )}
        </TouchableOpacity>

        {error ? (
          <AppBanner
            variant="error"
            title="No se pudo completar la accion"
            message={error}
            isDark={isDark}
            onClose={() => setError(null)}
          />
        ) : null}
        {success ? (
          <AppBanner
            variant="success"
            title="Listo"
            message={success}
            isDark={isDark}
            onClose={() => setSuccess(null)}
          />
        ) : null}

        {suggestion ? (
          <View style={[styles.recipeCard, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]}> 
            <View style={[styles.recipeHero, isDark && { backgroundColor: '#1A2E1F', borderColor: colors.secondary + '66' }]}> 
              <View style={styles.recipeHeroHeader}>
                <Text style={styles.recipeBadge}>{suggestion.recipe.difficulty}</Text>
                <View style={styles.scorePill}>
                  <Flame size={12} color="#A34511" strokeWidth={2.6} />
                  <Text style={styles.scorePillText}>IA Pick</Text>
                </View>
              </View>
              <Text style={[styles.recipeTitle, isDark && { color: COLORS.white }]}>{suggestion.recipe.title}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.metaPill, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]}>
                  <Clock3 size={12} color={COLORS.primary} strokeWidth={2.4} />
                  <Text style={[styles.metaText, isDark && { color: COLORS.white }]}>{suggestion.recipe.prep_time} min</Text>
                </View>
                <View style={[styles.metaPill, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]}>
                  <Wrench size={12} color={isDark ? COLORS.white : DARK} strokeWidth={2.4} />
                  <Text style={[styles.metaText, isDark && { color: COLORS.white }]}>{suggestion.recipe.appliance_needed}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsRowTop}>
              <TouchableOpacity
                style={[
                  styles.consumeButton,
                  (isConsumingIngredients || consumedSuggestionId === getSuggestionId(suggestion)) && styles.buttonDisabled,
                  consumedSuggestionId === getSuggestionId(suggestion) && styles.consumeButtonDone,
                ]}
                onPress={consumeIngredientsFromSuggestion}
                activeOpacity={0.86}
                disabled={isConsumingIngredients || !isOnline || consumedSuggestionId === getSuggestionId(suggestion)}
                accessibilityState={{ disabled: isConsumingIngredients || !isOnline || consumedSuggestionId === getSuggestionId(suggestion) }}
              >
                {isConsumingIngredients ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <ChefHat size={14} color={COLORS.white} strokeWidth={2.4} />
                    <Text style={styles.favoriteButtonText}>
                      {consumedSuggestionId === getSuggestionId(suggestion) ? 'Ingredientes consumidos' : 'Consumir ingredientes'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  (isSavingFavorite || favoriteAddedSuggestionId === getSuggestionId(suggestion)) && styles.buttonDisabled,
                  favoriteAddedSuggestionId === getSuggestionId(suggestion) && styles.favoriteButtonDone,
                ]}
                onPress={addRecipeToFavorites}
                activeOpacity={0.86}
                disabled={isSavingFavorite || !isOnline || favoriteAddedSuggestionId === getSuggestionId(suggestion)}
                accessibilityState={{ disabled: isSavingFavorite || !isOnline || favoriteAddedSuggestionId === getSuggestionId(suggestion) }}
              >
                {isSavingFavorite ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Heart size={14} color={COLORS.white} fill={COLORS.white} strokeWidth={2.4} />
                    <Text style={styles.favoriteButtonText}>
                      {favoriteAddedSuggestionId === getSuggestionId(suggestion) ? 'Ya en favoritos' : 'Anadir a favoritos'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.recipeInstructions, isDark && { color: COLORS.white, opacity: 0.86 }]}>{suggestion.recipe.instructions}</Text>

            <View style={[styles.ingredientsPanel, isDark && { backgroundColor: '#1A2E1F', borderColor: colors.secondary + '66' }]}>
              <Text style={[styles.sectionTitle, isDark && { color: COLORS.white, opacity: 0.8 }]}>Ingredientes usados</Text>
              {suggestion.recipe.ingredientsUsed?.length ? (
                suggestion.recipe.ingredientsUsed.map((ingredient) => (
                  <View key={`${ingredient.productId}-${ingredient.productName}`} style={[styles.ingredientRow, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]}>
                    <Text style={[styles.ingredientName, isDark && { color: COLORS.white }]}>{ingredient.productName}</Text>
                    <Text style={styles.ingredientQty}>
                      {ingredient.quantityUsed} / {ingredient.quantityAvailable}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.recipeInstructions, isDark && { color: COLORS.white, opacity: 0.82 }]}>Sin detalle de ingredientes.</Text>
              )}
            </View>

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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DDECE1',
    padding: 14,
    ...SHADOW,
  },
  recipeHero: {
    backgroundColor: '#F0FAF4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7EBDC',
    padding: 12,
    marginBottom: 12,
  },
  recipeHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E8C9A0',
    backgroundColor: '#FFF2DE',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scorePillText: {
    color: '#A34511',
    fontSize: 11,
    fontWeight: '800',
  },
  recipeTitle: {
    color: DARK,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 29,
    marginBottom: 4,
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
  ingredientsPanel: {
    backgroundColor: '#F4FBF7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDEAE0',
    padding: 10,
    marginBottom: 4,
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
    marginTop: 0,
    backgroundColor: DARK,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    minHeight: 46,
  },
  consumeButton: {
    marginTop: 0,
    backgroundColor: '#1E7A4E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    minHeight: 46,
  },
  favoriteButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionsRowTop: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  favoriteButtonDone: {
    backgroundColor: '#2C5A45',
  },
  consumeButtonDone: {
    backgroundColor: '#2F6F57',
  },
});

export default AIChatScreen;
