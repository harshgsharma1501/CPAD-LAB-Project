import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import api from '../services/api';
import Badge from './Badge';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsModal({ visible, onClose, onCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
      if (onCountChange) onCountChange(res.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (onCountChange) onCountChange(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      if (onCountChange) onCountChange(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'Fee Due':
        return { name: 'card', color: '#D97706' };
      case 'Maintenance':
        return { name: 'construct', color: '#2563EB' };
      case 'Alert':
        return { name: 'alert-circle', color: '#DC2626' };
      case 'Announcement':
        return { name: 'megaphone', color: '#7C3AED' };
      default:
        return { name: 'information-circle', color: '#0D9488' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications" size={22} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Notifications</Text>
              {Boolean(unreadCount > 0) ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Boolean(unreadCount > 0) ? (
                <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* List */}
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchNotifications();
                }}
                colors={['#2563EB']}
              />
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const icon = getNotifIcon(item.type);
              return (
                <TouchableOpacity
                  style={[styles.itemCard, !item.is_read && styles.unreadItemCard]}
                  onPress={() => !item.is_read && markAsRead(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: icon.color + '18' }]}>
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, !item.is_read && styles.unreadText]}>
                        {item.title}
                      </Text>
                      <Badge label={item.type} />
                    </View>

                    <Text style={styles.itemMessage}>{item.message}</Text>
                    <Text style={styles.itemDate}>
                      {item.created_at ? item.created_at.replace('T', ' ').slice(0, 16) : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="notifications-off-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyText}>No notifications at this time.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  markAllBtn: {
    marginRight: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  unreadItemCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 6,
  },
  unreadText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  itemMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 6,
  },
  itemDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  empty: {
    alignItems: 'center',
    padding: 36,
  },
  emptyText: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 14,
  },
});
