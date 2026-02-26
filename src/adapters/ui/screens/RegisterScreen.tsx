import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ChefHat, Lock, Mail, Sparkles, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/theme/colors';
import { CustomButton } from '../components/CustomButton';
import { CustomInput } from '../components/CustomInput';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigationProp } from '../navigation/types';

const { height } = Dimensions.get('window');

const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<AuthNavigationProp>();

    const { signUp, loading, error: apiError } = useAuth();

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [localError, setLocalError] = useState<string | null>(null);

    const handleRegister = async () => {
        if (!form.username || !form.email || !form.password || !form.confirmPassword) {
            setLocalError('Por favor, completa todos los campos');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setLocalError('Las contraseñas no coinciden');
            return;
        }

        setLocalError(null);

        try {
            await signUp({
                username: form.username,
                email: form.email,
                password: form.password,
                role: 'ROLE_MEMBER'
            });

            Alert.alert(
                "¡Bienvenido, Chef!",
                "Tu cuenta ha sido creada con éxito. Ya puedes iniciar sesión.",
                [{ text: "Ir al Login", onPress: () => navigation.navigate('Login') }]
            );
        } catch (e) {
            console.error("Error en registro:", e);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <ArrowLeft size={24} color={COLORS.text} />
                        </TouchableOpacity>

                        <View style={styles.logoContainer}>
                            <View style={styles.iconCircle}>
                                <ChefHat size={32} color={COLORS.white} />
                                <View style={styles.sparkleTag}>
                                    <Sparkles size={12} color={COLORS.white} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.brandName}>Comencemos</Text>
                            <View style={styles.accentBar} />
                            <Text style={styles.subtitle}>Crea tu perfil en gastromind</Text>
                        </View>

                        <View style={styles.form}>
                            {/* Mostrar errores (locales o de API) */}
                            {(localError || apiError) && (
                                <Text style={styles.errorText}>{localError || apiError}</Text>
                            )}

                            <CustomInput
                                icon={User}
                                placeholder="Nombre de usuario"
                                value={form.username}
                                autoCapitalize="none"
                                onChangeText={(text) => setForm({ ...form, username: text })}
                            />

                            <CustomInput
                                icon={Mail}
                                placeholder="Correo electrónico"
                                value={form.email}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onChangeText={(text) => setForm({ ...form, email: text })}
                            />

                            <CustomInput
                                icon={Lock}
                                placeholder="Contraseña"
                                isPassword={true}
                                value={form.password}
                                autoCapitalize="none"
                                onChangeText={(text) => setForm({ ...form, password: text })}
                            />

                            <CustomInput
                                icon={Lock}
                                placeholder="Confirma tu contraseña"
                                isPassword={true}
                                value={form.confirmPassword}
                                autoCapitalize="none"
                                onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                            />

                            <CustomButton
                                title="Crear cuenta"
                                onPress={handleRegister}
                                loading={loading}
                            />
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginText}>Inicia sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 35, justifyContent: 'center', paddingTop: 60, paddingBottom: 40 },
    circle: { position: 'absolute', borderRadius: 1000, opacity: 0.15 },
    circle1: { width: 300, height: 300, backgroundColor: COLORS.accent, top: -80, right: -100 },
    circle2: { width: 250, height: 250, backgroundColor: COLORS.primary, bottom: -100, left: -80 },
    backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20 },
    logoContainer: { alignItems: 'center', marginBottom: 20, marginTop: 40 },
    iconCircle: { width: 70, height: 70, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '10deg' }], elevation: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10 },
    sparkleTag: { position: 'absolute', top: -5, left: -5, backgroundColor: COLORS.accent, padding: 6, borderRadius: 12 },
    header: { alignItems: 'center', marginBottom: 40 },
    brandName: { fontSize: 36, fontWeight: '900', color: COLORS.text, letterSpacing: -1 },
    accentBar: { width: 40, height: 5, backgroundColor: COLORS.accent, borderRadius: 10, marginTop: 4 },
    subtitle: { fontSize: 15, color: COLORS.text, opacity: 0.6, marginTop: 10, fontWeight: '500' },
    form: { width: '100%' },
    errorText: { color: '#ff4444', fontSize: 13, textAlign: 'center', marginBottom: 15, marginTop: -5, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
    footerText: { fontSize: 15, color: COLORS.text, opacity: 0.6 },
    loginText: { fontSize: 15, color: COLORS.accent, fontWeight: '800' },
});

export default RegisterScreen;