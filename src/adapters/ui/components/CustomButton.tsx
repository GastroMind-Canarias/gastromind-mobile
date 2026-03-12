import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../../../shared/theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
}

export const CustomButton: React.FC<Props> = ({ title, onPress, loading }) => (
  <TouchableOpacity style={styles.button} onPress={onPress} disabled={loading}>
    {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.text}>{title}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary, height: 65, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  text: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
});