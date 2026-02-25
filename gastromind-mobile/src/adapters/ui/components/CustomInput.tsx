import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import { COLORS } from '../../../shared/theme/colors';

interface CustomInputProps extends TextInputProps {
  icon: LucideIcon;
  isPassword?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({ 
  icon: Icon, 
  isPassword, 
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Icon size={20} color={COLORS.text} style={styles.inputIcon} opacity={0.5} />
      <TextInput
        style={styles.input}
        placeholderTextColor="#99aab5"
        secureTextEntry={isPassword && !showPassword}
        {...props}
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? 
            <EyeOff size={20} color={COLORS.accent} /> : 
            <Eye size={20} color={COLORS.text} opacity={0.4} />
          }
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
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
  inputIcon: { marginRight: 15 },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
});