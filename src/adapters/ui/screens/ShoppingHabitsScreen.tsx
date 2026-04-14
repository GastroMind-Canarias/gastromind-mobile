import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, CircleAlert, ReceiptText, Store } from 'lucide-react-native';
import { COLORS } from '../../../shared/theme/colors';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import {
  HabitualItemStatus,
  ShoppingHabitsSummary,
  shoppingHabitsService,
} from '../../external/api/ShoppingHabitsService';

const DARK = '#0D1F17';

const money = (value: number): string => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `${(value || 0).toFixed(2)} EUR`;
  }
};

const qty = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
};

function HabitItemCard({ item, isDark }: { item: HabitualItemStatus; isDark: boolean }) {
  return (
    <View style={[styles.itemCard, isDark && { backgroundColor: '#11351A', borderColor: COLORS.secondary + '66' }]}>
      <View style={styles.itemTop}>
        <Text style={[styles.itemName, isDark && { color: COLORS.white }]}>{item.productName}</Text>
        <View style={[styles.badge, item.hasEnough ? styles.badgeOk : styles.badgeMissing]}>
          {item.hasEnough ? (
            <CheckCircle2 size={12} color={COLORS.primary} strokeWidth={2.8} />
          ) : (
            <CircleAlert size={12} color={COLORS.error} strokeWidth={2.8} />
          )}
          <Text style={[styles.badgeText, item.hasEnough ? styles.badgeTextOk : styles.badgeTextMissing]}>
            {item.hasEnough ? 'Completo' : `Faltan ${qty(item.missingQuantity)}`}
          </Text>
        </View>
      </View>

      <View style={styles.itemMetaRow}>
        <Text style={[styles.itemMeta, isDark && { color: COLORS.white, opacity: 0.8 }]}>Habitual: {qty(item.targetQuantity)}</Text>
        <Text style={[styles.itemMeta, isDark && { color: COLORS.white, opacity: 0.8 }]}>En nevera: {qty(item.currentQuantity)}</Text>
      </View>
    </View>
  );
}

export default function ShoppingHabitsScreen() {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ShoppingHabitsSummary>({
    habitualItems: [],
    totalSpentThisMonth: 0,
    topStoreName: 'Sin datos',
    topStoreVisits: 0,
  });

  const missingCount = useMemo(
    () => summary.habitualItems.filter((item) => !item.hasEnough).length,
    [summary.habitualItems]
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await shoppingHabitsService.getSummary();
      setSummary(data);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        'No pudimos cargar tu compra habitual ahora mismo.';
      setError(message);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await load();
      setLoading(false);
    };
    run();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: isDark ? colors.background : '#EDF6F0' }]}
      edges={['top']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.background : DARK} />

        <View style={[styles.header, isDark && { backgroundColor: colors.forest }]}> 
        <Text style={styles.headerEyebrow}>Compra inteligente</Text>
        <Text style={styles.headerTitle}>Compras habituales</Text>
        <Text style={styles.headerSub}>
          Te mostramos lo que ya tenes y lo que te falta de tu compra tipo.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando resumen...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, isDark && { backgroundColor: colors.surface, borderColor: colors.secondary + '55' }]}>
              <View style={styles.metricIconWrap}>
                <ReceiptText size={16} color={COLORS.primary} strokeWidth={2.6} />
              </View>
              <Text style={[styles.metricLabel, isDark && { color: COLORS.white, opacity: 0.75 }]}>Gastado este mes</Text>
              <Text style={[styles.metricValue, isDark && { color: COLORS.white }]}>{money(summary.totalSpentThisMonth)}</Text>
            </View>

            <View style={[styles.metricCard, isDark && { backgroundColor: colors.surface, borderColor: colors.secondary + '55' }]}> 
              <View style={styles.metricIconWrap}>
                <Store size={16} color={COLORS.primary} strokeWidth={2.6} />
              </View>
              <Text style={[styles.metricLabel, isDark && { color: COLORS.white, opacity: 0.75 }]}>Supermercado top</Text>
              <Text style={[styles.metricValueSmall, isDark && { color: COLORS.white }]}>{summary.topStoreName}</Text>
              <Text style={[styles.metricHint, isDark && { color: COLORS.white, opacity: 0.75 }]}>{summary.topStoreVisits} compras este mes</Text>
            </View>
          </View>

          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, isDark && { color: COLORS.white }]}>Checklist habitual</Text>
            <Text style={styles.sectionPill}>{missingCount} pendientes</Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {summary.habitualItems.length === 0 ? (
            <View style={[styles.emptyCard, isDark && { backgroundColor: colors.surface, borderColor: colors.secondary + '66' }]}> 
              <Text style={[styles.emptyTitle, isDark && { color: COLORS.white }]}>Todavía no hay compra habitual configurada</Text>
              <Text style={[styles.emptySub, isDark && { color: COLORS.white, opacity: 0.75 }]}> 
                Cuando el backend tenga registros en compra habitual, acá vas a ver qué te falta.
              </Text>
            </View>
          ) : (
            summary.habitualItems.map((item) => <HabitItemCard key={item.id} item={item} isDark={isDark} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDF6F0' },
  header: {
    backgroundColor: DARK,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerEyebrow: {
    color: '#9FD7B2',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    fontWeight: '800',
    marginBottom: 6,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSub: {
    color: '#D5EBDD',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCECE1',
    backgroundColor: COLORS.white,
    padding: 12,
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#ECF8EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    color: COLORS.text,
    opacity: 0.58,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: DARK,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 6,
  },
  metricValueSmall: {
    color: DARK,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  metricHint: {
    color: COLORS.text,
    opacity: 0.6,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  sectionHead: {
    marginTop: 6,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionPill: {
    color: '#8A5A17',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: COLORS.accent + '2B',
    borderColor: COLORS.accent + '55',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  itemCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DDECE2',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemName: {
    flex: 1,
    color: DARK,
    fontSize: 15,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeOk: {
    backgroundColor: '#E9F8EE',
    borderColor: '#B7E8C5',
  },
  badgeMissing: {
    backgroundColor: '#FFF0F0',
    borderColor: '#F8CACA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextOk: {
    color: '#1F8B3F',
  },
  badgeTextMissing: {
    color: '#B33E3E',
  },
  itemMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemMeta: {
    color: COLORS.text,
    opacity: 0.72,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9DED1',
    backgroundColor: '#F6FBF8',
    padding: 14,
  },
  emptyTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    color: COLORS.text,
    opacity: 0.68,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
});
