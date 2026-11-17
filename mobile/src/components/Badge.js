import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_THEMES = {
  // Room statuses
  available: { bg: '#DCFCE7', text: '#15803D' },
  occupied: { bg: '#FEE2E2', text: '#B91C1C' },
  partial: { bg: '#FEF9C3', text: '#854D0E' },
  maintenance: { bg: '#F3E8FF', text: '#6B21A8' },

  // Fee statuses
  paid: { bg: '#DCFCE7', text: '#15803D' },
  pending: { bg: '#FEF9C3', text: '#854D0E' },
  overdue: { bg: '#FEE2E2', text: '#B91C1C' },
  waived: { bg: '#E2E8F0', text: '#475569' },

  // Maintenance statuses
  submitted: { bg: '#E0F2FE', text: '#0369A1' },
  'in progress': { bg: '#FEF9C3', text: '#854D0E' },
  resolved: { bg: '#DCFCE7', text: '#15803D' },
  closed: { bg: '#E2E8F0', text: '#475569' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },

  // Priorities
  low: { bg: '#F1F5F9', text: '#475569' },
  medium: { bg: '#FEF9C3', text: '#854D0E' },
  high: { bg: '#FFEDD5', text: '#C2410C' },
  urgent: { bg: '#FEE2E2', text: '#B91C1C' },

  // Default
  default: { bg: '#F1F5F9', text: '#334155' },
};

export default function Badge({ label, style, variant }) {
  if (!label && !variant) return null;
  const key = (variant || label || '').toLowerCase().trim();
  const theme = STATUS_THEMES[key] || STATUS_THEMES.default;

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg }, style]}>
      <Text style={[styles.text, { color: theme.text }]}>{label || variant}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
