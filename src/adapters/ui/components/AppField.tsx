import React, { ReactNode } from 'react';
import { KeyboardTypeOptions, ReturnKeyTypeOptions, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { COLORS } from '@/src/shared/theme/colors';

interface AppFieldProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  isDark?: boolean;
  leftNode?: ReactNode;
  rightNode?: ReactNode;
  accessibilityLabel?: string;
  wrapperStyle?: StyleProp<ViewStyle>;
  inputWrapStyle?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
  placeholderTextColor?: string;
}

export default function AppField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  returnKeyType,
  onSubmitEditing,
  isDark = false,
  leftNode,
  rightNode,
  accessibilityLabel,
  wrapperStyle,
  inputWrapStyle,
  inputStyle,
  placeholderTextColor,
}: AppFieldProps) {
  return (
    <View style={wrapperStyle}>
      {label ? <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text> : null}

      <View style={[styles.inputWrap, isDark && styles.inputWrapDark, inputWrapStyle]}>
        {leftNode}
        <TextInput
          style={[styles.input, isDark && styles.inputDark, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor ?? (isDark ? COLORS.white + '66' : COLORS.text + '44')}
          keyboardType={keyboardType}
          accessibilityLabel={accessibilityLabel}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {rightNode}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    opacity: 0.5,
    marginBottom: 7,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelDark: {
    color: COLORS.white,
    opacity: 0.82,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 18,
  },
  inputWrapDark: {
    backgroundColor: '#11351A',
    borderColor: COLORS.secondary + '66',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 10,
  },
  inputDark: {
    color: COLORS.white,
  },
});
