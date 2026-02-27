import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import { FridgeItem, ItemStatus } from '../../../core/domain/fridgeItem.types';
import { COLORS } from "../../../shared/theme/colors";
import { fridgeService } from '../../external/api/FridgeService';

export default function FridgeApp() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.GOOD);

  useEffect(() => { refresh(); }, []);
  const refresh = () => setItems(fridgeService.getAll());

  const handleOpenModal = (item?: FridgeItem) => {
    if (item) {
      setEditingId(item.id);
      setProductName(item.product);
      setQuantity(item.quantity.toString());
      setStatus(item.status);
    } else {
      setEditingId(null);
      setProductName('');
      setQuantity('');
      setStatus(ItemStatus.GOOD);
    }
    setIsModalVisible(true);
  };

  const handleSave = () => {
    const data = {
      product: productName,
      quantity: parseFloat(quantity) || 0,
      expirationDate: '2026-12-31',
      status: status,
      fridgeId: 'MAIN'
    };
    editingId ? fridgeService.update(editingId, data) : fridgeService.create(data);
    setIsModalVisible(false);
    refresh();
  };

  const renderItem = ({ item }: { item: FridgeItem }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.product}</Text>
        <Text style={styles.cardSub}>Cantidad: {item.quantity}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.btnAction, { backgroundColor: COLORS.secondary + '40' }]} 
          onPress={() => handleOpenModal(item)}
        >
          <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btnAction, { backgroundColor: COLORS.error + '20', marginTop: 8 }]} 
          onPress={() => {
            Alert.alert("Eliminar", "¿Borrar este item?", [
              { text: "No" },
              { text: "Sí", onPress: () => { fridgeService.delete(item.id); refresh(); } }
            ]);
          }}
        >
          <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>Borrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Nevera</Text>
        <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar' : 'Nuevo'}</Text>
            
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={productName} onChangeText={setProductName} placeholder="Ej. Leche" />
            
            <Text style={styles.label}>Cantidad</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={quantity} onChangeText={setQuantity} placeholder="0.0" />

            <View style={styles.statusRow}>
              {Object.values(ItemStatus).map(s => (
                <TouchableOpacity 
                  key={s} 
                  onPress={() => setStatus(s)}
                  style={[styles.statusOpt, status === s && { backgroundColor: COLORS.primary }]}
                >
                  <Text style={[styles.statusOptText, { color: status === s ? COLORS.white : COLORS.text }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.btnCancel}>
                <Text style={{ color: COLORS.text, fontWeight: '600' }}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.btnSave}>
                <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStatusColor = (s: ItemStatus) => {
  if (s === ItemStatus.GOOD) return COLORS.primary;
  if (s === ItemStatus.OPENED) return COLORS.accent;
  return COLORS.error;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
  fab: { 
    backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: 28, 
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 }, android: { elevation: 6 } })
  },
  fabText: { color: COLORS.white, fontSize: 30 },

  card: { 
    backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 15, 
    flexDirection: 'row', alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 3 } })
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 19, fontWeight: 'bold', color: COLORS.text },
  cardSub: { color: COLORS.text, opacity: 0.6, fontSize: 15, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 10 },
  statusText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },

  cardActions: { marginLeft: 10 },
  btnAction: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, minWidth: 85, alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 21, 16, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.white, width: '88%', borderRadius: 24, padding: 25, elevation: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, opacity: 0.7 },
  input: { backgroundColor: COLORS.background, padding: 15, borderRadius: 12, marginBottom: 20, color: COLORS.text, fontSize: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statusOpt: { flex: 0.3, padding: 12, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center' },
  statusOptText: { fontSize: 10, fontWeight: 'bold' },

  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnCancel: { padding: 15 },
  btnSave: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15, elevation: 2 }
});