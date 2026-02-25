import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChefHat, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../../shared/theme/colors';
import { AuthStackParamList } from '../navigation/types';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<LoginScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Círculos decorativos de fondo */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

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
          <CustomInput
            icon={Mail}
            placeholder="Tu correo"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            icon={Lock}
            placeholder="Tu contraseña"
            isPassword={true}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.forgotPass}>
            <Text style={styles.forgotText}>¿Olvidaste la clave?</Text>
          </TouchableOpacity>

          <CustomButton
            title="Entrar a la cocina"
            onPress={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}
            loading={loading}
          />
        </View>

        {/* 3. Footer conectado correctamente a la pantalla de Registro */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Nuevo por aquí? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signUpText}>Crea una cuenta</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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