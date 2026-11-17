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
  Linking,
  Alert,
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

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const YEAR_OPTIONS = [
  { label: 'Year 1 (Freshman)', value: 1 },
  { label: 'Year 2 (Sophomore)', value: 2 },
  { label: 'Year 3 (Junior)', value: 3 },
  { label: 'Year 4 (Senior)', value: 4 },
  { label: 'Year 5 (PG / Dual Degree)', value: 5 },
];
const DEPARTMENT_OPTIONS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
];

const ALLOC_FILTER_OPTIONS = ['All', 'Allocated', 'Unallocated'];

export default function StudentsScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [allocFilter, setAllocFilter] = useState('All');

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState(1);
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('2005-01-01');
  const [gender, setGender] = useState('Male');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [address, setAddress] = useState('');

  // EXACT match to server/routes/students.js authorize('admin', 'sysadmin', 'warden')
  const canManageStudents = ['admin', 'sysadmin', 'warden'].includes(user?.role);

  const fetchStudents = useCallback(async () => {
    if (!token || !user) return;
    try {
      setError(null);
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.message?.includes('Network') || err.code === 'ECONNABORTED'
          ? 'Cannot reach server. Please check your network and ensure the backend is running.'
          : 'Failed to load students.');
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (authLoading || !token || !user) return;
    fetchStudents();
  }, [authLoading, token, user, fetchStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const handleOpenDetail = async (studentSummary) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/students/${studentSummary.id}`);
      setSelectedStudent(res.data);
    } catch (err) {
      setSelectedStudent(studentSummary);
    } finally {
      setDetailLoading(false);
    }
  };

  const openAddModal = () => {
    setFormMode('add');
    setName('');
    setEmail('');
    setRegNo('');
    setDepartment('Computer Science');
    setYear(1);
    setPhone('');
    setDob('2005-01-01');
    setGender('Male');
    setGuardianName('');
    setGuardianPhone('');
    setAddress('');
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (st) => {
    setFormMode('edit');
    setName(st.name || '');
    setEmail(st.email || '');
    setRegNo(st.reg_no || '');
    setDepartment(st.department || 'Computer Science');
    setYear(Number(st.year || 1));
    setPhone(st.phone || '');
    setDob(st.dob || '');
    setGender(st.gender || 'Male');
    setGuardianName(st.guardian_name || '');
    setGuardianPhone(st.guardian_phone || '');
    setAddress(st.address || '');
    setFormError('');
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleFormSubmit = async () => {
    setFormError('');
    if (!name.trim()) return setFormError('Name is required.');
    if (formMode === 'add' && !email.trim()) return setFormError('Email is required.');
    if (formMode === 'add' && !regNo.trim()) return setFormError('Registration number is required.');
    if (!department) return setFormError('Department is required.');
    if (!year || year < 1 || year > 5) return setFormError('Year must be between 1 and 5.');

    setFormSubmitting(true);
    try {
      if (formMode === 'add') {
        await api.post('/students', {
          name: name.trim(),
          email: email.trim(),
          reg_no: regNo.trim(),
          department,
          year: parseInt(year, 10),
          phone: phone.trim() || null,
          dob: dob.trim() || null,
          gender: gender || null,
          guardian_name: guardianName.trim() || null,
          guardian_phone: guardianPhone.trim() || null,
          address: address.trim() || null,
        });
      } else {
        await api.put(`/students/${selectedStudent.id}`, {
          name: name.trim(),
          department,
          year: parseInt(year, 10),
          phone: phone.trim() || null,
          guardian_name: guardianName.trim() || null,
          guardian_phone: guardianPhone.trim() || null,
          address: address.trim() || null,
        });
      }

      setShowFormModal(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save student record.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Helper for quick mobile dialing / mailing
  const handleDial = (telNumber) => {
    if (!telNumber) return;
    Linking.openURL(`tel:${telNumber}`).catch(() => {
      Alert.alert('Phone Call', `Could not open dialer for ${telNumber}`);
    });
  };

  const handleMail = (emailAddr) => {
    if (!emailAddr) return;
    Linking.openURL(`mailto:${emailAddr}`).catch(() => {
      Alert.alert('Email', `Could not open mail app for ${emailAddr}`);
    });
  };

  // Dropdown filter options
  const deptFilterOptions = useMemo(() => [
    { label: 'All Departments', value: 'ALL' },
    ...DEPARTMENT_OPTIONS.map((d) => ({ label: d, value: d })),
  ], []);

  const yearFilterOptions = useMemo(() => [
    { label: 'All Years', value: 'ALL' },
    { label: 'Year 1', value: '1' },
    { label: 'Year 2', value: '2' },
    { label: 'Year 3', value: '3' },
    { label: 'Year 4', value: '4' },
    { label: 'Year 5', value: '5' },
  ], []);

  // Multi-criteria student filtering
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.name?.toLowerCase().includes(q) ||
          s.reg_no?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q) ||
          s.room_number?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // 2. Department
      if (deptFilter !== 'ALL' && s.department !== deptFilter) {
        return false;
      }
      // 3. Year
      if (yearFilter !== 'ALL' && String(s.year) !== yearFilter) {
        return false;
      }
      // 4. Allocation Status
      if (allocFilter === 'Allocated' && !s.room_number) {
        return false;
      }
      if (allocFilter === 'Unallocated' && !!s.room_number) {
        return false;
      }
      return true;
    });
  }, [students, searchQuery, deptFilter, yearFilter, allocFilter]);

  const allocatedCount = useMemo(() => students.filter((s) => !!s.room_number).length, [students]);
  const unallocatedCount = students.length - allocatedCount;

  if (authLoading || (loading && students.length === 0)) {
    return <LoadingSpinner message="Loading students..." />;
  }
  if (error && students.length === 0) return <ErrorView message={error} onRetry={fetchStudents} />;

  return (
    <View style={styles.container}>
      {/* Top action bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.listHeader}>
            Students ({filteredStudents.length})
          </Text>
          <Text style={styles.subtext}>
            {allocatedCount} Allocated • {unallocatedCount} Unallocated
          </Text>
        </View>
        {Boolean(canManageStudents) ? (
          <Button
            title="+ Add Student"
            onPress={openAddModal}
            style={styles.addBtn}
          />
        ) : null}
      </View>

      {/* Filter Dropdowns Row: Department + Year */}
      <View style={styles.dropdownFiltersRow}>
        <View style={{ flex: 1.2, marginRight: 8 }}>
          <SelectPicker
            value={deptFilter}
            onValueChange={setDeptFilter}
            options={deptFilterOptions}
            placeholder="Department..."
            style={{ marginBottom: 0 }}
          />
        </View>

        <View style={{ flex: 0.8 }}>
          <SelectPicker
            value={yearFilter}
            onValueChange={setYearFilter}
            options={yearFilterOptions}
            placeholder="Year..."
            style={{ marginBottom: 0 }}
          />
        </View>
      </View>

      {/* Allocation Status Chips Filter */}
      <View style={styles.chipsFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {ALLOC_FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.statusChip, allocFilter === opt && styles.statusChipActive]}
              onPress={() => setAllocFilter(opt)}
            >
              <Text style={[styles.statusChipText, allocFilter === opt && styles.statusChipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name, reg no, or room..."
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
        data={filteredStudents}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleOpenDetail(item)} activeOpacity={0.7}>
            <Card style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentReg}>Reg: {item.reg_no}</Text>
                </View>
                <Badge
                  label={item.room_number ? `Room ${item.room_number}` : 'Unallocated'}
                  variant={item.room_number ? 'available' : 'default'}
                />
              </View>

              <View style={styles.studentMetaRow}>
                <Text style={styles.metaText}>
                  Dept: {item.department} • Year {item.year}
                </Text>
                {item.hostel_name && (
                  <Text style={styles.hostelText}>{item.hostel_name}</Text>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={38} color="#CBD5E1" />
            <Text style={styles.emptyText}>No students match the chosen filters.</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Profile</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <LoadingSpinner message="Fetching details..." />
            ) : (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.detailName}>{selectedStudent?.name}</Text>
                <Text style={styles.detailSub}>Reg No: {selectedStudent?.reg_no}</Text>
                <Text style={styles.detailSub}>Department: {selectedStudent?.department}</Text>
                <Text style={styles.detailSub}>Academic Year: Year {selectedStudent?.year}</Text>
                <Text style={styles.detailSub}>Gender: {selectedStudent?.gender || 'N/A'}</Text>
                <Text style={styles.detailSub}>DOB: {selectedStudent?.dob || 'N/A'}</Text>

                <View style={styles.allocationBox}>
                  <Text style={styles.allocTitle}>Room Allocation:</Text>
                  <Text style={styles.allocVal}>
                    {selectedStudent?.room_number
                      ? `Room ${selectedStudent.room_number} (${selectedStudent?.hostel_name || 'Hostel'})`
                      : 'Not Allocated Yet'}
                  </Text>
                </View>

                {/* Quick Call & Email Action Row */}
                <View style={styles.actionRow}>
                  {Boolean(selectedStudent?.phone) ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDial(selectedStudent.phone)}
                    >
                      <Ionicons name="call" size={16} color="#15803D" />
                      <Text style={styles.actionBtnText}>Call Student</Text>
                    </TouchableOpacity>
                  ) : null}

                  {Boolean(selectedStudent?.email) ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#2563EB', backgroundColor: '#EFF6FF' }]}
                      onPress={() => handleMail(selectedStudent.email)}
                    >
                      <Ionicons name="mail" size={16} color="#2563EB" />
                      <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Email</Text>
                    </TouchableOpacity>
                  ) : null}

                  {Boolean(selectedStudent?.guardian_phone) ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#B45309', backgroundColor: '#FFFBEB' }]}
                      onPress={() => handleDial(selectedStudent.guardian_phone)}
                    >
                      <Ionicons name="call-outline" size={16} color="#B45309" />
                      <Text style={[styles.actionBtnText, { color: '#B45309' }]}>Guardian</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={styles.detailSub}>
                  Guardian: {selectedStudent?.guardian_name || 'N/A'} ({selectedStudent?.guardian_phone || 'N/A'})
                </Text>
                <Text style={styles.detailSub}>
                  Address: {selectedStudent?.address || 'N/A'}
                </Text>

                {Boolean(canManageStudents) ? (
                  <Button
                    title="Edit Student Info"
                    onPress={() => openEditModal(selectedStudent)}
                    style={{ marginTop: 20 }}
                  />
                ) : null}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Form Modal (Add / Edit) */}
      <Modal visible={showFormModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formMode === 'add' ? 'Add New Student' : 'Edit Student'}
              </Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {Boolean(formError) ? (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              ) : null}

              <FormInput
                label="Full Name *"
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
              />

              {Boolean(formMode === 'add') ? (
                <>
                  <FormInput
                    label="Email Address *"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="student@hostel.edu"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <FormInput
                    label="Registration Number *"
                    value={regNo}
                    onChangeText={setRegNo}
                    placeholder="231070001"
                  />
                </>
              ) : null}

              <SelectPicker
                label="Department *"
                value={department}
                onValueChange={setDepartment}
                options={DEPARTMENT_OPTIONS}
              />

              <SelectPicker
                label="Academic Year (1-5) *"
                value={year}
                onValueChange={setYear}
                options={YEAR_OPTIONS}
              />

              {Boolean(formMode === 'add') ? (
                <SelectPicker
                  label="Gender"
                  value={gender}
                  onValueChange={setGender}
                  options={GENDER_OPTIONS}
                />
              ) : null}

              <FormInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile"
                keyboardType="phone-pad"
              />

              {Boolean(formMode === 'add') ? (
                <FormInput
                  label="Date of Birth"
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                />
              ) : null}

              <FormInput
                label="Guardian Name"
                value={guardianName}
                onChangeText={setGuardianName}
                placeholder="Parent / Guardian"
              />

              <FormInput
                label="Guardian Phone"
                value={guardianPhone}
                onChangeText={setGuardianPhone}
                placeholder="Guardian mobile"
                keyboardType="phone-pad"
              />

              <FormInput
                label="Permanent Address"
                value={address}
                onChangeText={setAddress}
                placeholder="City, State, Postal code"
                multiline
                numberOfLines={2}
              />

              <Button
                title={formMode === 'add' ? 'Create Student' : 'Save Changes'}
                onPress={handleFormSubmit}
                loading={formSubmitting}
                style={{ marginTop: 10, marginBottom: 30 }}
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
  listHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addBtn: {
    paddingVertical: 8,
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
  studentCard: {
    marginVertical: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentReg: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  studentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
  },
  hostelText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
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
  detailName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  detailSub: {
    fontSize: 13,
    color: '#334155',
    marginVertical: 3,
  },
  allocationBox: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  allocTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  allocVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    marginLeft: 6,
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
