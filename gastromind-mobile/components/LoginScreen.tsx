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

// 1. Definimos los tipos de nuestras rutas para TypeScript
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

const COLORS = {
  text: '#0f1510',
  background: '#f1f9f4',
  primary: '#4dc763',
  secondary: '#86e998',
  accent: '#FF9F1C', 
  white: '#ffffff',
};

const PremiumLogin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 2. Inicializamos la navegación con su tipado correcto
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
          <View style={styles.inputWrapper}>
            <Mail size={20} color={COLORS.text} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tu correo"
              placeholderTextColor="#99aab5"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={20} color={COLORS.text} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tu contraseña"
              placeholderTextColor="#99aab5"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color={COLORS.accent} /> : <Eye size={20} color={COLORS.text} opacity={0.4} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPass}>
            <Text style={styles.forgotText}>¿Olvidaste la clave?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.mainButton}
            onPress={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Entrar a la cocina</Text>
            )}
          </TouchableOpacity>
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
    width: 300,
    height: 300,
    backgroundColor: COLORS.primary,
    top: -50,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.accent,
    bottom: -50,
    left: -60,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: COLORS.secondary,
    top: height * 0.4,
    left: -40,
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
    width: 70,
    height: 70,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-10deg' }],
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sparkleTag: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.accent,
    padding: 6,
    borderRadius: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.5,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    height: 65,
    borderRadius: 20, 
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8f5ed',
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 30,
    paddingRight: 5,
  },
  forgotText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.5,
  },
  mainButton: {
    backgroundColor: COLORS.primary,
    height: 65,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
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
  signUpText: {
    fontSize: 15,
    color: COLORS.accent, 
    fontWeight: '800',
  },
});

export default PremiumLogin;