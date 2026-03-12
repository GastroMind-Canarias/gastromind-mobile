import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FridgeItem, ItemStatus } from '../../../core/domain/fridgeItem.types';
import { COLORS } from '../../../shared/theme/colors';
import { fridgeService } from '../../external/api/FridgeService';

// ─── Constantes de tema ───────────────────────────────────────────────────────
const FRIDGE_DARK = '#0D1F17';   // verde muy oscuro (panel nevera)
const FRIDGE_MID = '#1A3826';   // verde oscuro medio
const FRIDGE_PANEL = '#142D1F';   // fondo panel interior
const ICE_BLUE = '#C8F0DC';   // tinte helado suave

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ItemStatus, { color: string; emoji: string; label: string; bg: string }> = {
  [ItemStatus.GOOD]: { color: COLORS.primary, emoji: '✅', label: 'Fresco', bg: COLORS.primary + '22' },
  [ItemStatus.OPENED]: { color: COLORS.accent, emoji: '📂', label: 'Abierto', bg: COLORS.accent + '22' },
  [ItemStatus.EXPIRED]: { color: COLORS.error, emoji: '⚠️', label: 'Caducado', bg: COLORS.error + '22' },
};

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ emoji, count, label, color }: { emoji: string; count: number; label: string; color: string }) {
  return (
    <View style={[styles.statChip, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Item card ────────────────────────────────────────────────────────────────
function ItemCard({
  item, onEdit, onDelete,
}: { item: FridgeItem; onEdit: () => void; onDelete: () => void }) {
  const cfg = STATUS_CONFIG[item.status];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      {/* Accent strip */}
      <View style={[styles.cardStrip, { backgroundColor: cfg.color }]} />

      <View style={styles.cardBody}>
        {/* Row principal */}
        <View style={styles.cardTop}>
          <View style={[styles.cardIconWrap, { backgroundColor: cfg.bg }]}>
            <Text style={styles.cardIconEmoji}>{cfg.emoji}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.product}</Text>
            <Text style={styles.cardSub}>
              Cantidad: <Text style={styles.cardSubBold}>{item.quantity}</Text>
              {'   '}Cad: <Text style={styles.cardSubBold}>{item.expirationDate}</Text>
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.color + '55' }]}>
            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onEdit} onPressIn={pressIn} onPressOut={pressOut}
            style={styles.cardBtn}
          >
            <Text style={styles.cardBtnIcon}>✏️</Text>
            <Text style={[styles.cardBtnText, { color: COLORS.primary }]}>Editar</Text>
          </TouchableOpacity>
          <View style={styles.cardBtnSep} />
          <TouchableOpacity
            onPress={onDelete} onPressIn={pressIn} onPressOut={pressOut}
            style={styles.cardBtn}
          >
            <Text style={styles.cardBtnIcon}>🗑️</Text>
            <Text style={[styles.cardBtnText, { color: COLORS.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Ticket modal placeholder ─────────────────────────────────────────────────
function TicketModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sheetWrap}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>🎫 Importar desde ticket</Text>
          <View style={styles.ticketPlaceholder}>
            <Text style={styles.ticketPH_Icon}>🎫</Text>
            <Text style={styles.ticketPH_Title}>Escanea tu ticket de compra</Text>
            <Text style={styles.ticketPH_Sub}>
              Haz una foto a tu ticket y GastroMind añadirá los productos automáticamente a tu nevera.
            </Text>
            <TouchableOpacity style={styles.ticketCameraBtn} onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto.')}>
              <Text style={styles.ticketCameraBtnText}>📷  Hacer foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ticketGalleryBtn} onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto.')}>
              <Text style={styles.ticketGalleryBtnText}>🖼️  Elegir de galería</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
            <Text style={styles.sheetCloseBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────
function ItemFormModal({
  visible, editingId, productName, quantity, expDate, status,
  setProductName, setQuantity, setExpDate, setStatus,
  onSave, onClose,
}: {
  visible: boolean; editingId: string | null;
  productName: string; quantity: string; expDate: string; status: ItemStatus;
  setProductName: (v: string) => void; setQuantity: (v: string) => void;
  setExpDate: (v: string) => void; setStatus: (v: ItemStatus) => void;
  onSave: () => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sheetWrap}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{editingId ? '✏️ Editar producto' : '➕ Nuevo producto'}</Text>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.fieldInput} value={productName}
              onChangeText={setProductName} placeholder="Ej. Leche entera"
              placeholderTextColor={COLORS.text + '44'}
            />

            <Text style={styles.fieldLabel}>Cantidad</Text>
            <TextInput
              style={styles.fieldInput} keyboardType="numeric"
              value={quantity} onChangeText={setQuantity}
              placeholder="0.0" placeholderTextColor={COLORS.text + '44'}
            />

            <Text style={styles.fieldLabel}>Fecha de caducidad</Text>
            <TextInput
              style={styles.fieldInput} value={expDate}
              onChangeText={setExpDate} placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.text + '44'}
            />

            <Text style={styles.fieldLabel}>Estado</Text>
            <View style={styles.statusRow}>
              {Object.values(ItemStatus).map(s => {
                const cfg = STATUS_CONFIG[s];
                const active = status === s;
                return (
                  <TouchableOpacity
                    key={s} onPress={() => setStatus(s)}
                    style={[styles.statusOpt, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                  >
                    <Text style={styles.statusOptEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.statusOptLabel, { color: active ? COLORS.white : COLORS.text }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.formFooter}>
              <TouchableOpacity onPress={onClose} style={styles.formBtnCancel}>
                <Text style={styles.formBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSave}
                style={[styles.formBtnSave, !productName.trim() && { opacity: 0.4 }]}
                disabled={!productName.trim()}
              >
                <Text style={styles.formBtnSaveText}>💾 Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function FridgeApp() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expDate, setExpDate] = useState('2026-12-31');
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.GOOD);
  const [search, setSearch] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    refresh();
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);

  const refresh = () => setItems(fridgeService.getAll());

  const openAdd = () => {
    setEditingId(null); setProductName(''); setQuantity('');
    setExpDate('2026-12-31'); setStatus(ItemStatus.GOOD);
    setShowForm(true);
  };

  const openEdit = (item: FridgeItem) => {
    setEditingId(item.id); setProductName(item.product);
    setQuantity(item.quantity.toString()); setExpDate(item.expirationDate);
    setStatus(item.status);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!productName.trim()) return;
    const data = {
      product: productName.trim(),
      quantity: parseFloat(quantity) || 0,
      expirationDate: expDate,
      status,
      fridgeId: 'MAIN',
    };
    editingId ? fridgeService.update(editingId, data) : fridgeService.create(data);
    setShowForm(false);
    refresh();
  };

  const handleDelete = (item: FridgeItem) => {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${item.product}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { fridgeService.delete(item.id); refresh(); } },
      ]
    );
  };

  const filtered = search.trim()
    ? items.filter(i => i.product.toLowerCase().includes(search.toLowerCase()))
    : items;

  const counts = {
    good: items.filter(i => i.status === ItemStatus.GOOD).length,
    opened: items.filter(i => i.status === ItemStatus.OPENED).length,
    expired: items.filter(i => i.status === ItemStatus.EXPIRED).length,
  };

  return (
    <View style={styles.root}>

      {/* ══ FRIDGE PANEL HEADER ══ */}
      <View style={styles.fridgeHeader}>
        {/* Top bar */}
        <View style={styles.fridgeTopBar}>
          <View style={styles.fridgeTopBarLeft}>
            <View style={styles.fridgeLed} />
            <Text style={styles.fridgeHeaderLabel}>Nevera Principal</Text>
          </View>
          <View style={styles.fridgeTempBadge}>
            <Text style={styles.fridgeTempText}>4 °C</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.fridgeTitle}>Mi Nevera</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatChip emoji="✅" count={counts.good} label="Frescos" color={COLORS.primary} />
          <StatChip emoji="📂" count={counts.opened} label="Abiertos" color={COLORS.accent} />
          <StatChip emoji="⚠️" count={counts.expired} label="Caducados" color={COLORS.error} />
        </View>

        {/* Action buttons */}
        <View style={styles.headerActions}>
          {/* Ticket button */}
          <TouchableOpacity style={styles.ticketBtn} onPress={() => setShowTicket(true)}>
            <Text style={styles.ticketBtnIcon}>🎫</Text>
            <Text style={styles.ticketBtnText}>Importar ticket</Text>
          </TouchableOpacity>

          {/* Add button */}
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>＋ Añadir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══ FRIDGE BODY ══ */}
      <View style={styles.fridgeBody}>
        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor={COLORS.text + '55'}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section label */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {filtered.length === 0 ? 'Sin resultados' : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
          </Text>
          <View style={styles.sectionLine} />
        </View>

        {/* Item list */}
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🧊</Text>
              <Text style={styles.emptyTitle}>
                {search.trim() ? 'No encontrado' : 'Nevera vacía'}
              </Text>
              <Text style={styles.emptySub}>
                {search.trim()
                  ? `No hay productos con "${search}"`
                  : 'Pulsa ＋ Añadir o importa un ticket'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <ItemCard
                  item={item}
                  onEdit={() => openEdit(item)}
                  onDelete={() => handleDelete(item)}
                />
              )}
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </View>

      {/* ══ MODALS ══ */}
      <ItemFormModal
        visible={showForm}
        editingId={editingId}
        productName={productName} quantity={quantity} expDate={expDate} status={status}
        setProductName={setProductName} setQuantity={setQuantity}
        setExpDate={setExpDate} setStatus={setStatus}
        onSave={handleSave} onClose={() => setShowForm(false)}
      />
      <TicketModal visible={showTicket} onClose={() => setShowTicket(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  android: { elevation: 3 },
});
const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
  android: { elevation: 8 },
});
const SHADOW_PRIMARY = Platform.select({
  ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10 },
  android: { elevation: 10 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9F5EE' },

  // ── Fridge Header (top panel)
  fridgeHeader: {
    backgroundColor: FRIDGE_DARK,
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOW_MD,
  },
  fridgeTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  fridgeTopBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fridgeLed: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
      android: { elevation: 2 },
    }),
  },
  fridgeHeaderLabel: { color: ICE_BLUE, fontSize: 12, fontWeight: '600', letterSpacing: 1, opacity: 0.8 },
  fridgeTempBadge: {
    backgroundColor: FRIDGE_MID, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  fridgeTempText: { color: ICE_BLUE, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  fridgeTitle: {
    fontSize: 34, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -0.8, marginBottom: 18,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5,
  },
  statEmoji: { fontSize: 16, marginBottom: 2 },
  statCount: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: ICE_BLUE, opacity: 0.7, fontWeight: '600' },

  // Header action buttons
  headerActions: { flexDirection: 'row', gap: 10 },
  ticketBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13,
    backgroundColor: FRIDGE_MID,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primary + '40',
  },
  ticketBtnIcon: { fontSize: 17 },
  ticketBtnText: { color: ICE_BLUE, fontWeight: '700', fontSize: 14 },
  addBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    ...SHADOW_PRIMARY,
  },
  addBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },

  // ── Fridge body
  fridgeBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 18,
    ...SHADOW_SM,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  searchClear: { fontSize: 16, color: COLORS.text, opacity: 0.35, paddingLeft: 8 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text, opacity: 0.45, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.text + '15' },

  // ── Item card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  cardStrip: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardIconEmoji: { fontSize: 22 },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.text, opacity: 0.5, marginTop: 2 },
  cardSubBold: { fontWeight: '700', opacity: 1 },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1.2, alignSelf: 'flex-start',
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: COLORS.text + '08', marginVertical: 10 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  cardBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  cardBtnIcon: { fontSize: 14 },
  cardBtnText: { fontSize: 13, fontWeight: '700' },
  cardBtnSep: { width: 1, height: 18, backgroundColor: COLORS.text + '12' },

  // ── Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, opacity: 0.8 },
  emptySub: { fontSize: 14, color: COLORS.text, opacity: 0.45, marginTop: 6, textAlign: 'center' },

  // ── Modals / Bottom sheets
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(13,31,23,0.55)',
  },
  sheetWrap: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingTop: 10, maxHeight: '92%',
    ...SHADOW_MD,
  },
  sheetHandle: {
    alignSelf: 'center', width: 38, height: 5,
    backgroundColor: COLORS.text + '1A', borderRadius: 3, marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20, fontWeight: '800', color: COLORS.text,
    textAlign: 'center', marginBottom: 22,
  },
  sheetCloseBtn: {
    marginTop: 16, paddingVertical: 14,
    backgroundColor: COLORS.background, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.text + '15',
  },
  sheetCloseBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },

  // Ticket sheet
  ticketPlaceholder: {
    alignItems: 'center', paddingVertical: 20,
    backgroundColor: '#f4fcf6', borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.primary + '33',
    borderStyle: 'dashed', marginBottom: 8,
    paddingHorizontal: 20,
  },
  ticketPH_Icon: { fontSize: 56, marginBottom: 12 },
  ticketPH_Title: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  ticketPH_Sub: {
    fontSize: 13, color: COLORS.text, opacity: 0.55,
    textAlign: 'center', lineHeight: 19, marginBottom: 22,
  },
  ticketCameraBtn: {
    width: '100%', paddingVertical: 15, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center', marginBottom: 10,
    ...SHADOW_PRIMARY,
  },
  ticketCameraBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  ticketGalleryBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.background, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary + '44',
  },
  ticketGalleryBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },

  // Form fields
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.text,
    opacity: 0.5, marginBottom: 7, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  fieldInput: {
    backgroundColor: '#EEF8F2', borderRadius: 12,
    padding: 14, fontSize: 16, color: COLORS.text, marginBottom: 18,
  },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statusOpt: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.text + '18',
    backgroundColor: '#F4FAF6',
  },
  statusOptEmoji: { fontSize: 20, marginBottom: 4 },
  statusOptLabel: { fontSize: 11, fontWeight: '700' },
  formFooter: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  formBtnCancel: {
    flex: 1, padding: 15, borderRadius: 14,
    backgroundColor: '#EEF8F2', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.text + '12',
  },
  formBtnCancelText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
  formBtnSave: {
    flex: 2, padding: 15, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center',
    ...SHADOW_PRIMARY,
  },
  formBtnSaveText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});