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
  Share,
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

// Exact CHECK constraints from schema.sql
const PAYMENT_METHODS = ['UPI', 'Online', 'Cash', 'Cheque', 'Bank Transfer'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Overdue', 'Waived'];
const STATUS_FILTER_OPTIONS = ['All', 'Pending', 'Overdue', 'Paid', 'Waived'];

export default function FeesScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState(null);
  const [fees, setFees] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [feeTypeFilter, setFeeTypeFilter] = useState('ALL');

  // Record Payment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [status, setStatus] = useState('Paid');
  const [txnRef, setTxnRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Update Status Modal
  const [selectedFee, setSelectedFee] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('Paid');
  const [updateMethod, setUpdateMethod] = useState('UPI');
  const [updateTxnRef, setUpdateTxnRef] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Receipt Preview Modal
  const [receiptItem, setReceiptItem] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // EXACT match to server/routes/fees.js authorize('admin', 'accounts', 'sysadmin')
  const canManageFees = ['admin', 'accounts', 'sysadmin'].includes(user?.role);

  const fetchFeeData = useCallback(async () => {
    if (!token || !user) return;
    try {
      setError(null);
      const [sumRes, feesRes, typesRes, studentsRes] = await Promise.all([
        api.get('/fees/summary'),
        api.get('/fees'),
        api.get('/fees/types'),
        api.get('/students'),
      ]);
      setSummary(sumRes.data);
      setFees(feesRes.data);
      setFeeTypes(typesRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error('Failed to load fees data:', err);
      const msg =
        err.response?.data?.error ||
        (err.message?.includes('Network') || err.code === 'ECONNABORTED'
          ? 'Cannot reach server. Please check your network and ensure the backend is running.'
          : 'Failed to load fee information.');
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (authLoading || !token || !user) return;
    fetchFeeData();
  }, [authLoading, token, user, fetchFeeData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeeData();
  };

  const studentOptions = useMemo(() => {
    return students.map((s) => ({
      label: `${s.name} (${s.reg_no})`,
      value: s.id,
      sublabel: `${s.department} • Room: ${s.room_number || 'None'}`,
    }));
  }, [students]);

  const feeTypeOptions = useMemo(() => {
    return feeTypes.map((ft) => ({
      label: `${ft.name} — ₹${ft.amount}`,
      value: ft.id,
      sublabel: `${ft.frequency} • ${ft.description || ''}`,
    }));
  }, [feeTypes]);

  const feeTypeFilterOptions = useMemo(() => {
    return [
      { label: 'All Fee Types', value: 'ALL' },
      ...feeTypes.map((ft) => ({
        label: ft.name,
        value: String(ft.id),
      })),
    ];
  }, [feeTypes]);

  const handleOpenAdd = () => {
    const firstStudent = students[0]?.id || '';
    const firstFeeType = feeTypes[0];
    setStudentId(firstStudent);
    setSelectedFeeTypeId(firstFeeType?.id || '');
    setAmount(firstFeeType ? String(firstFeeType.amount) : '15000');
    setMethod('UPI');
    setStatus('Paid');
    setTxnRef('TXN' + Date.now().toString().slice(-6));
    setRemarks('');
    setFormError('');
    setShowAddModal(true);
  };

  const handleFeeTypeChange = (newTypeId) => {
    setSelectedFeeTypeId(newTypeId);
    const matched = feeTypes.find((ft) => ft.id === newTypeId);
    if (matched) {
      setAmount(String(matched.amount));
    }
  };

  const handleCreatePayment = async () => {
    setFormError('');
    if (!studentId) return setFormError('Please select a student.');
    if (!selectedFeeTypeId) return setFormError('Please select a fee type.');
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return setFormError('Please enter a valid amount.');
    }

    setFormSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.post('/fees', {
        student_id: parseInt(studentId, 10),
        fee_type_id: parseInt(selectedFeeTypeId, 10),
        amount: parseFloat(amount.trim()),
        due_date: today,
        paid_date: status === 'Paid' ? today : null,
        method: status === 'Paid' ? method : null,
        status,
        txn_ref: status === 'Paid' ? txnRef.trim() || null : null,
        remarks: remarks.trim() || null,
      });
      setShowAddModal(false);
      fetchFeeData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to record payment.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleItemPress = (feeItem) => {
    if (feeItem.status === 'Paid') {
      // Open receipt view modal
      setReceiptItem(feeItem);
      setShowReceiptModal(true);
    } else if (canManageFees) {
      // Open update status modal
      setSelectedFee(feeItem);
      setUpdateStatus('Paid');
      setUpdateMethod(feeItem.method || 'UPI');
      setUpdateTxnRef(feeItem.txn_ref || 'TXN' + Date.now().toString().slice(-6));
      setUpdateError('');
      setShowUpdateModal(true);
    }
  };

  const allowedNextStatuses = useMemo(() => {
    if (!selectedFee) return PAYMENT_STATUSES;
    if (selectedFee.status === 'Paid') {
      return ['Paid', 'Waived'];
    }
    if (selectedFee.status === 'Pending') {
      return ['Paid', 'Overdue', 'Waived'];
    }
    if (selectedFee.status === 'Overdue') {
      return ['Paid', 'Waived', 'Pending'];
    }
    return PAYMENT_STATUSES;
  }, [selectedFee]);

  const handleUpdatePayment = async () => {
    setUpdateError('');
    setUpdateSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.put(`/fees/${selectedFee.id}`, {
        status: updateStatus,
        paid_date: updateStatus === 'Paid' ? today : null,
        method: updateStatus === 'Paid' ? updateMethod : null,
        txn_ref: updateStatus === 'Paid' ? updateTxnRef.trim() : null,
      });
      setShowUpdateModal(false);
      fetchFeeData();
    } catch (err) {
      setUpdateError(err.response?.data?.error || 'Failed to update fee record.');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleShareReceipt = async () => {
    if (!receiptItem) return;
    try {
      await Share.share({
        message: `🏨 Smart Hostel MIS — Payment Receipt\n` +
          `Receipt No: ${receiptItem.receipt_no || 'N/A'}\n` +
          `Student: ${receiptItem.student_name} (${receiptItem.reg_no})\n` +
          `Fee: ${receiptItem.fee_name}\n` +
          `Amount Paid: ₹${Number(receiptItem.amount).toLocaleString('en-IN')}\n` +
          `Date: ${receiptItem.paid_date || 'N/A'}\n` +
          `Method: ${receiptItem.method || 'Online'}\n` +
          `Txn Ref: ${receiptItem.txn_ref || 'N/A'}\n` +
          `Status: PAID (Verified)`,
      });
    } catch (err) {
      console.error('Error sharing receipt:', err);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  // Multi-criteria filtering
  const filteredFees = useMemo(() => {
    return fees.filter((f) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          f.student_name?.toLowerCase().includes(q) ||
          f.reg_no?.toLowerCase().includes(q) ||
          f.fee_name?.toLowerCase().includes(q) ||
          f.receipt_no?.toLowerCase().includes(q) ||
          f.status?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // 2. Status Filter
      if (statusFilter !== 'All' && f.status !== statusFilter) {
        return false;
      }
      // 3. Fee Type Filter
      if (feeTypeFilter !== 'ALL' && String(f.fee_type_id) !== feeTypeFilter) {
        return false;
      }
      return true;
    });
  }, [fees, searchQuery, statusFilter, feeTypeFilter]);

  // Student specific dues summary
  const studentPersonalDues = useMemo(() => {
    if (user?.role !== 'student' || !user?.student) return null;
    const studentFees = fees.filter((f) => f.student_id === user.student.id);
    const pendingSum = studentFees
      .filter((f) => f.status === 'Pending' || f.status === 'Overdue')
      .reduce((sum, item) => sum + item.amount, 0);
    const countPending = studentFees.filter((f) => f.status === 'Pending' || f.status === 'Overdue').length;
    return { pendingSum, countPending };
  }, [fees, user]);

  if (authLoading || (loading && fees.length === 0)) {
    return <LoadingSpinner message="Loading fee records..." />;
  }
  if (error && fees.length === 0) return <ErrorView message={error} onRetry={fetchFeeData} />;

  return (
    <View style={styles.container}>
      {/* Student Personal Dues Alert Banner */}
      {Boolean(studentPersonalDues && studentPersonalDues.countPending > 0) ? (
        <View style={styles.studentDuesBanner}>
          <Ionicons name="warning" size={20} color="#B45309" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.studentDuesTitle}>You have outstanding hostel fees:</Text>
            <Text style={styles.studentDuesAmount}>
              {formatCurrency(studentPersonalDues.pendingSum)} pending ({studentPersonalDues.countPending} dues)
            </Text>
          </View>
        </View>
      ) : null}

      {/* Summary Cards Header */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, styles.cardGreen]}>
            <Text style={[styles.summaryVal, { color: '#15803D' }]}>
              {formatCurrency(summary?.total_collected)}
            </Text>
            <Text style={styles.summaryLabel}>Total Collected</Text>
          </Card>

          <Card style={[styles.summaryCard, styles.cardAmber]}>
            <Text style={[styles.summaryVal, { color: '#B45309' }]}>
              {formatCurrency(summary?.total_pending)}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </Card>

          <Card style={[styles.summaryCard, styles.cardRed]}>
            <Text style={[styles.summaryVal, { color: '#B91C1C' }]}>
              {summary?.total_overdue ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </Card>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.topBar}>
        <Text style={styles.sectionTitle}>
          Transactions ({filteredFees.length})
        </Text>
        {Boolean(canManageFees) ? (
          <Button
            title="+ Record Payment"
            onPress={handleOpenAdd}
            style={styles.addBtn}
          />
        ) : null}
      </View>

      {/* Fee Type Dropdown Filter */}
      <View style={styles.typeFilterRow}>
        <SelectPicker
          value={feeTypeFilter}
          onValueChange={setFeeTypeFilter}
          options={feeTypeFilterOptions}
          placeholder="Filter by Fee Type..."
          style={{ marginBottom: 0 }}
        />
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
          placeholder="Search by student, reg no, or receipt..."
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
        data={filteredFees}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            <Card style={styles.feeCard}>
              <View style={styles.feeHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.feeStudentName}>{item.student_name} ({item.reg_no})</Text>
                  <Text style={styles.feeType}>{item.fee_name} ({item.frequency})</Text>
                </View>
                <Badge label={item.status} />
              </View>

              <View style={styles.feeDetailsRow}>
                <Text style={styles.feeAmount}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.feeDate}>
                  {item.paid_date ? `Paid: ${item.paid_date}` : `Due: ${item.due_date || 'N/A'}`}
                </Text>
              </View>

              <View style={styles.feeFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.status === 'Paid' ? (
                    <Ionicons name="receipt-outline" size={14} color="#15803D" style={{ marginRight: 4 }} />
                  ) : null}
                  <Text style={styles.feeReceipt}>
                    {item.receipt_no || (item.txn_ref ? `Ref: ${item.txn_ref}` : 'Unpaid')}
                  </Text>
                </View>
                {Boolean(item.method) ? (
                  <Text style={styles.feeMethod}>Via {item.method}</Text>
                ) : null}
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={38} color="#CBD5E1" />
            <Text style={styles.emptyText}>No fee records found for the selected criteria.</Text>
          </View>
        }
      />

      {/* Digital Receipt Modal (for Paid records) */}
      <Modal visible={showReceiptModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptTopBorder} />
            <View style={styles.receiptHeader}>
              <View>
                <Text style={styles.receiptHostelTitle}>🏨 SMART HOSTEL MIS</Text>
                <Text style={styles.receiptHostelSubtitle}>Official Fee Payment Receipt</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptBody}>
              <View style={styles.receiptNumberRow}>
                <Text style={styles.receiptNumLabel}>RECEIPT NO:</Text>
                <Text style={styles.receiptNumVal}>{receiptItem?.receipt_no || 'N/A'}</Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptFieldLabel}>Student Name:</Text>
                <Text style={styles.receiptFieldVal}>{receiptItem?.student_name}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptFieldLabel}>Registration No:</Text>
                <Text style={styles.receiptFieldVal}>{receiptItem?.reg_no}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptFieldLabel}>Fee Description:</Text>
                <Text style={styles.receiptFieldVal}>{receiptItem?.fee_name} ({receiptItem?.frequency})</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptFieldLabel}>Payment Method:</Text>
                <Text style={styles.receiptFieldVal}>{receiptItem?.method || 'Online'}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptFieldLabel}>Payment Date:</Text>
                <Text style={styles.receiptFieldVal}>{receiptItem?.paid_date || 'N/A'}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptFieldLabel}>Transaction Ref:</Text>
                <Text style={styles.receiptFieldVal}>{receiptItem?.txn_ref || 'N/A'}</Text>
              </View>

              <View style={styles.receiptAmountBox}>
                <Text style={styles.receiptAmountLabel}>AMOUNT PAID</Text>
                <Text style={styles.receiptAmountVal}>{formatCurrency(receiptItem?.amount)}</Text>
                <View style={styles.verifiedStamp}>
                  <Text style={styles.verifiedStampText}>✓ VERIFIED & PAID</Text>
                </View>
              </View>

              <Button
                title="Share / Save Receipt"
                onPress={handleShareReceipt}
                style={{ marginTop: 14 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Record Payment Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Fee Payment</Text>
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

              <SelectPicker
                label="Select Student *"
                value={studentId}
                onValueChange={setStudentId}
                options={studentOptions}
                placeholder="Choose student..."
                searchable
                searchPlaceholder="Search by student name or reg..."
              />

              <SelectPicker
                label="Fee Type *"
                value={selectedFeeTypeId}
                onValueChange={handleFeeTypeChange}
                options={feeTypeOptions}
                placeholder="Choose fee type..."
              />

              <FormInput
                label="Amount (₹) *"
                value={amount}
                onChangeText={setAmount}
                placeholder="15000"
                keyboardType="numeric"
              />

              <SelectPicker
                label="Payment Status *"
                value={status}
                onValueChange={setStatus}
                options={PAYMENT_STATUSES}
              />

              {status === 'Paid' ? (
                <>
                  <SelectPicker
                    label="Payment Method *"
                    value={method}
                    onValueChange={setMethod}
                    options={PAYMENT_METHODS}
                  />

                  <FormInput
                    label="Transaction Reference / Note"
                    value={txnRef}
                    onChangeText={setTxnRef}
                    placeholder="e.g. UPI-98765432"
                  />
                </>
              ) : null}

              <FormInput
                label="Remarks (Optional)"
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Notes about payment"
              />

              <Button
                title="Save Payment Record"
                onPress={handleCreatePayment}
                loading={formSubmitting}
                style={{ marginTop: 10, marginBottom: 24 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Update Fee Modal */}
      <Modal visible={showUpdateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Payment #{selectedFee?.id}</Text>
              <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 10 }}>
              {Boolean(updateError) ? (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>{updateError}</Text>
                </View>
              ) : null}

              <Text style={styles.updateDesc}>
                Student: <Text style={{ fontWeight: '700' }}>{selectedFee?.student_name}</Text> ({selectedFee?.reg_no})
              </Text>
              <Text style={styles.updateDesc}>
                Item: {selectedFee?.fee_name} — {formatCurrency(selectedFee?.amount)}
              </Text>
              <Text style={styles.updateDesc}>
                Current Status: <Text style={{ fontWeight: '700' }}>{selectedFee?.status}</Text>
              </Text>

              <SelectPicker
                label="Update Status to *"
                value={updateStatus}
                onValueChange={setUpdateStatus}
                options={allowedNextStatuses}
                style={{ marginTop: 12 }}
              />

              {updateStatus === 'Paid' ? (
                <>
                  <SelectPicker
                    label="Payment Method *"
                    value={updateMethod}
                    onValueChange={setUpdateMethod}
                    options={PAYMENT_METHODS}
                  />

                  <FormInput
                    label="Transaction Reference"
                    value={updateTxnRef}
                    onChangeText={setUpdateTxnRef}
                    placeholder="e.g. UPI-123456"
                  />
                </>
              ) : null}

              <Button
                title="Confirm Status Update"
                onPress={handleUpdatePayment}
                loading={updateSubmitting}
                style={{ marginTop: 14 }}
              />
            </View>
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
  studentDuesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  studentDuesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  studentDuesAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryCard: {
    width: '31%',
    padding: 10,
    alignItems: 'center',
    marginVertical: 0,
  },
  cardGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cardAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  cardRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  addBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  typeFilterRow: {
    paddingHorizontal: 14,
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
    marginBottom: 6,
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
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  feeCard: {
    marginVertical: 4,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  feeStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  feeType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  feeDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  feeDate: {
    fontSize: 12,
    color: '#475569',
  },
  feeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  feeReceipt: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  feeMethod: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
  updateDesc: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
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
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  receiptTopBorder: {
    height: 4,
    backgroundColor: '#2563EB',
    borderRadius: 2,
    marginBottom: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptHostelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  receiptHostelSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  receiptBody: {
    marginTop: 14,
  },
  receiptNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
  },
  receiptNumLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  receiptNumVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  receiptFieldLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  receiptFieldVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  receiptAmountBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  receiptAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  receiptAmountVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15803D',
    marginVertical: 4,
  },
  verifiedStamp: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedStampText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
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
