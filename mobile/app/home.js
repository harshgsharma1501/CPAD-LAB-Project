import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>Authenticated</Text>
        <Text style={styles.welcomeText}>
          Welcome, {user?.name || 'User'}
        </Text>
        <Text style={styles.roleText}>Role: {user?.role || 'N/A'}</Text>
        <Text style={styles.emailText}>{user?.email}</Text>

        {Boolean(user?.student) ? (
          <View style={styles.studentInfoBox}>
            <Text style={styles.studentInfoTitle}>Student Record Attached:</Text>
            <Text style={styles.studentInfoText}>Reg No: {user.student.reg_no}</Text>
            <Text style={styles.studentInfoText}>Department: {user.student.department}</Text>
            <Text style={styles.studentInfoText}>Year: {user.student.year}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  badge: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  studentInfoBox: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  studentInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  studentInfoText: {
    fontSize: 12,
    color: '#475569',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
