import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline'
  style,
  textStyle,
}) {
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSecondary && styles.btnSecondary,
        isDanger && styles.btnDanger,
        isOutline && styles.btnOutline,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? '#2563EB' : '#FFFFFF'} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            isSecondary && styles.textSecondary,
            isOutline && styles.textOutline,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: '#475569',
  },
  btnDanger: {
    backgroundColor: '#EF4444',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  textSecondary: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: '#2563EB',
  },
});
