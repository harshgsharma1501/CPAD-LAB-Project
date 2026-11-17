import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import FormInput from '../../src/components/FormInput';
import SelectPicker from '../../src/components/SelectPicker';
import { LoadingSpinner, ErrorView } from '../../src/components/StatusViews';
import { Ionicons } from '@expo/vector-icons';

// Exact CHECK constraints from schema.sql
const CATEGORIES = ['Electrical', 'Plumbing', 'Furniture', 'Cleaning', 'Internet', 'AC/Fan', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const ALL_STATUSES = ['Submitted', 'In Progress', 'Resolved', 'Closed', 'Rejected'];
const STATUS_FILTER_OPTIONS = ['All', 'Submitted', 'In Progress', 'Resolved', 'Closed'];

const QUICK_RESOLUTION_PRESETS = [
  'Replaced component and verified working',
  'Repaired wiring / electrical issue',
  'Fixed plumbing leak and sealed joint',
  'Deep cleaned and sanitized room area',
  'Technician visited; issue resolved',
];

export default function MaintenanceScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // New Request Modal (Available to ALL authenticated users)
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Update Request Modal (admin, warden, sysadmin ONLY)
  const [selectedReq, setSelectedReq] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('In Progress');
  const [assignedTo, setAssignedTo] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // EXACT match to server/routes/maintenance.js authorize('admin', 'warden', 'sysadmin')
  const canManageMaintenance = ['admin', 'warden', 'sysadmin'].includes(user?.role);

  const fetchMaintenanceData = useCallback(async () => {
    if (!token || !user) return;
    try {
      setError(null);
      const [maintRes, roomsRes, studentsRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/rooms'),
        api.get('/students'),
      ]);
      setRequests(maintRes.data);
      setAllRooms(roomsRes.data);
      setAllStudents(studentsRes.data);
    } catch (err) {
      console.error('Failed to load maintenance requests:', err);
      const msg =
        err.response?.data?.error ||
        (err.message?.includes('Network') || err.code === 'ECONNABORTED'
          ? 'Cannot reach server. Please check your network and ensure the backend is running.'
          : 'Failed to load maintenance tickets.');
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (authLoading || !token || !user) return;
    fetchMaintenanceData();
  }, [authLoading, token, user, fetchMaintenanceData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaintenanceData();
  };

  const roomPickerOptions = useMemo(() => {
    return allRooms.map((r) => ({
      label: `Room ${r.room_number} — ${r.hostel_name || 'Hostel'}`,
      value: r.id,
      sublabel: `Floor ${r.floor} • ${r.type} (${r.status})`,
    }));
  }, [allRooms]);

  const studentPickerOptions = useMemo(() => {
    return allStudents.map((s) => ({
      label: `${s.name} (${s.reg_no})`,
      value: s.id,
      sublabel: s.room_number ? `Allocated: Room ${s.room_number}` : 'No allocation',
    }));
  }, [allStudents]);

  const categoryFilterOptions = useMemo(() => [
    { label: 'All Categories', value: 'ALL' },
    ...CATEGORIES.map((c) => ({ label: c, value: c })),
  ], []);

  const priorityFilterOptions = useMemo(() => [
    { label: 'All Priorities', value: 'ALL' },
    ...PRIORITIES.map((p) => ({ label: p, value: p })),
  ], []);

  const handleOpenAdd = () => {
    if (user?.role === 'student' && user?.student) {
      setStudentId(user.student.id);
      const currentStudent = allStudents.find((s) => s.user_id === user.id || s.id === user.student.id);
      if (currentStudent && currentStudent.room_id) {
        setRoomId(currentStudent.room_id);
      } else if (allRooms.length > 0) {
        setRoomId(allRooms[0].id);
      }
    } else {
      setStudentId(allStudents[0]?.id || '');
      setRoomId(allRooms[0]?.id || '');
    }

    setCategory('Electrical');
    setPriority('Medium');
    setDescription('');
    setFormError('');
    setShowAddModal(true);
  };

  const handleCreateRequest = async () => {
    setFormError('');
    if (!studentId) return setFormError('Please select a student.');
    if (!roomId) return setFormError('Please select a room.');
    if (!description.trim()) return setFormError('Please provide an issue description.');

    setFormSubmitting(true);
    try {
      await api.post('/maintenance', {
        student_id: parseInt(studentId, 10),
        room_id: parseInt(roomId, 10),
        category,
        priority,
        description: description.trim(),
      });
      setShowAddModal(false);
      fetchMaintenanceData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to submit maintenance request.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenUpdate = (item) => {
    if (!canManageMaintenance) return;
    setSelectedReq(item);

    if (item.status === 'Submitted') {
      setUpdateStatus('In Progress');
    } else if (item.status === 'In Progress') {
      setUpdateStatus('Resolved');
    } else if (item.status === 'Resolved') {
      setUpdateStatus('Closed');
    } else {
      setUpdateStatus(item.status);
    }

    setAssignedTo(item.assigned_to || '');
    setResolutionNote(item.resolution_note || '');
    setUpdateError('');
    setShowUpdateModal(true);
  };

  const allowedNextStatuses = useMemo(() => {
    if (!selectedReq) return ALL_STATUSES;
    switch (selectedReq.status) {
      case 'Submitted':
        return ['In Progress', 'Rejected'];
      case 'In Progress':
        return ['Resolved', 'In Progress'];
      case 'Resolved':
        return ['Closed', 'In Progress'];
      case 'Closed':
        return ['Closed', 'In Progress'];
      case 'Rejected':
        return ['Rejected', 'In Progress'];
      default:
        return ALL_STATUSES;
    }
  }, [selectedReq]);

  const handleUpdateRequest = async () => {
    setUpdateError('');
    if (updateStatus === 'Resolved' && !resolutionNote.trim()) {
      setUpdateError('Please add a resolution note explaining the fix.');
      return;
    }

    setUpdateSubmitting(true);
    try {
      await api.put(`/maintenance/${selectedReq.id}`, {
        status: updateStatus,
        assigned_to: assignedTo.trim() || null,
        resolution_note: resolutionNote.trim() || null,
      });
      setShowUpdateModal(false);
      fetchMaintenanceData();
    } catch (err) {
      setUpdateError(err.response?.data?.error || 'Failed to update request.');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  // Stepper helper
  const renderStatusStepper = (currentStatus) => {
    const steps = ['Submitted', 'In Progress', 'Resolved', 'Closed'];
    const currentIndex = steps.indexOf(currentStatus);
    const isRejected = currentStatus === 'Rejected';

    if (isRejected) {
      return (
        <View style={styles.rejectedBanner}>
          <Ionicons name="close-circle" size={16} color="#B91C1C" />
          <Text style={styles.rejectedBannerText}>This ticket has been rejected.</Text>
        </View>
      );
    }

    return (
      <View style={styles.stepperContainer}>
        {steps.map((st, i) => {
          const isDone = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <React.Fragment key={st}>
              <View style={styles.stepCol}>
                <View style={[styles.stepCircle, isDone && styles.stepCircleDone, isCurrent && styles.stepCircleActive]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumber}>{String(i + 1)}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>
                  {st}
                </Text>
              </View>
              {i < steps.length - 1 ? (
                <View style={[styles.stepLine, i < currentIndex && styles.stepLineDone]} />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // Multi-criteria filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.category?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.student_name?.toLowerCase().includes(q) ||
          r.room_number?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q) ||
          r.priority?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // 2. Status
      if (statusFilter !== 'All' && r.status !== statusFilter) {
        return false;
      }
      // 3. Category
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) {
        return false;
      }
      // 4. Priority
      if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) {
        return false;
      }
      return true;
    });
  }, [requests, searchQuery, statusFilter, categoryFilter, priorityFilter]);

  const activeCount = useMemo(() => {
    return requests.filter((r) => r.status === 'Submitted' || r.status === 'In Progress').length;
  }, [requests]);

  if (authLoading || (loading && requests.length === 0)) {
    return <LoadingSpinner message="Loading maintenance tickets..." />;
  }
  if (error && requests.length === 0) return <ErrorView message={error} onRetry={fetchMaintenanceData} />;

  return (
    <View style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>
            Maintenance ({filteredRequests.length})
          </Text>
          <Text style={styles.subtext}>
            {activeCount} Active • {requests.length - activeCount} Resolved/Closed
          </Text>
        </View>
        <Button
          title="+ New Request"
          onPress={handleOpenAdd}
          style={styles.addBtn}
        />
      </View>

      {/* Filter Dropdowns Row: Category + Priority */}
      <View style={styles.dropdownFiltersRow}>
        <View style={{ flex: 1.2, marginRight: 8 }}>
          <SelectPicker
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            options={categoryFilterOptions}
            placeholder="Category..."
            style={{ marginBottom: 0 }}
          />
        </View>

        <View style={{ flex: 0.8 }}>
          <SelectPicker
            value={priorityFilter}
            onValueChange={setPriorityFilter}
            options={priorityFilterOptions}
            placeholder="Priority..."
            style={{ marginBottom: 0 }}
          />
        </View>
      </View>

      {/* Status Chips Filter */}
      <View style={styles.chipsFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {STATUS_FILTER_OPTIONS.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusChip, statusFilter === st && styles.statusChipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.statusChipText, statusFilter === st && styles.statusChipTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by category, room, issue, or student..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {Boolean(searchQuery) ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleOpenUpdate(item)}
            activeOpacity={canManageMaintenance ? 0.7 : 1}
          >
            <Card style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.categoryTitle}>
                    {item.category} — Room {item.room_number} ({item.hostel_name || 'Hostel'})
                  </Text>
                  <Text style={styles.studentName}>By: {item.student_name} ({item.reg_no})</Text>
                </View>
                <Badge label={item.status} />
              </View>

              <Text style={styles.description}>{item.description}</Text>

              {/* Status Stepper visualization */}
              {renderStatusStepper(item.status)}

              <View style={styles.ticketFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.metaLabel}>Priority: </Text>
                  <Badge label={item.priority} variant={item.priority} />
                </View>

                <Text style={styles.assignedText}>
                  {item.assigned_to ? `Assigned: ${item.assigned_to}` : 'Unassigned'}
                </Text>
              </View>

              {Boolean(item.resolution_note) ? (
                <View style={styles.resolutionBox}>
                  <Text style={styles.resolutionTitle}>Resolution Note:</Text>
                  <Text style={styles.resolutionText}>{item.resolution_note}</Text>
                </View>
              ) : null}
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={38} color="#CBD5E1" />
            <Text style={styles.emptyText}>No maintenance tickets match the selected filters.</Text>
          </View>
        }
      />

      {/* New Request Modal (ALL users) */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Maintenance Ticket</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {Boolean(formError) ? (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              ) : null}

              {user?.role === 'student' ? (
                <View style={styles.lockedStudentBox}>
                  <Text style={styles.lockedLabel}>Submitting as Student:</Text>
                  <Text style={styles.lockedVal}>{user.name} ({user?.student?.reg_no || 'Student'})</Text>
                </View>
              ) : (
                <SelectPicker
                  label="Select Student *"
                  value={studentId}
                  onValueChange={setStudentId}
                  options={studentPickerOptions}
                  searchable
                  placeholder="Choose student reporting issue..."
                />
              )}

              <SelectPicker
                label="Room Location *"
                value={roomId}
                onValueChange={setRoomId}
                options={roomPickerOptions}
                searchable
                searchPlaceholder="Search room by number..."
                placeholder="Choose affected room..."
              />

              <SelectPicker
                label="Category *"
                value={category}
                onValueChange={setCategory}
                options={CATEGORIES}
              />

              <SelectPicker
                label="Priority *"
                value={priority}
                onValueChange={setPriority}
                options={PRIORITIES}
              />

              <FormInput
                label="Issue Description *"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what needs repair..."
                multiline
                numberOfLines={3}
                style={{ marginTop: 4 }}
              />

              <Button
                title="Submit Request"
                onPress={handleCreateRequest}
                loading={formSubmitting}
                style={{ marginTop: 10, marginBottom: 24 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Update Request Modal (Admin/Warden/Sysadmin ONLY) */}
      <Modal visible={showUpdateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Ticket #{selectedReq?.id}</Text>
              <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {Boolean(updateError) ? (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>{updateError}</Text>
                </View>
              ) : null}

              <Text style={styles.updateDesc}>
                Category: <Text style={{ fontWeight: '700' }}>{selectedReq?.category}</Text> • Room {selectedReq?.room_number}
              </Text>
              <Text style={styles.updateDesc}>
                Current Status: <Text style={{ fontWeight: '700' }}>{selectedReq?.status}</Text>
              </Text>
              <Text style={[styles.updateDesc, { fontStyle: 'italic', marginBottom: 10 }]}>
                Issue: "{selectedReq?.description}"
              </Text>

              <SelectPicker
                label="Update Status to *"
                value={updateStatus}
                onValueChange={setUpdateStatus}
                options={allowedNextStatuses}
              />

              <FormInput
                label="Assign To (Staff / Technician)"
                value={assignedTo}
                onChangeText={setAssignedTo}
                placeholder="e.g. Raju Electrician"
              />

              {/* Quick Presets for Resolution Note */}
              <Text style={styles.presetLabel}>Quick Presets for Resolution Note:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {QUICK_RESOLUTION_PRESETS.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetChip}
                    onPress={() => setResolutionNote(p)}
                  >
                    <Text style={styles.presetChipText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <FormInput
                label={updateStatus === 'Resolved' || updateStatus === 'Closed' ? 'Resolution Note *' : 'Resolution Note (Optional)'}
                value={resolutionNote}
                onChangeText={setResolutionNote}
                placeholder="Details of repair work completed..."
                multiline
                numberOfLines={2}
              />

              <Button
                title="Save Status & Assignment"
                onPress={handleUpdateRequest}
                loading={updateSubmitting}
                style={{ marginTop: 10, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  dropdownFiltersRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: '#F8FAFC',
  },
  chipsFilterRow: {
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
  },
  statusChips: {
    paddingHorizontal: 14,
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  statusChipActive: {
    backgroundColor: '#2563EB',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 14,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  ticketCard: {
    marginVertical: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: '#334155',
    marginVertical: 6,
    lineHeight: 18,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
  stepCol: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: {
    backgroundColor: '#10B981',
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    marginBottom: 10,
  },
  stepLineDone: {
    backgroundColor: '#10B981',
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 6,
    marginVertical: 6,
  },
  rejectedBannerText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '600',
    marginLeft: 6,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  assignedText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  resolutionBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  resolutionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  resolutionText: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '85%',
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    maxHeight: '88%',
  },
  lockedStudentBox: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lockedLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  lockedVal: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
    marginTop: 2,
  },
  updateDesc: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
  },
  presetScroll: {
    marginBottom: 10,
  },
  presetChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
  },
  presetChipText: {
    fontSize: 11,
    color: '#1D4ED8',
  },
  formErrorBox: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  formErrorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 36,
  },
  emptyText: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 13,
  },
});
