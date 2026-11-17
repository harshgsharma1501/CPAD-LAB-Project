import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import NotificationsModal from '../../src/components/NotificationsModal';

export default function TabLayout() {
  const { logout, user, token, loading: authLoading } = useAuth();
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll notifications count periodically / on mount
  useEffect(() => {
    if (authLoading || !token) return;
    let mounted = true;
    async function checkNotifs() {
      try {
        const res = await api.get('/notifications');
        if (mounted && res.data) {
          setUnreadCount(res.data.unread_count || 0);
        }
      } catch (_) {}
    }
    checkNotifs();
    const interval = setInterval(checkNotifs, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [authLoading, token]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
          headerShadowVisible: false,
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E2E8F0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {/* Notification Bell */}
              <TouchableOpacity
                onPress={() => setShowNotifModal(true)}
                style={styles.bellBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={22} color="#334155" />
                {Boolean(unreadCount > 0) ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="students"
          options={{
            title: 'Students',
            tabBarLabel: 'Students',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="rooms"
          options={{
            title: 'Rooms',
            tabBarLabel: 'Rooms',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bed-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="fees"
          options={{
            title: 'Fees',
            tabBarLabel: 'Fees',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="card-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="maintenance"
          options={{
            title: 'Maintenance',
            tabBarLabel: 'Maintenance',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="construct-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <NotificationsModal
        visible={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        onCountChange={setUnreadCount}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  bellBtn: {
    position: 'relative',
    padding: 6,
    marginRight: 8,
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
});
