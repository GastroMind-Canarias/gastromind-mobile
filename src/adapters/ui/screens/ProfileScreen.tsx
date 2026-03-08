import React, { useCallback, useContext, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Allergen, KitchenTool, UserProfile } from '../../../core/domain/profile.types';
import { COLORS } from '../../../shared/theme/colors';
import { profileService } from '../../external/api/ProfileService';
import { AuthContext } from '../navigation/AuthContext';

// ─── Constantes de diseño ─────────────────────────────────────────────────────
const DARK_GREEN = '#0D1F17';
const MID_GREEN = '#1A3826';
const ICE = '#C8F0DC';

// ─── Config de utensilios ─────────────────────────────────────────────────────
const TOOL_CONFIG: Record<KitchenTool, { emoji: string; label: string }> = {
    [KitchenTool.HORNO]: { emoji: '🔥', label: 'Horno' },
    [KitchenTool.MICROONDAS]: { emoji: '📡', label: 'Microondas' },
    [KitchenTool.AIR_FRYER]: { emoji: '💨', label: 'Air Fryer' },
    [KitchenTool.VITROCERAMICA]: { emoji: '⚡', label: 'Vitrocerámica' },
    [KitchenTool.ROBOT_COCINA]: { emoji: '🤖', label: 'Robot de cocina' },
    [KitchenTool.BATIDORA]: { emoji: '🌀', label: 'Batidora' },
    [KitchenTool.SARTEN]: { emoji: '🍳', label: 'Sartén' },
};

// ─── Config de alérgenos ──────────────────────────────────────────────────────
const ALLERGEN_CONFIG: Record<Allergen, { emoji: string; label: string }> = {
    [Allergen.GLUTEN]: { emoji: '🌾', label: 'Gluten' },
    [Allergen.LACTOSA]: { emoji: '🥛', label: 'Lactosa' },
    [Allergen.FRUTOS_SECOS]: { emoji: '🥜', label: 'Frutos Secos' },
    [Allergen.HUEVO]: { emoji: '🥚', label: 'Huevo' },
    [Allergen.MARISCO]: { emoji: '🦐', label: 'Marisco' },
    [Allergen.PESCADO]: { emoji: '🐟', label: 'Pescado' },
    [Allergen.SOJA]: { emoji: '🫘', label: 'Soja' },
};

// ─── Mini avatar ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 42 }: { name: string; size?: number }) {
    const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2);
    const colors = ['#4dc763', '#FF9F1C', '#5BBCFF', '#C879FF', '#FF6B6B'];
    const bg = colors[name.charCodeAt(0) % colors.length];
    return (
        <View style={[avatarStyles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
            <Text style={[avatarStyles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
    );
}
const avatarStyles = StyleSheet.create({
    wrap: { justifyContent: 'center', alignItems: 'center' },
    text: { color: '#fff', fontWeight: '800' },
});

// ─── Pill animada para utensilio ─────────────────────────────────────────────
function ToolPill({
    tool, active, onPress,
}: { tool: KitchenTool; active: boolean; onPress: () => void }) {
    const cfg = TOOL_CONFIG[tool];
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.spring(scale, { toValue: 0.90, useNativeDriver: true, speed: 80, bounciness: 0 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }),
        ]).start();
        onPress();
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={handlePress}
                style={[
                    styles.toolPill,
                    active
                        ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                        : { backgroundColor: COLORS.white, borderColor: COLORS.text + '18' },
                ]}
                activeOpacity={0.85}
            >
                <Text style={styles.toolEmoji}>{cfg.emoji}</Text>
                <Text style={[styles.toolLabel, { color: active ? COLORS.white : COLORS.text }]}>
                    {cfg.label}
                </Text>
                {active && <Text style={styles.toolCheck}>✓</Text>}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Pill animada para alérgeno ──────────────────────────────────────────────
function AllergenPill({
    allergen, active, onPress,
}: { allergen: Allergen; active: boolean; onPress: () => void }) {
    const cfg = ALLERGEN_CONFIG[allergen];
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.spring(scale, { toValue: 0.90, useNativeDriver: true, speed: 80, bounciness: 0 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }),
        ]).start();
        onPress();
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={handlePress}
                style={[
                    styles.toolPill,
                    active
                        ? { backgroundColor: COLORS.error, borderColor: COLORS.error }
                        : { backgroundColor: COLORS.white, borderColor: COLORS.text + '18' },
                ]}
                activeOpacity={0.85}
            >
                <Text style={styles.toolEmoji}>{cfg.emoji}</Text>
                <Text style={[styles.toolLabel, { color: active ? COLORS.white : COLORS.text }]}>
                    {cfg.label}
                </Text>
                {active && <Text style={styles.toolCheck}>✕</Text>}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Pill animada para alérgeno personalizado ────────────────────────────────
function CustomAllergenPill({
    allergen, onPress,
}: { allergen: string; onPress: () => void }) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.spring(scale, { toValue: 0.90, useNativeDriver: true, speed: 80, bounciness: 0 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }),
        ]).start();
        onPress();
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={handlePress}
                style={[
                    styles.toolPill,
                    { backgroundColor: COLORS.error, borderColor: COLORS.error }
                ]}
                activeOpacity={0.85}
            >
                <Text style={styles.toolEmoji}>⚠️</Text>
                <Text style={[styles.toolLabel, { color: COLORS.white }]}>
                    {allergen}
                </Text>
                <Text style={styles.toolCheck}>✕</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
    const { logout } = useContext(AuthContext);
    const [profile, setProfile] = useState<UserProfile>(profileService.get);
    const [showAddMember, setShowAdd] = useState(false);
    const [newMemberName, setNewName] = useState('');
    const [showAddAllergen, setShowAddAllergen] = useState(false);
    const [newAllergenName, setNewAllergenName] = useState('');

    const refresh = useCallback(() => setProfile(profileService.get()), []);

    const handleToggleTool = (tool: KitchenTool) => {
        profileService.toggleTool(tool);
        refresh();
    };

    const handleToggleAllergen = (allergen: Allergen) => {
        profileService.toggleAllergen(allergen);
        refresh();
    };

    const handleToggleCustomAllergen = (allergen: string) => {
        profileService.toggleCustomAllergen(allergen);
        refresh();
    };

    const handleAddCustomAllergen = () => {
        if (!newAllergenName.trim()) return;
        profileService.addCustomAllergen(newAllergenName.trim());
        setNewAllergenName('');
        setShowAddAllergen(false);
        refresh();
    };

    const handleAddMember = () => {
        if (!newMemberName.trim()) return;
        profileService.addMember(newMemberName.trim());
        setNewName('');
        setShowAdd(false);
        refresh();
    };

    const handleRemoveMember = (id: string, name: string) => {
        Alert.alert(
            'Eliminar miembro',
            `¿Eliminar a "${name}" del hogar?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => { profileService.removeMember(id); refresh(); } },
            ]
        );
    };

    const toolList = Object.values(KitchenTool);
    const activeCount = profile.kitchenTools.length;

    const allergenList = Object.values(Allergen);
    const activeAllergenCount = profile.allergens.length + profile.customAllergens.length;

    return (
        <View style={styles.root}>

            {/* ══ HEADER CARD ══ */}
            <View style={styles.profileHeader}>
                {/* Top bar */}
                <View style={styles.headerTopBar}>
                    <Text style={styles.headerEyebrow}>Mi cuenta</Text>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutIcon}>⎋</Text>
                        <Text style={styles.logoutText}>Salir</Text>
                    </TouchableOpacity>
                </View>

                {/* Avatar + info */}
                <View style={styles.profileInfo}>
                    <View style={styles.avatarRing}>
                        <Avatar name={profile.name} size={72} />
                    </View>
                    <View style={styles.profileText}>
                        <Text style={styles.profileName}>{profile.name}</Text>
                        <Text style={styles.profileEmail}>{profile.email}</Text>
                    </View>
                </View>

                {/* Quick stats */}
                <View style={styles.quickStats}>
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatNum}>{activeCount}</Text>
                        <Text style={styles.quickStatLabel}>Utensilios</Text>
                    </View>
                    <View style={styles.quickStatSep} />
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatNum}>{profile.householdMembers.length}</Text>
                        <Text style={styles.quickStatLabel}>En el hogar</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ══ UTENSILIOS ══ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🍽️ Utensilios de cocina</Text>
                        <View style={styles.sectionBadge}>
                            <Text style={styles.sectionBadgeText}>{activeCount} / {toolList.length}</Text>
                        </View>
                    </View>
                    <Text style={styles.sectionSub}>
                        Selecciona los que tienes disponibles. Se usarán para personalizar tus recetas.
                    </Text>

                    <View style={styles.toolGrid}>
                        {toolList.map(tool => (
                            <ToolPill
                                key={tool}
                                tool={tool}
                                active={profile.kitchenTools.includes(tool)}
                                onPress={() => handleToggleTool(tool)}
                            />
                        ))}
                    </View>
                </View>

                {/* ══ ALERGIAS E INTOLERANCIAS ══ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>⚠️ Alergias e intolerancias</Text>
                        <View style={[styles.sectionBadge, { backgroundColor: COLORS.error + '20', borderColor: COLORS.error + '55' }]}>
                            <Text style={[styles.sectionBadgeText, { color: COLORS.error }]}>{activeAllergenCount}</Text>
                        </View>
                    </View>
                    <Text style={styles.sectionSub}>
                        Marca los ingredientes que debes evitar.
                    </Text>

                    <View style={styles.toolGrid}>
                        {allergenList.map(allergen => (
                            <AllergenPill
                                key={allergen}
                                allergen={allergen}
                                active={profile.allergens.includes(allergen)}
                                onPress={() => handleToggleAllergen(allergen)}
                            />
                        ))}
                        {profile.customAllergens.map(allergen => (
                            <CustomAllergenPill
                                key={allergen}
                                allergen={allergen}
                                onPress={() => handleToggleCustomAllergen(allergen)}
                            />
                        ))}

                        <TouchableOpacity
                            style={[styles.toolPill, { backgroundColor: COLORS.white, borderColor: COLORS.text + '25', borderStyle: 'dashed', borderWidth: 1 }]}
                            onPress={() => setShowAddAllergen(true)}
                        >
                            <Text style={styles.toolEmoji}>➕</Text>
                            <Text style={[styles.toolLabel, { color: COLORS.text }]}>
                                Otro...
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ══ HOGAR ══ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🏠 Mi hogar</Text>
                        <TouchableOpacity style={styles.addMemberBtn} onPress={() => setShowAdd(true)}>
                            <Text style={styles.addMemberBtnText}>＋ Añadir</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSub}>
                        {profile.householdMembers.length === 1
                            ? '1 persona en el hogar'
                            : `${profile.householdMembers.length} personas en el hogar`}
                    </Text>

                    {profile.householdMembers.length === 0 ? (
                        <View style={styles.emptyMembers}>
                            <Text style={styles.emptyMembersEmoji}>🏠</Text>
                            <Text style={styles.emptyMembersText}>Aún no hay nadie en el hogar</Text>
                        </View>
                    ) : (
                        <View style={styles.memberList}>
                            {profile.householdMembers.map((member, idx) => (
                                <View key={member.id} style={[styles.memberRow, idx === 0 && { borderTopWidth: 0 }]}>
                                    <Avatar name={member.name} size={42} />
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>{member.name}</Text>
                                        <Text style={styles.memberRole}>{idx === 0 ? 'Administrador' : 'Miembro'}</Text>
                                    </View>
                                    {idx !== 0 && (
                                        <TouchableOpacity
                                            onPress={() => handleRemoveMember(member.id, member.name)}
                                            style={styles.memberDeleteBtn}
                                        >
                                            <Text style={styles.memberDeleteIcon}>✕</Text>
                                        </TouchableOpacity>
                                    )}
                                    {idx === 0 && (
                                        <View style={styles.memberOwnerBadge}>
                                            <Text style={styles.memberOwnerBadgeText}>Tú</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ══ MODAL AÑADIR MIEMBRO ══ */}
            <Modal visible={showAddMember} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
                    <Pressable style={styles.sheetWrap}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>🏠 Añadir persona al hogar</Text>

                        <Text style={styles.fieldLabel}>Nombre</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={newMemberName}
                            onChangeText={setNewName}
                            placeholder="Ej. María"
                            placeholderTextColor={COLORS.text + '44'}
                            autoFocus
                            onSubmitEditing={handleAddMember}
                            returnKeyType="done"
                        />

                        <View style={styles.sheetFooter}>
                            <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.sheetBtnCancel}>
                                <Text style={styles.sheetBtnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddMember}
                                style={[styles.sheetBtnSave, !newMemberName.trim() && { opacity: 0.4 }]}
                                disabled={!newMemberName.trim()}
                            >
                                <Text style={styles.sheetBtnSaveText}>Añadir</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ══ MODAL AÑADIR ALÉRGENO ══ */}
            <Modal visible={showAddAllergen} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setShowAddAllergen(false)}>
                    <Pressable style={styles.sheetWrap}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>⚠️ Añadir alérgeno</Text>

                        <Text style={styles.fieldLabel}>Nombre del ingrediente</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={newAllergenName}
                            onChangeText={setNewAllergenName}
                            placeholder="Ej. Cacahuete"
                            placeholderTextColor={COLORS.text + '44'}
                            autoFocus
                            onSubmitEditing={handleAddCustomAllergen}
                            returnKeyType="done"
                        />

                        <View style={styles.sheetFooter}>
                            <TouchableOpacity onPress={() => setShowAddAllergen(false)} style={styles.sheetBtnCancel}>
                                <Text style={styles.sheetBtnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddCustomAllergen}
                                style={[styles.sheetBtnSave, { backgroundColor: COLORS.error }, !newAllergenName.trim() && { opacity: 0.4 }]}
                                disabled={!newAllergenName.trim()}
                            >
                                <Text style={styles.sheetBtnSaveText}>Añadir</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const SHADOW_SM = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
    android: { elevation: 3 },
});
const SHADOW_MD = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 },
    android: { elevation: 10 },
});
const SHADOW_PRIMARY = Platform.select({
    ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10 },
    android: { elevation: 8 },
});

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#E9F5EE' },

    // ── Profile Header
    profileHeader: {
        backgroundColor: DARK_GREEN,
        paddingHorizontal: 22,
        paddingTop: Platform.OS === 'ios' ? 58 : 44,
        paddingBottom: 22,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...SHADOW_MD,
    },
    headerTopBar: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20,
    },
    headerEyebrow: { color: ICE, fontSize: 13, fontWeight: '600', letterSpacing: 0.8, opacity: 0.7 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: MID_GREEN,
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: COLORS.error + '55',
    },
    logoutIcon: { color: COLORS.error, fontSize: 14 },
    logoutText: { color: COLORS.error, fontWeight: '700', fontSize: 13 },

    profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 22 },
    avatarRing: {
        borderRadius: 42, borderWidth: 2.5, borderColor: COLORS.primary,
        padding: 2,
        ...Platform.select({
            ios: { shadowColor: COLORS.primary, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
            android: { elevation: 6 },
        }),
    },
    profileText: { flex: 1 },
    profileName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
    profileEmail: { fontSize: 13, color: ICE, opacity: 0.6, marginTop: 3 },

    quickStats: {
        flexDirection: 'row', backgroundColor: MID_GREEN,
        borderRadius: 16, padding: 16, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.primary + '30',
    },
    quickStat: { flex: 1, alignItems: 'center' },
    quickStatNum: { fontSize: 26, fontWeight: '900', color: COLORS.primary },
    quickStatLabel: { fontSize: 11, color: ICE, opacity: 0.65, marginTop: 1, fontWeight: '600' },
    quickStatSep: { width: 1, height: 32, backgroundColor: COLORS.primary + '30' },

    // ── Scroll
    scroll: { paddingHorizontal: 18, paddingTop: 22 },

    // ── Section
    section: {
        backgroundColor: COLORS.white,
        borderRadius: 22,
        padding: 18,
        marginBottom: 16,
        ...SHADOW_SM,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
    sectionBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1.2, borderColor: COLORS.primary + '55',
    },
    sectionBadgeText: { color: COLORS.primary, fontWeight: '800', fontSize: 12 },
    sectionSub: { fontSize: 12, color: COLORS.text, opacity: 0.45, marginBottom: 16, lineHeight: 17 },

    // ── Tool grid
    toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    toolPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 14, borderWidth: 1.5,
    },
    toolEmoji: { fontSize: 17 },
    toolLabel: { fontSize: 13, fontWeight: '700' },
    toolCheck: { color: COLORS.white, fontWeight: '900', fontSize: 13, marginLeft: 2 },

    // ── Member section
    addMemberBtn: {
        backgroundColor: COLORS.primary + '18',
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1.2, borderColor: COLORS.primary + '55',
    },
    addMemberBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },

    memberList: {
        borderRadius: 14, overflow: 'hidden',
        borderWidth: 1, borderColor: COLORS.text + '10',
    },
    memberRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14,
        backgroundColor: '#F8FDF9',
        borderTopWidth: 1, borderTopColor: COLORS.text + '08',
    },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    memberRole: { fontSize: 11, color: COLORS.text, opacity: 0.45, marginTop: 1 },
    memberDeleteBtn: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: COLORS.error + '15',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.error + '30',
    },
    memberDeleteIcon: { color: COLORS.error, fontSize: 12, fontWeight: '800' },
    memberOwnerBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary + '44',
    },
    memberOwnerBadgeText: { color: COLORS.primary, fontWeight: '800', fontSize: 11 },

    emptyMembers: { alignItems: 'center', paddingVertical: 24 },
    emptyMembersEmoji: { fontSize: 40, marginBottom: 8 },
    emptyMembersText: { fontSize: 14, color: COLORS.text, opacity: 0.45 },

    // ── Modal
    modalOverlay: {
        flex: 1, justifyContent: 'flex-end',
        backgroundColor: 'rgba(13,31,23,0.55)',
    },
    sheetWrap: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingTop: 10,
        ...SHADOW_MD,
    },
    sheetHandle: {
        alignSelf: 'center', width: 38, height: 5,
        backgroundColor: COLORS.text + '18', borderRadius: 3, marginBottom: 20,
    },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 22 },
    fieldLabel: {
        fontSize: 11, fontWeight: '700', color: COLORS.text,
        opacity: 0.5, marginBottom: 7, letterSpacing: 0.8, textTransform: 'uppercase',
    },
    fieldInput: {
        backgroundColor: '#EEF8F2', borderRadius: 12,
        padding: 14, fontSize: 16, color: COLORS.text, marginBottom: 24,
    },
    sheetFooter: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    sheetBtnCancel: {
        flex: 1, padding: 15, borderRadius: 14,
        backgroundColor: '#EEF8F2', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.text + '12',
    },
    sheetBtnCancelText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
    sheetBtnSave: {
        flex: 2, padding: 15, borderRadius: 14,
        backgroundColor: COLORS.primary, alignItems: 'center',
        ...SHADOW_PRIMARY,
    },
    sheetBtnSaveText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
