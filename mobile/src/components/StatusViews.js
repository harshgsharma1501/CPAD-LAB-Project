import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Button from './Button';

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563EB" />
      {Boolean(message) ? <Text style={styles.loadingText}>{message}</Text> : null}
    </View>
  );
}

export function ErrorView({ message = 'An error occurred', onRetry }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorText}>{message}</Text>
      {Boolean(onRetry) ? (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="outline"
          style={styles.retryBtn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B91C1C',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    minWidth: 120,
  },
});
