import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import { LoadingSpinner, ErrorView } from '../../src/components/StatusViews';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    if (!token || !user) return;
    try {
      setError(null);
      const promises = [api.get('/reports')];
      if (user?.role === 'student' && user?.student?.id) {
        promises.push(api.get(`/students/${user.student.id}`));
      }
      const results = await Promise.all(promises);
      setReports(results[0].data);
      if (results[1]) {
        setStudentProfile(results[1].data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err.response?.data || err.message);
      const msg =
        err.response?.data?.error ||
        (err.message?.includes('Network') || err.code === 'ECONNABORTED'
          ? 'Cannot reach server. Please check your network and ensure the backend is running.'
          : 'Failed to load MIS reports from server.');
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (authLoading || !token || !user) return;
    fetchReports();
  }, [authLoading, token, user, fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  if (authLoading || (loading && !reports)) {
    return <LoadingSpinner message="Loading MIS Dashboard..." />;
  }

  if (error && !reports) {
    return <ErrorView message={error} onRetry={fetchReports} />;
  }

  const occupancyPct = reports?.occupancy_percent ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
    >
      {/* Welcome Banner */}
      <Card style={styles.welcomeCard}>
        <View style={styles.welcomeRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.welcomeInfo}>
            <Text style={styles.greeting}>Welcome, {user?.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
            </View>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
        </View>

        {Boolean(user?.student) ? (
          <View style={styles.studentMeta}>
            <Text style={styles.studentMetaText}>
              🎓 Reg No: <Text style={styles.bold}>{user.student.reg_no}</Text> | Dept:{' '}
              <Text style={styles.bold}>{user.student.department}</Text> (Yr {user.student.year})
            </Text>
            <Text style={[styles.studentMetaText, { marginTop: 4 }]}>
              🛏️ Allocation:{' '}
              <Text style={styles.bold}>
                {studentProfile?.room_number
                  ? `Room ${studentProfile.room_number} (${studentProfile.hostel_name || 'Hostel'})`
                  : 'Not Allocated Yet'}
              </Text>
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Quick Action Shortcuts */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsRow}>
        {user?.role === 'student' ? (
          <>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(tabs)/maintenance')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="construct" size={20} color="#2563EB" />
              </View>
              <Text style={styles.actionBtnLabel}>Report Repair</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(tabs)/fees')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="card" size={20} color="#15803D" />
              </View>
              <Text style={styles.actionBtnLabel}>View Fees</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(tabs)/rooms')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FDF4FF' }]}>
                <Ionicons name="bed" size={20} color="#A855F7" />
              </View>
              <Text style={styles.actionBtnLabel}>Hostel Rooms</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {Boolean(['admin', 'sysadmin', 'warden'].includes(user?.role)) ? (
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push('/(tabs)/students')}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="person-add" size={20} color="#2563EB" />
                </View>
                <Text style={styles.actionBtnLabel}>Students</Text>
              </TouchableOpacity>
            ) : null}

            {Boolean(['admin', 'warden', 'sysadmin'].includes(user?.role)) ? (
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push('/(tabs)/rooms')}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="key" size={20} color="#D97706" />
                </View>
                <Text style={styles.actionBtnLabel}>Allocate</Text>
              </TouchableOpacity>
            ) : null}

            {Boolean(['admin', 'accounts', 'sysadmin'].includes(user?.role)) ? (
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push('/(tabs)/fees')}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="cash" size={20} color="#15803D" />
                </View>
                <Text style={styles.actionBtnLabel}>Fees & Dues</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(tabs)/maintenance')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FFF1F2' }]}>
                <Ionicons name="construct" size={20} color="#E11D48" />
              </View>
              <Text style={styles.actionBtnLabel}>Tickets</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Overall Occupancy Progress Card */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Campus Hostel Occupancy</Text>
          <Text style={styles.progressPct}>{occupancyPct}%</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, occupancyPct)}%` }]} />
        </View>

        <View style={styles.progressMeta}>
          <Text style={styles.progressMetaText}>
            {reports?.active_allocations || 0} Filled beds
          </Text>
          <Text style={styles.progressMetaText}>
            {reports?.vacancy || 0} Vacant of {reports?.total_capacity || 0} total
          </Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Overview Statistics</Text>

      {/* Grid of Metric Cards */}
      <View style={styles.grid}>
        <Card style={styles.metricCard}>
          <Ionicons name="people" size={22} color="#2563EB" />
          <Text style={styles.metricValue}>{reports?.total_students ?? 0}</Text>
          <Text style={styles.metricLabel}>Total Students</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Ionicons name="business" size={22} color="#0D9488" />
          <Text style={styles.metricValue}>{reports?.total_rooms ?? 0}</Text>
          <Text style={styles.metricLabel}>Total Rooms</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Ionicons name="key" size={22} color="#7C3AED" />
          <Text style={styles.metricValue}>{reports?.active_allocations ?? 0}</Text>
          <Text style={styles.metricLabel}>Active Allocations</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Ionicons name="pie-chart" size={22} color="#D97706" />
          <Text style={styles.metricValue}>{occupancyPct}%</Text>
          <Text style={styles.metricLabel}>Occupancy Rate</Text>
        </Card>

        <Card style={[styles.metricCard, styles.cardGreen]}>
          <Ionicons name="checkmark-circle" size={22} color="#15803D" />
          <Text style={[styles.metricValue, { color: '#15803D' }]}>
            {formatCurrency(reports?.fee_collected)}
          </Text>
          <Text style={styles.metricLabel}>Fees Collected</Text>
        </Card>

        <Card style={[styles.metricCard, styles.cardAmber]}>
          <Ionicons name="time" size={22} color="#B45309" />
          <Text style={[styles.metricValue, { color: '#B45309' }]}>
            {formatCurrency(reports?.fee_pending)}
          </Text>
          <Text style={styles.metricLabel}>Fees Pending</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Ionicons name="construct" size={22} color="#EA580C" />
          <Text style={styles.metricValue}>{reports?.pending_maintenance ?? 0}</Text>
          <Text style={styles.metricLabel}>Pending Repairs</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Ionicons name="warning" size={22} color="#DC2626" />
          <Text style={styles.metricValue}>{reports?.disciplinary_open ?? 0}</Text>
          <Text style={styles.metricLabel}>Open Disciplinary</Text>
        </Card>
      </View>

      {/* Recent Payments Feed */}
      {Boolean(reports?.recent_payments && reports.recent_payments.length > 0) ? (
        <View style={styles.feedSection}>
          <View style={styles.feedHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Fee Collections</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/fees')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {reports.recent_payments.slice(0, 3).map((p) => (
            <Card key={p.id} style={styles.feedItemCard}>
              <View style={styles.feedItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedItemTitle}>{p.student_name}</Text>
                  <Text style={styles.feedItemSub}>{p.fee_name} • {p.method || 'Online'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.feedAmount}>{formatCurrency(p.amount)}</Text>
                  <Badge label={p.status} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {/* Recent Maintenance Requests Feed */}
      {Boolean(reports?.recent_maintenance && reports.recent_maintenance.length > 0) ? (
        <View style={styles.feedSection}>
          <View style={styles.feedHeaderRow}>
            <Text style={styles.sectionTitle}>Latest Maintenance Tickets</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/maintenance')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {reports.recent_maintenance.slice(0, 3).map((m) => (
            <Card key={m.id} style={styles.feedItemCard}>
              <View style={styles.feedItemRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.feedItemTitle}>{m.category} Issue</Text>
                  <Text style={styles.feedItemSub} numberOfLines={1}>{m.description}</Text>
                  <Text style={styles.feedItemBy}>By: {m.student_name}</Text>
                </View>
                <Badge label={m.status} />
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 14,
    paddingBottom: 30,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    marginBottom: 12,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  welcomeInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '700',
  },
  emailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  studentMeta: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  studentMetaText: {
    fontSize: 12,
    color: '#475569',
  },
  bold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
    marginBottom: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  progressCard: {
    padding: 14,
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressPct: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  cardGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cardAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
    marginBottom: 2,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  feedSection: {
    marginTop: 10,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewAllText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  feedItemCard: {
    padding: 12,
    marginVertical: 3,
  },
  feedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  feedItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  feedItemBy: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  feedAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 4,
  },
});
