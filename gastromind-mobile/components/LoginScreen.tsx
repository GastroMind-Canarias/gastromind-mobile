import React, { useState } from 'react';
import {
    ColorValue,
    KeyboardAvoidingView,
    Platform,
    Pressable, // Usamos Pressable para animaciones personalizadas
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

// --- Interfaces ---
interface ThemeColors {
  text: ColorValue;
  background: ColorValue;
  primary: ColorValue;
  secondary: ColorValue;
  accent: ColorValue;
  placeholder: string;
  inputBg: ColorValue;
}

const LoginScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const buttonScale = useSharedValue(1);

  const theme: ThemeColors = {
    text: isDarkMode ? '#eaf0eb' : '#0f1510',
    background: isDarkMode ? '#060e09' : '#f1f9f4',
    primary: isDarkMode ? '#38b24f' : '#4dc763',
    secondary: isDarkMode ? '#167928' : '#86e998',
    accent: isDarkMode ? '#0dbf2e' : '#40f261',
    placeholder: isDarkMode ? '#5a6b5d' : '#a0b0a5',
    inputBg: isDarkMode ? '#121c15' : '#ffffff',
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => (buttonScale.value = withSpring(0.95));
  const handlePressOut = () => (buttonScale.value = withSpring(1));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animated.View 
          entering={FadeInDown.duration(800).delay(200)}
          style={styles.header}
        >
          <Text style={[styles.title, { color: theme.text }]}>Bienvenido a Gastromind</Text>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
            Inicia sesión para continuar
          </Text>
        </Animated.View>

        <View style={styles.form}>
          <Animated.View 
            entering={FadeInUp.duration(600).delay(400)}
            style={styles.inputContainer}
          >
            <Text style={[styles.label, { color: theme.text }]}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.secondary }]}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={theme.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.duration(600).delay(600)}
            style={styles.inputContainer}
          >
            <Text style={[styles.label, { color: theme.text }]}>Contraseña</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.secondary }]}
              placeholder="********"
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(800)}>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => console.log('Login press')}
            >
              <Animated.View 
                style={[
                  styles.button, 
                  { backgroundColor: theme.primary, shadowColor: theme.primary },
                  animatedButtonStyle
                ]}
              >
                <Text style={styles.buttonText}>Entrar</Text>
              </Animated.View>
            </Pressable>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.duration(600).delay(1000)}
            style={styles.footer}
          >
            <Text style={[styles.footerText, { color: theme.text }]}>¿No tienes cuenta? </Text>
            <Pressable>
              <Text style={[styles.signUpLink, { color: theme.primary }]}>Regístrate</Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  header: { marginBottom: 48 },
  logoSquare: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: 24,
    transform: [{ rotate: '12deg' }],
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  title: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: 18, marginTop: 4 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', opacity: 0.8 },
  input: {
    height: 60,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1.5,
  },
  button: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 15, opacity: 0.7 },
  signUpLink: { fontSize: 15, fontWeight: '800' },
});

export default LoginScreen;