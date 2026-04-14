import React, { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Check,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Ticket,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { FridgeItem, ItemStatus } from '../../../core/domain/fridgeItem.types';
import { COLORS } from '../../../shared/theme/colors';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { fridgeService } from '../../external/api/FridgeService';
import { apiClient } from '../../external/api/apiClient';
import { AppBottomSheet } from '../components/AppBottomSheet';
import { AppDialog, type AppDialogAction } from '../components/AppDialog';

// ─── Constantes de tema ───────────────────────────────────────────────────────
const FRIDGE_DARK = '#0D1F17';   // verde muy oscuro (panel nevera)
const FRIDGE_MID = '#1A3826';   // verde oscuro medio
const ICE_BLUE = '#C8F0DC';   // tinte helado suave

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ItemStatus,
  { color: string; icon: LucideIcon; label: string; bg: string }
> = {
  [ItemStatus.GOOD]: {
    color: COLORS.primary,
    icon: Check,
    label: 'Fresco',
    bg: COLORS.primary + '22',
  },
  [ItemStatus.OPENED]: {
    color: COLORS.accent,
    icon: Sparkles,
    label: 'Abierto',
    bg: COLORS.accent + '22',
  },
  [ItemStatus.EXPIRED]: {
    color: COLORS.error,
    icon: ShieldAlert,
    label: 'Caducado',
    bg: COLORS.error + '22',
  },
};

async function getUserIdFromMe(): Promise<string> {
  const response = await apiClient.get('/users/me');
  const data = response?.data;
  const id = data?.id || data?.userId || data?.user_id;
  return typeof id === 'string' ? id : '';
}

function getExpiryMeta(expirationDate: string, status: ItemStatus) {
  if (status === ItemStatus.EXPIRED) {
    return {
      label: 'Caducado',
      color: COLORS.error,
      bg: COLORS.error + '18',
      border: COLORS.error + '4D',
    };
  }

  const exp = new Date(expirationDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(days)) {
    return {
      label: 'Fecha no válida',
      color: COLORS.text,
      bg: COLORS.text + '10',
      border: COLORS.text + '22',
    };
  }

  if (days <= 2) {
    return {
      label: days <= 0 ? 'Vence hoy' : `${days} día${days === 1 ? '' : 's'}`,
      color: COLORS.accent,
      bg: COLORS.accent + '18',
      border: COLORS.accent + '4D',
    };
  }

  return {
    label: `${days} días`,
    color: COLORS.primary,
    bg: COLORS.primary + '14',
    border: COLORS.primary + '44',
  };
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({
  icon: Icon,
  count,
  label,
  color,
}: {
  icon: LucideIcon;
  count: number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statChip, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '24' }]}>
        <Icon size={13} color={color} strokeWidth={2.6} />
      </View>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Item card ────────────────────────────────────────────────────────────────
function ItemCard({
  item, onEdit, onDelete,
  isDark,
}: { item: FridgeItem; onEdit: () => void; onDelete: () => void; isDark: boolean }) {
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG[ItemStatus.GOOD];
  const StatusIcon = cfg.icon;
  const expiryMeta = getExpiryMeta(item.expirationDate, item.status);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  return (
    <Animated.View
      style={[
        styles.card,
        isDark && { backgroundColor: '#11351A', borderColor: COLORS.secondary + '55' },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={[styles.cardStrip, { backgroundColor: cfg.color }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.cardIconWrap, { backgroundColor: cfg.bg, borderColor: cfg.color + '2A' }]}> 
            <StatusIcon size={20} color={cfg.color} strokeWidth={2.6} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardTitle, isDark && { color: COLORS.white }]} numberOfLines={1}>{item.product}</Text>
            <View style={styles.cardSubRow}>
              <Text style={[styles.cardSubKey, isDark && { color: COLORS.white + 'CC' }]}>Cant.</Text>
              <Text style={[styles.cardSubValue, isDark && { color: COLORS.white }]}>{item.quantity} uds.</Text>
              <Text style={[styles.cardSubDot, isDark && { color: COLORS.white + '88' }]}>•</Text>
              <Text style={[styles.cardSubKey, isDark && { color: COLORS.white + 'CC' }]}>Cad.</Text>
              <Text style={[styles.cardSubValue, isDark && { color: COLORS.white }]}>{item.expirationDate}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.color + '55' }]}> 
            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={[styles.cardDivider, isDark && { backgroundColor: COLORS.white + '1F' }]} />

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Snowflake size={13} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={[styles.metaPillText, isDark && { color: COLORS.white }]}>{item.quantity} uds.</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: expiryMeta.bg, borderColor: expiryMeta.border }]}> 
            <StatusIcon size={13} color={expiryMeta.color} strokeWidth={2.5} />
            <Text style={[styles.metaPillText, { color: expiryMeta.color }]}>{expiryMeta.label}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onEdit} onPressIn={pressIn} onPressOut={pressOut}
            style={styles.cardBtn}
          >
            <Pencil size={14} color={COLORS.primary} strokeWidth={2.6} />
            <Text style={[styles.cardBtnText, { color: COLORS.primary }]}>Editar</Text>
          </TouchableOpacity>
          <View style={[styles.cardBtnSep, isDark && { backgroundColor: COLORS.white + '26' }]} />
          <TouchableOpacity
            onPress={onDelete} onPressIn={pressIn} onPressOut={pressOut}
            style={styles.cardBtn}
          >
            <Trash2 size={14} color={COLORS.error} strokeWidth={2.6} />
            <Text style={[styles.cardBtnText, { color: COLORS.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Ticket modal ─────────────────────────────────────────────────────────────
function TicketModal({
  visible,
  onClose,
  userId,
  onImported,
}: {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onImported: () => Promise<void>;
}) {
  const { isDark, colors } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'danger';
    actions: AppDialogAction[];
  } | null>(null);

  const closeDialog = () => setDialog(null);
  const showDialog = (config: {
    title: string;
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'danger';
    actions?: AppDialogAction[];
  }) => {
    setDialog({
      title: config.title,
      message: config.message,
      variant: config.variant,
      actions: config.actions ?? [{ label: 'Cerrar', onPress: closeDialog }],
    });
  };

  const handlePickImage = async (useCamera: boolean) => {
    try {
      if (!userId) {
        showDialog({
          title: 'Usuario no disponible',
          message: 'No pudimos identificar tu usuario. Cerrá sesión y volvé a entrar.',
          variant: 'danger',
        });
        return;
      }

      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showDialog({
            title: 'Permiso denegado',
            message: 'Necesitamos acceso a la cámara para escanear el ticket.',
            variant: 'warning',
          });
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showDialog({
            title: 'Permiso denegado',
            message: 'Necesitamos acceso a tus fotos para elegir el ticket.',
            variant: 'warning',
          });
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        if (!selected?.uri) return;

        setIsProcessing(true);

        try {
          const formData = new FormData();
          const fileName = selected.fileName || `ticket-${Date.now()}.jpg`;
          const fileType = selected.mimeType || 'image/jpeg';

          formData.append('image', {
            uri: selected.uri,
            name: fileName,
            type: fileType,
          } as any);
          formData.append('user_id', userId);

          const trimmedStoreId = storeId.trim();
          if (trimmedStoreId.length > 0) {
            formData.append('store_id', trimmedStoreId);
          }

          const response = await apiClient.post('/tickets/from-image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          await onImported();

          const createdCount =
            response?.data?.created_items_count ??
            response?.data?.items_count ??
            response?.data?.products_count ??
            response?.data?.items?.length ??
            response?.data?.products?.length;

          const successMessage =
            typeof createdCount === 'number'
              ? `Ticket procesado correctamente. Se añadieron ${createdCount} producto${createdCount === 1 ? '' : 's'} a tu nevera.`
              : 'Ticket procesado correctamente. Revisá tu nevera para ver los productos añadidos.';

          setIsProcessing(false);
          showDialog({
            title: 'Ticket procesado',
            message: successMessage,
            variant: 'success',
            actions: [
              {
                label: 'Genial',
                onPress: () => {
                  setStoreId('');
                  onClose();
                },
              },
            ],
          });

        } catch (error: any) {
          console.error('Error processing ticket:', error);
          setIsProcessing(false);
          showDialog({
            title: 'No se pudo procesar el ticket',
            message:
              error?.response?.data?.message ||
              'No pudimos leer la imagen. Probá con una foto más nítida o con mejor luz.',
            variant: 'danger',
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showDialog({
        title: 'Error',
        message: 'Hubo un problema al intentar abrir la cámara o galería.',
        variant: 'danger',
      });
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AppBottomSheet
        visible={visible}
        onClose={onClose}
        title="Importar desde ticket"
        icon={Ticket}
      >
          
          <View
            style={[
              styles.ticketPlaceholder,
              isDark && { backgroundColor: '#1A2E1F', borderColor: colors.secondary + '66' },
            ]}
          >
            {isProcessing ? (
              <View style={styles.processingWrap}>
                <View style={styles.loadingPulse}>
                   <Ticket size={40} color={COLORS.primary} strokeWidth={2} />
                </View>
                <Text style={[styles.processingTitle, isDark && { color: COLORS.white }]}>Analizando ticket...</Text>
                <Text style={[styles.processingSub, isDark && { color: COLORS.white, opacity: 0.76 }]}>Nuestra IA está extrayendo los productos y fechas de caducidad.</Text>
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
              </View>
            ) : (
              <>
                <View style={styles.ticketPH_IconWrap}>
                  <Ticket size={34} color={COLORS.primary} strokeWidth={2.4} />
                </View>
                <Text style={[styles.ticketPH_Title, isDark && { color: COLORS.white }]}>Escanea tu ticket de compra</Text>
                <Text style={[styles.ticketPH_Sub, isDark && { color: COLORS.white, opacity: 0.78 }]}>
                  Haz una foto a tu ticket y GastroMind añadirá los productos automáticamente a tu nevera.
                </Text>

                <Text style={[styles.fieldLabel, isDark && { color: COLORS.white, opacity: 0.82 }]}>Store ID (opcional)</Text>
                <TextInput
                  style={[styles.fieldInput, isDark && { color: COLORS.white, backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]}
                  value={storeId}
                  onChangeText={setStoreId}
                  placeholder="Ej. market-001"
                  placeholderTextColor={isDark ? COLORS.white + '66' : COLORS.text + '44'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                <TouchableOpacity 
                  style={styles.ticketCameraBtn} 
                  onPress={() => handlePickImage(true)}
                  activeOpacity={0.8}
                >
                  <Camera size={15} color={COLORS.white} strokeWidth={2.6} />
                  <Text style={styles.ticketCameraBtnText}>Hacer foto</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.ticketGalleryBtn, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]} 
                  onPress={() => handlePickImage(false)}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={15} color={COLORS.primary} strokeWidth={2.6} />
                  <Text style={[styles.ticketGalleryBtnText, isDark && { color: COLORS.white }]}>Elegir de galería</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {!isProcessing && (
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetCloseBtn, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]}
            >
              <Text style={[styles.sheetCloseBtnText, isDark && { color: COLORS.white }]}>Cerrar</Text>
            </TouchableOpacity>
          )}
      </AppBottomSheet>
      <AppDialog
        visible={!!dialog}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        variant={dialog?.variant}
        actions={dialog?.actions ?? [{ label: 'Cerrar', onPress: closeDialog }]}
        onClose={closeDialog}
      />
    </>
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
  const { isDark, colors } = useTheme();
  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={editingId ? 'Editar producto' : 'Nuevo producto'}
      icon={editingId ? Pencil : Plus}
    >

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={[styles.fieldLabel, isDark && { color: COLORS.white, opacity: 0.82 }]}>Nombre</Text>
            <TextInput
              style={[styles.fieldInput, isDark && { color: COLORS.white, backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]} value={productName}
              onChangeText={setProductName} placeholder="Ej. Leche entera"
              placeholderTextColor={isDark ? COLORS.white + '66' : COLORS.text + '44'}
            />

            <Text style={[styles.fieldLabel, isDark && { color: COLORS.white, opacity: 0.82 }]}>Cantidad</Text>
            <TextInput
              style={[styles.fieldInput, isDark && { color: COLORS.white, backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]} keyboardType="numeric"
              value={quantity} onChangeText={setQuantity}
              placeholder="0.0" placeholderTextColor={isDark ? COLORS.white + '66' : COLORS.text + '44'}
            />

            <Text style={[styles.fieldLabel, isDark && { color: COLORS.white, opacity: 0.82 }]}>Fecha de caducidad</Text>
            <TextInput
              style={[styles.fieldInput, isDark && { color: COLORS.white, backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]} value={expDate}
              onChangeText={setExpDate} placeholder="YYYY-MM-DD"
              placeholderTextColor={isDark ? COLORS.white + '66' : COLORS.text + '44'}
            />

            <Text style={[styles.fieldLabel, isDark && { color: COLORS.white, opacity: 0.82 }]}>Estado</Text>
            <View style={styles.statusRow}>
              {[ItemStatus.GOOD, ItemStatus.OPENED, ItemStatus.EXPIRED].map(s => {
                const cfg = STATUS_CONFIG[s] || STATUS_CONFIG[ItemStatus.GOOD];
                const active = status === s;
                return (
                  <TouchableOpacity
                    key={s} onPress={() => setStatus(s)}
                    style={[
                      styles.statusOpt,
                      isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' },
                      active && { backgroundColor: cfg.color, borderColor: cfg.color },
                    ]}
                  >
                    <cfg.icon
                      size={16}
                      color={active ? COLORS.white : cfg.color}
                      strokeWidth={2.6}
                    />
                    <Text style={[styles.statusOptLabel, { color: active ? COLORS.white : isDark ? COLORS.white : COLORS.text }]}> 
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.formFooter}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.formBtnCancel, isDark && { backgroundColor: '#11351A', borderColor: colors.secondary + '66' }]}
              >
                <Text style={[styles.formBtnCancelText, isDark && { color: COLORS.white }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSave}
                style={[styles.formBtnSave, !productName.trim() && { opacity: 0.4 }]}
                disabled={!productName.trim()}
              >
                <Text style={styles.formBtnSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
    </AppBottomSheet>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function FridgeApp() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [ticketUserId, setTicketUserId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expDate, setExpDate] = useState('2026-12-31');
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.GOOD);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | ItemStatus>('ALL');
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'danger';
    actions: AppDialogAction[];
  } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const closeDialog = () => setDialog(null);
  const showDialog = (config: {
    title: string;
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'danger';
    actions?: AppDialogAction[];
  }) => {
    setDialog({
      title: config.title,
      message: config.message,
      variant: config.variant,
      actions: config.actions ?? [{ label: 'Cerrar', onPress: closeDialog }],
    });
  };

  useEffect(() => {
    loadInitialData();
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);

  const loadInitialData = async () => {
    await refresh();
    await refreshTicketUserId();
  };

  const refreshTicketUserId = async () => {
    try {
      const id = await getUserIdFromMe();
      setTicketUserId(id);
    } catch (error) {
      console.error('Error fetching /users/me user id:', error);
      setTicketUserId('');
    }
  };

  const openTicketModal = async () => {
    if (!ticketUserId) {
      await refreshTicketUserId();
    }
    setShowTicket(true);
  };

  const refresh = async () => {
    const data = await fridgeService.getAll();
    setItems(data);
  };

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

  const handleSave = async () => {
    if (!productName.trim()) return;
    const parsedQty = parseFloat(quantity);
    const validQty = (isNaN(parsedQty) || parsedQty <= 0) ? 1 : parsedQty;
    const data = {
      product: productName.trim(),
      quantity: validQty,
      expirationDate: expDate,
      status,
      fridgeId: 'MAIN',
    };
    if (editingId) {
      await fridgeService.update(editingId, data);
    } else {
      await fridgeService.create(data);
    }
    setShowForm(false);
    refresh();
  };

  const handleDelete = (item: FridgeItem) => {
    showDialog({
      title: 'Eliminar producto',
      message: `¿Eliminar "${item.product}"?`,
      variant: 'warning',
      actions: [
        { label: 'Cancelar', tone: 'secondary', onPress: closeDialog },
        {
          label: 'Eliminar',
          tone: 'danger',
          onPress: async () => {
            closeDialog();
            await fridgeService.delete(item.id);
            refresh();
          },
        },
      ],
    });
  };

  let filtered = activeFilter === 'ALL'
    ? items
    : items.filter(i => i.status === activeFilter);
  if (search.trim()) {
    filtered = filtered.filter(i => i.product.toLowerCase().includes(search.toLowerCase()));
  }

  const counts = {
    good: items.filter(i => i.status === ItemStatus.GOOD).length,
    opened: items.filter(i => i.status === ItemStatus.OPENED).length,
    expired: items.filter(i => i.status === ItemStatus.EXPIRED).length,
  };

  return (
    <View style={[styles.root, isDark && { backgroundColor: '#0C100D' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0C100D' : FRIDGE_DARK}
        translucent={false}
      />
      <View style={styles.ambientOrbA} />
      <View style={styles.ambientOrbB} />

      {/* ══ FRIDGE PANEL HEADER ══ */}
      <View
        style={[
          styles.fridgeHeader,
          isDark && { backgroundColor: '#11351A', borderColor: COLORS.secondary + '66' },
          { paddingTop: Math.max(insets.top + 12, Platform.OS === 'ios' ? 58 : 44) },
        ]}
      >
        {/* Top bar */}
        <View style={styles.fridgeTopBar}>
          <View style={styles.fridgeTopBarLeft}>
            <View style={styles.fridgeLed} />
            <Text style={styles.fridgeHeaderLabel}>Almacen frío principal</Text>
          </View>
          <View style={styles.fridgeTempBadge}>
            <Text style={styles.fridgeTempText}>4 °C</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.fridgeTitle}>Control de almacen</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatChip icon={Check} count={counts.good} label="Frescos" color={COLORS.primary} />
          <StatChip icon={Sparkles} count={counts.opened} label="Abiertos" color={COLORS.accent} />
          <StatChip icon={ShieldAlert} count={counts.expired} label="Caducados" color={COLORS.error} />
        </View>

        {/* Action buttons */}
        <View style={styles.headerActions}>
          {/* Ticket button */}
          <TouchableOpacity style={styles.ticketBtn} onPress={openTicketModal}>
            <Ticket size={15} color={ICE_BLUE} strokeWidth={2.5} />
            <Text style={styles.ticketBtnText}>Importar ticket</Text>
          </TouchableOpacity>

          {/* Add button */}
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Plus size={15} color={COLORS.white} strokeWidth={2.9} />
            <Text style={styles.addBtnText}>Añadir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══ FRIDGE BODY ══ */}
      <View style={[styles.fridgeBody, isDark && { backgroundColor: '#0C100D' }]}>
        {/* Search bar */}
        <View style={[styles.searchWrap, isDark && { backgroundColor: '#11351A', borderColor: COLORS.secondary + '66' }]}>
          <Search size={15} color={isDark ? COLORS.white + 'B8' : COLORS.text + '88'} strokeWidth={2.6} />
          <TextInput
            style={[styles.searchInput, isDark && { color: COLORS.white }]}
            placeholder="Buscar producto..."
            placeholderTextColor={isDark ? COLORS.white + '66' : COLORS.text + '55'}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={isDark ? COLORS.white + 'B8' : COLORS.text + '88'} strokeWidth={2.8} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={{ flexGrow: 0, maxHeight: 36, marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => setActiveFilter('ALL')}
            style={[
              styles.filterPill,
              isDark && { backgroundColor: '#11351A', borderColor: COLORS.secondary + '66' },
              activeFilter === 'ALL' && styles.filterPillActive,
            ]}
          >
            <Search
              size={14}
              color={activeFilter === 'ALL' ? COLORS.white : isDark ? COLORS.white + 'CC' : COLORS.text + '99'}
              strokeWidth={2.6}
            />
            <Text
              style={[
                styles.filterPillText,
                isDark && { color: COLORS.white },
                activeFilter === 'ALL' && styles.filterPillTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          {([ItemStatus.GOOD, ItemStatus.OPENED, ItemStatus.EXPIRED] as const).map(s => {
            const cfg = STATUS_CONFIG[s] || STATUS_CONFIG[ItemStatus.GOOD];
            const FilterIcon = cfg.icon;
            const active = activeFilter === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setActiveFilter(s)}
                style={[
                  styles.filterPill,
                  isDark && { backgroundColor: '#11351A', borderColor: COLORS.secondary + '66' },
                  active && { backgroundColor: cfg.color, borderColor: cfg.color },
                ]}
              >
                <FilterIcon
                  size={14}
                  color={active ? COLORS.white : cfg.color}
                  strokeWidth={2.6}
                />
                <Text style={[styles.filterPillText, isDark && { color: COLORS.white }, active && styles.filterPillTextActive]}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Item list */}
        <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}> 
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Snowflake size={34} color={COLORS.primary} strokeWidth={2.4} />
              </View>
              <Text style={[styles.emptyTitle, isDark && { color: COLORS.white, opacity: 0.88 }]}>
                {search.trim() ? 'No encontrado' : 'Nevera vacía'}
              </Text>
              <Text style={[styles.emptySub, isDark && { color: COLORS.white, opacity: 0.72 }]}> 
                {search.trim()
                  ? `No hay productos con "${search}"`
                  : 'Pulsa Añadir o importa un ticket'}
              </Text>
            </View>
          ) : (
            <FlatList
              style={styles.list}
              data={filtered}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <ItemCard
                  item={item}
                  isDark={isDark}
                  onEdit={() => openEdit(item)}
                  onDelete={() => handleDelete(item)}
                />
              )}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(32, insets.bottom + 24) },
              ]}
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
      <TicketModal
        visible={showTicket}
        onClose={() => setShowTicket(false)}
        userId={ticketUserId}
        onImported={refresh}
      />
      <AppDialog
        visible={!!dialog}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        variant={dialog?.variant}
        actions={dialog?.actions ?? [{ label: 'Cerrar', onPress: closeDialog }]}
        onClose={closeDialog}
      />
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
  ambientOrbA: {
    position: 'absolute',
    top: -120,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.primary + '22',
  },
  ambientOrbB: {
    position: 'absolute',
    top: 120,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#BCECCE66',
  },

  // ── Fridge Header (top panel)
  fridgeHeader: {
    backgroundColor: FRIDGE_DARK,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    borderWidth: 1,
    borderColor: '#205636',
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
  fridgeHeaderLabel: { color: ICE_BLUE, fontSize: 11, fontWeight: '700', letterSpacing: 1.1, opacity: 0.82, textTransform: 'uppercase' },
  fridgeTempBadge: {
    backgroundColor: FRIDGE_MID, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  fridgeTempText: { color: ICE_BLUE, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  fridgeTitle: {
    fontSize: 32, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -0.9, marginBottom: 14,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5,
  },
  statIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
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
  ticketBtnText: { color: ICE_BLUE, fontWeight: '700', fontSize: 14 },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
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
    paddingBottom: 6,
  },

  // List
  listContainer: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 2,
  },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '16',
    ...SHADOW_SM,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  filtersRow: { gap: 8, paddingBottom: 0 },
  filterPill: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.text + '18',
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  filterPillText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: COLORS.white,
  },

  // ── Item card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDEBE2',
    ...SHADOW_SM,
  },
  cardStrip: { width: 3 },
  cardBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  cardMeta: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D3026',
    letterSpacing: -0.1,
    marginBottom: 5,
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  cardSubKey: {
    fontSize: 10,
    fontWeight: '700',
    color: '#75887E',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  cardSubValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3D5348',
  },
  cardSubDot: {
    fontSize: 12,
    color: '#9AABA2',
    marginHorizontal: 3,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1.2, alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  cardDivider: { height: 1, backgroundColor: '#E8F0EB', marginVertical: 9 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metaPill: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaPillText: {
    fontSize: 11,
    color: '#5B7065',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDF4EF',
    paddingTop: 7,
  },
  cardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  cardBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.15 },
  cardBtnSep: { width: 1, height: 14, backgroundColor: '#E3EEE7' },

  // ── Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '14',
    borderWidth: 1,
    borderColor: COLORS.primary + '34',
  },
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
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  sheetTitle: {
    fontSize: 20, fontWeight: '800', color: COLORS.text,
    textAlign: 'center',
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
  ticketPH_IconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '12',
  },
  ticketPH_Title: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  ticketPH_Sub: {
    fontSize: 13, color: COLORS.text, opacity: 0.55,
    textAlign: 'center', lineHeight: 19, marginBottom: 22,
  },
  ticketCameraBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    ...SHADOW_PRIMARY,
  },
  ticketCameraBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  ticketGalleryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1.5, borderColor: COLORS.primary + '44',
  },
  ticketGalleryBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },

  // Processing state styles
  processingWrap: {
    alignItems: 'center', paddingVertical: 40, width: '100%',
  },
  loadingPulse: {
     marginBottom: 20,
     transform: [{ scale: 1.1 }],
     opacity: 0.8,
  },
  processingTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginBottom: 8 },
  processingSub: {
    fontSize: 13, color: COLORS.text, opacity: 0.55,
    textAlign: 'center', lineHeight: 19, paddingHorizontal: 20,
  },

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
