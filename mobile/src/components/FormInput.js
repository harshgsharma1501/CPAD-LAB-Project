import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {Boolean(label) ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          !editable && styles.disabledInput,
          error && styles.errorInput,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
      />
      {Boolean(error) ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  errorInput: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
