import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/theme/colors';
import { ChefHat, LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../navigation/AuthContext';

const HomeScreen: React.FC = () => {
  const { logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hola, Chef! 👋</Text>
            <Text style={styles.brandName}>GastroMind</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={logout}
            activeOpacity={0.7}
          >
             <LogOut size={20} color={COLORS.error || '#ff4444'} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu próxima creación</Text>
          <Text style={styles.cardSubtitle}>Aquí aparecerán tus recetas generadas con IA.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 25 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10
  },
  welcomeText: { fontSize: 16, color: COLORS.text, opacity: 0.6, fontWeight: '500' },
  brandName: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  logoutButton: { 
    width: 50, height: 50, 
    borderRadius: 15, 
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowOpacity: 0.1, shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.1)' // Un toque sutil rojo
  },
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    padding: 25,
    height: 180,
    justifyContent: 'center',
  },
  cardTitle: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  cardSubtitle: { color: COLORS.white, opacity: 0.8, marginTop: 8, fontSize: 14 }
});

export default HomeScreen;