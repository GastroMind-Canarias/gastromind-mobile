import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ChefHat, Eye, EyeOff, Lock, Sparkles, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthNavigationProp } from '../navigation/types';
import { COLORS } from '../../../shared/theme/colors';
import { CustomButton } from '../components/CustomButton';
import { CustomInput } from '../components/CustomInput';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<AuthNavigationProp>();

    const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = () => {
        if (!form.username || !form.password || !form.confirmPassword) {
            setError('Por favor, completa todos los campos');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setError(null);
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Círculos de fondo */}
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />

            {/* Envolvemos todo en SafeAreaView */}
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
                        {/* Ahora este botón siempre estará en zona segura */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <ArrowLeft size={24} color={COLORS.text} />
                        </TouchableOpacity>

                        {/* Logo / Icono Superior */}
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
                            <CustomInput
                                icon={User}
                                placeholder="Nombre de usuario"
                                value={form.username}
                                autoCapitalize="none"
                                onChangeText={(text) => setForm({ ...form, username: text })}
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
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 35,
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 40,
    },
    circle: {
        position: 'absolute',
        borderRadius: 1000,
        opacity: 0.15,
    },
    circle1: {
        width: 300,
        height: 300,
        backgroundColor: COLORS.accent,
        top: -80,
        right: -100,
    },
    circle2: {
        width: 250,
        height: 250,
        backgroundColor: COLORS.primary,
        bottom: -100,
        left: -80,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 40,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '10deg' }],
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    sparkleTag: {
        position: 'absolute',
        top: -5,
        left: -5,
        backgroundColor: COLORS.accent,
        padding: 6,
        borderRadius: 12,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    brandName: {
        fontSize: 36,
        fontWeight: '900',
        color: COLORS.text,
        letterSpacing: -1,
    },
    accentBar: {
        width: 40,
        height: 5,
        backgroundColor: COLORS.accent,
        borderRadius: 10,
        marginTop: 4,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.text,
        opacity: 0.6,
        marginTop: 10,
        fontWeight: '500',
    },
    form: {
        width: '100%',
    },
    errorText: {
        color: COLORS.error,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 15,
        marginTop: -5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
    },
    footerText: {
        fontSize: 15,
        color: COLORS.text,
        opacity: 0.6,
    },
    loginText: {
        fontSize: 15,
        color: COLORS.accent,
        fontWeight: '800',
    },
});

export default RegisterScreen;