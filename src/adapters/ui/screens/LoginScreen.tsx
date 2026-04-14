import { ChefHat, Lock, Mail, Sparkles } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ROUTES } from '../navigation/routes';
import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/theme/colors';
import { CustomButton } from '../components/CustomButton';
import { CustomInput } from '../components/CustomInput';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const params = useLocalSearchParams<{ reason?: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { signIn, loading, error } = useAuth();

  const authRedirectError =
    params.reason === 'user-error'
      ? 'Hay un error con tu usuario. Inicia sesion nuevamente.'
      : params.reason === 'not-logged-in'
        ? 'No estas logeado. Inicia sesion para continuar.'
        : null;

  const handleLogin = async () => {
    if (!username || !password) return;

    try {
      await signIn({ username: username.trim(), password });
    } catch (e) {
      console.log("Error de login real:", e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1F17" />

      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <ChefHat size={32} color={COLORS.white} />
              <View style={styles.sparkleTag}>
                <Sparkles size={12} color={COLORS.white} />
              </View>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.brandName}>gastromind</Text>
            <View style={styles.accentBar} />
            <Text style={styles.subtitle}>Crea recetas con inteligencia</Text>
          </View>

          <View style={styles.form}>
            {(authRedirectError || error) && (
              <Text style={styles.errorText}>{authRedirectError ?? error}</Text>
            )}
            <CustomInput
              icon={Mail}
              placeholder="Tu usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <CustomInput
              icon={Lock}
              placeholder="Tu contraseña"
              isPassword={true}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.forgotPass}>
              <Text style={styles.forgotText}>¿Olvidaste la clave?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Entrar a la cocina"
              onPress={handleLogin}
              loading={loading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Nuevo por aquí? </Text>
            <TouchableOpacity onPress={() => router.push(ROUTES.authRegister)}>
              <Text style={styles.signUpText}>Crea una cuenta</Text>
            </TouchableOpacity>
          </View>
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
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.15,
  },
  circle1: {
    width: 300, height: 300,
    backgroundColor: COLORS.primary,
    top: -50, right: -100,
  },
  circle2: {
    width: 200, height: 200,
    backgroundColor: COLORS.accent,
    bottom: -50, left: -60,
  },
  circle3: {
    width: 150, height: 150,
    backgroundColor: COLORS.secondary,
    top: height * 0.4, left: -40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 35,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 70, height: 70, borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    transform: [{ rotate: '-10deg' }],
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  sparkleTag: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: COLORS.accent,
    padding: 6, borderRadius: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandName: {
    fontSize: 40, fontWeight: '900',
    color: COLORS.text, letterSpacing: -1.5,
  },
  accentBar: {
    width: 40, height: 5,
    backgroundColor: COLORS.accent,
    borderRadius: 10, marginTop: 4,
  },
  subtitle: {
    fontSize: 15, color: COLORS.text,
    opacity: 0.6, marginTop: 10, fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  errorText: { color: '#ff4444', fontSize: 13, textAlign: 'center', marginBottom: 15, marginTop: -5, fontWeight: '600' },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 30, paddingRight: 5,
  },
  forgotText: {
    color: COLORS.text, fontSize: 14,
    fontWeight: '500', opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 15, color: COLORS.text, opacity: 0.6,
  },
  signUpText: {
    fontSize: 15, color: COLORS.accent, fontWeight: '800',
  },
});

export default LoginScreen;
