import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    Keyboard.dismiss();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmedEmail, password);
      // Navigation to /home is handled automatically by RootNavigation in _layout.js
    } catch (err) {
      console.log('Login error response:', err.response?.data || err.message);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED'
          ? 'Network timeout. Check server connection.'
          : err.message.includes('Network Error')
          ? 'Cannot connect to server. Check IP & Wi-Fi.'
          : 'Login failed. Please try again.');
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword = 'demo1234') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  const content = (
    <View style={styles.inner}>
      <View style={styles.card}>
        <Text style={styles.title}>🏨 Zostel MIS</Text>
        <Text style={styles.subtitle}>Hostel Management System</Text>

        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. student@hostel.edu"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.hintContainer}>
          <Text style={styles.hintTitle}>Quick Login (Demo Accounts):</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => fillCredentials('student@hostel.edu')}
            >
              <Text style={styles.chipText}>🎓 Student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => fillCredentials('admin@hostel.edu')}
            >
              <Text style={styles.chipText}>🛡️ Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => fillCredentials('warden@hostel.edu')}
            >
              <Text style={styles.chipText}>📋 Warden</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => fillCredentials('accounts@hostel.edu')}
            >
              <Text style={styles.chipText}>💳 Accounts</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintPassword}>Password for all: demo1234</Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {Platform.OS === 'web' ? (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {content}
        </TouchableWithoutFeedback>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hintContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  hintPassword: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
});
