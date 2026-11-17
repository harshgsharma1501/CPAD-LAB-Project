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
import SelectPicker from '../../src/components/SelectPicker';
import { LoadingSpinner, ErrorView } from '../../src/components/StatusViews';
import { Ionicons } from '@expo/vector-icons';

const ROOM_STATUS_OPTIONS = ['Available', 'Occupied', 'Partial', 'Maintenance'];
const ACADEMIC_YEAR_OPTIONS = ['2025-26', '2026-27', '2024-25'];
const STATUS_FILTER_OPTIONS = ['All', 'Available', 'Partial', 'Occupied', 'Maintenance'];

export default function RoomsScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [roomSearch, setRoomSearch] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('ALL');

  // Room detail modal
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetail, setRoomDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status Change Modal (PUT /api/rooms/:id)
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newRoomStatus, setNewRoomStatus] = useState('Available');
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Allocate modal (POST /api/rooms/allocate)
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateStudentId, setAllocateStudentId] = useState('');
  const [allocateAcademicYear, setAllocateAcademicYear] = useState('2025-26');
  const [allocateSubmitting, setAllocateSubmitting] = useState(false);
  const [allocateError, setAllocateError] = useState('');

  // EXACT match to server/routes/rooms.js authorize('admin', 'warden', 'sysadmin')
  const canManageRooms = ['admin', 'warden', 'sysadmin'].includes(user?.role);

  const fetchHostels = useCallback(async () => {
    if (!token || !user) return;
    try {
      setError(null);
      const [hostelsRes, studentsRes] = await Promise.all([
        api.get('/rooms/hostels'),
        api.get('/students'),
      ]);
      setHostels(hostelsRes.data);
      setAllStudents(studentsRes.data);
      if (hostelsRes.data.length > 0 && !selectedHostel) {
        setSelectedHostel(hostelsRes.data[0]);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.message?.includes('Network') || err.code === 'ECONNABORTED'
          ? 'Cannot reach server. Please check your network and ensure the backend is running.'
          : 'Failed to load hostels.');
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user, selectedHostel]);

  const fetchRooms = useCallback(async (hostelId) => {
    if (!token || !hostelId) return;
    setRoomsLoading(true);
    try {
      const res = await api.get(`/rooms?hostel_id=${hostelId}`);
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setRoomsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading || !token || !user) return;
    fetchHostels();
  }, [authLoading, token, user, fetchHostels]);

  useEffect(() => {
    if (authLoading || !token || !selectedHostel) return;
    fetchRooms(selectedHostel.id);
  }, [authLoading, token, selectedHostel, fetchRooms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHostels();
    if (selectedHostel) fetchRooms(selectedHostel.id);
  };

  const openRoomDetail = async (room) => {
    setSelectedRoom(room);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/rooms/${room.id}`);
      setRoomDetail(res.data);
      setNewRoomStatus(res.data.status);
    } catch (err) {
      setRoomDetail(room);
      setNewRoomStatus(room.status);
    } finally {
      setDetailLoading(false);
    }
  };

  // Convert real student records into selectable picker options (no typing raw IDs!)
  const studentPickerOptions = useMemo(() => {
    return allStudents.map((s) => ({
      label: `${s.name} (${s.reg_no})`,
      value: s.id,
      sublabel: s.room_number ? `Currently: Room ${s.room_number}` : 'No current allocation',
    }));
  }, [allStudents]);

  // Extract unique floors present in the current hostel for the Floor Dropdown Filter
  const floorOptions = useMemo(() => {
    const floorsSet = new Set(rooms.map((r) => r.floor));
    const sortedFloors = Array.from(floorsSet).sort((a, b) => a - b);
    return [
      { label: 'All Floors', value: 'ALL' },
      ...sortedFloors.map((f) => ({
        label: f === 0 ? 'Ground Floor (0)' : `Floor ${f}`,
        value: String(f),
      })),
    ];
  }, [rooms]);

  // Unique types (Single, Double, Triple)
  const typeOptions = useMemo(() => {
    return [
      { label: 'All Room Types', value: 'ALL' },
      { label: 'Single Bed', value: 'Single' },
      { label: 'Double Sharing', value: 'Double' },
      { label: 'Triple Sharing', value: 'Triple' },
    ];
  }, []);

  // Filter rooms based on search, floor, status, and room type
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // 1. Text search
      if (roomSearch.trim()) {
        const q = roomSearch.toLowerCase();
        const matchesText =
          r.room_number?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q) ||
          r.type?.toLowerCase().includes(q);
        if (!matchesText) return false;
      }
      // 2. Floor filter
      if (selectedFloor !== 'ALL' && String(r.floor) !== selectedFloor) {
        return false;
      }
      // 3. Status filter
      if (selectedStatus !== 'All' && r.status !== selectedStatus) {
        return false;
      }
      // 4. Type filter
      if (selectedType !== 'ALL' && r.type !== selectedType) {
        return false;
      }
      return true;
    });
  }, [rooms, roomSearch, selectedFloor, selectedStatus, selectedType]);

  // Summary counts for currently selected hostel
  const hostelStats = useMemo(() => {
    const available = rooms.filter((r) => r.status === 'Available').length;
    const partial = rooms.filter((r) => r.status === 'Partial').length;
    const occupied = rooms.filter((r) => r.status === 'Occupied').length;
    const maintenance = rooms.filter((r) => r.status === 'Maintenance').length;
    return { total: rooms.length, available, partial, occupied, maintenance };
  }, [rooms]);

  const unallocatedStudentsCount = useMemo(() => {
    return allStudents.filter((s) => !s.room_number).length;
  }, [allStudents]);

  const handleAllocate = async () => {
    setAllocateError('');
    if (!allocateStudentId) {
      setAllocateError('Please select a student from the list.');
      return;
    }

    const currentOccupants = roomDetail?.occupants?.length || 0;
    if (currentOccupants >= (roomDetail?.capacity || 2)) {
      setAllocateError(`Room is already full (${currentOccupants}/${roomDetail?.capacity} capacity).`);
      return;
    }

    setAllocateSubmitting(true);
    try {
      await api.post('/rooms/allocate', {
        student_id: parseInt(allocateStudentId, 10),
        room_id: selectedRoom.id,
        academic_year: allocateAcademicYear || '2025-26',
      });
      setShowAllocateModal(false);
      setShowDetailModal(false);
      setAllocateStudentId('');
      if (selectedHostel) fetchRooms(selectedHostel.id);
      fetchHostels();
    } catch (err) {
      setAllocateError(err.response?.data?.error || 'Allocation failed.');
    } finally {
      setAllocateSubmitting(false);
    }
  };

  const handleUpdateRoomStatus = async () => {
    setStatusError('');
    setStatusSubmitting(true);
    try {
      await api.put(`/rooms/${selectedRoom.id}`, { status: newRoomStatus });
      setShowStatusModal(false);
      const updated = { ...roomDetail, status: newRoomStatus };
      setRoomDetail(updated);
      setSelectedRoom(updated);
      if (selectedHostel) fetchRooms(selectedHostel.id);
    } catch (err) {
      setStatusError(err.response?.data?.error || 'Failed to update room status.');
    } finally {
      setStatusSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading hostels & rooms..." />;
  if (error && hostels.length === 0) return <ErrorView message={error} onRetry={fetchHostels} />;

  const isRoomFull = (roomDetail?.occupants?.length || 0) >= (roomDetail?.capacity || 2);
  const isMaintenance = roomDetail?.status === 'Maintenance';

  return (
    <View style={styles.container}>
      {/* Hostel Horizontal Filter */}
      <View style={styles.hostelPickerContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hostelTabs}>
          {hostels.map((h) => {
            const isSelected = selectedHostel?.id === h.id;
            return (
              <TouchableOpacity
                key={h.id}
                style={[styles.hostelTab, isSelected && styles.hostelTabActive]}
                onPress={() => setSelectedHostel(h)}
                activeOpacity={0.8}
              >
                <Text style={[styles.hostelTabText, isSelected && styles.hostelTabTextActive]}>
                  {h.name} ({h.type})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Hostel Quick Stats & Warden Info */}
      <View style={styles.statsBar}>
        <View style={styles.statsRow}>
          <Text style={styles.statPillGreen}>● {hostelStats.available} Available</Text>
          <Text style={styles.statPillYellow}>● {hostelStats.partial} Partial</Text>
          <Text style={styles.statPillRed}>● {hostelStats.occupied} Full</Text>
          {Boolean(hostelStats.maintenance > 0) ? (
            <Text style={styles.statPillPurple}>● {hostelStats.maintenance} Maint.</Text>
          ) : null}
        </View>

        {Boolean(canManageRooms && unallocatedStudentsCount > 0) ? (
          <View style={styles.unallocatedPill}>
            <Ionicons name="information-circle" size={14} color="#D97706" />
            <Text style={styles.unallocatedText}>
              {unallocatedStudentsCount} unallocated student{unallocatedStudentsCount > 1 ? 's' : ''} waiting
            </Text>
          </View>
        ) : null}
      </View>

      {/* Filter Controls Row: Floor Dropdown + Type Dropdown */}
      <View style={styles.dropdownFiltersRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <SelectPicker
            value={selectedFloor}
            onValueChange={setSelectedFloor}
            options={floorOptions}
            placeholder="Floor..."
            style={{ marginBottom: 0 }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <SelectPicker
            value={selectedType}
            onValueChange={setSelectedType}
            options={typeOptions}
            placeholder="Room Type..."
            style={{ marginBottom: 0 }}
          />
        </View>
      </View>

      {/* Status Filter Chips Row */}
      <View style={styles.chipsFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {STATUS_FILTER_OPTIONS.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusChip, selectedStatus === st && styles.statusChipActive]}
              onPress={() => setSelectedStatus(st)}
            >
              <Text style={[styles.statusChipText, selectedStatus === st && styles.statusChipTextActive]}>
                {st}
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
          placeholder="Search by room number (e.g. G01, 102)..."
          placeholderTextColor="#94A3B8"
          value={roomSearch}
          onChangeText={setRoomSearch}
          clearButtonMode="while-editing"
        />
        {Boolean(roomSearch) ? (
          <TouchableOpacity onPress={() => setRoomSearch('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Rooms Counter */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          Showing {filteredRooms.length} of {rooms.length} rooms in {selectedHostel?.name}
        </Text>
      </View>

      {roomsLoading ? (
        <LoadingSpinner message="Loading hostel rooms..." />
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.roomGrid}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.roomCol} onPress={() => openRoomDetail(item)} activeOpacity={0.7}>
              <Card style={styles.roomCard}>
                <View style={styles.roomCardTop}>
                  <Text style={styles.roomNumber}>Room {item.room_number}</Text>
                  <Badge label={item.status} />
                </View>

                <Text style={styles.roomMeta}>
                  {item.floor === 0 ? 'Ground Floor' : `Floor ${item.floor}`} • {item.type}
                </Text>
                <View style={styles.occupancyBarContainer}>
                  <Text style={styles.occupancyLabel}>
                    Occupants: {item.current_occupants || 0} / {item.capacity}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bed-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>No rooms match the selected filters.</Text>
            </View>
          }
        />
      )}

      {/* Room Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Room Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <LoadingSpinner message="Loading room data..." />
            ) : (
              <ScrollView style={styles.modalBody}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.roomDetailHeader}>
                    {selectedHostel?.name} — Room {roomDetail?.room_number}
                  </Text>
                  <Badge label={roomDetail?.status} />
                </View>

                <Text style={styles.detailItem}>Type: {roomDetail?.type}</Text>
                <Text style={styles.detailItem}>
                  Capacity: {roomDetail?.capacity} beds ({roomDetail?.occupants?.length || 0} filled)
                </Text>
                <Text style={styles.detailItem}>
                  Floor: {roomDetail?.floor === 0 ? 'Ground Floor' : `Floor ${roomDetail?.floor}`}
                </Text>
                <Text style={styles.detailItem}>
                  Amenities: {roomDetail?.amenities || 'Standard fixtures, fan, study desk'}
                </Text>

                {/* Occupants list */}
                <View style={styles.occupantSection}>
                  <Text style={styles.occupantSectionTitle}>
                    Current Occupants ({roomDetail?.occupants?.length || 0})
                  </Text>
                  {roomDetail?.occupants && roomDetail.occupants.length > 0 ? (
                    roomDetail.occupants.map((occ) => (
                      <View key={occ.id} style={styles.occupantItem}>
                        <Ionicons name="person-circle-outline" size={24} color="#2563EB" />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.occName}>{occ.name}</Text>
                          <Text style={styles.occMeta}>Reg: {occ.reg_no} • {occ.department}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noOccText}>No occupants currently residing in this room.</Text>
                  )}
                </View>

                {/* Role-restricted Actions (admin, warden, sysadmin) */}
                {canManageRooms && (
                  <View style={{ marginTop: 20 }}>
                    <Button
                      title={
                        isMaintenance
                          ? 'Cannot Allocate (Under Maintenance)'
                          : isRoomFull
                          ? 'Room Full (Max Capacity)'
                          : '+ Allocate Student to this Room'
                      }
                      onPress={() => {
                        setAllocateError('');
                        setAllocateStudentId(allStudents[0]?.id || '');
                        setShowAllocateModal(true);
                      }}
                      disabled={isRoomFull || isMaintenance}
                      style={{ marginBottom: 10 }}
                    />

                    <Button
                      title="Update Room Status"
                      variant="outline"
                      onPress={() => {
                        setStatusError('');
                        setShowStatusModal(true);
                      }}
                    />
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Allocate Form Modal */}
      <Modal visible={showAllocateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Allocate Room {selectedRoom?.room_number} ({selectedHostel?.name})
              </Text>
              <TouchableOpacity onPress={() => setShowAllocateModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 10 }}>
              {Boolean(allocateError) ? (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>{allocateError}</Text>
                </View>
              ) : null}

              <SelectPicker
                label="Select Student *"
                value={allocateStudentId}
                onValueChange={setAllocateStudentId}
                options={studentPickerOptions}
                placeholder="Choose student to allocate..."
                searchable
                searchPlaceholder="Search student by name or reg no..."
              />

              <SelectPicker
                label="Academic Year *"
                value={allocateAcademicYear}
                onValueChange={setAllocateAcademicYear}
                options={ACADEMIC_YEAR_OPTIONS}
              />

              <Button
                title="Confirm Allocation"
                onPress={handleAllocate}
                loading={allocateSubmitting}
                style={{ marginTop: 12 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Room Status Update Modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status — Room {selectedRoom?.room_number}</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 10 }}>
              {Boolean(statusError) ? (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>{statusError}</Text>
                </View>
              ) : null}

              <SelectPicker
                label="Room Status *"
                value={newRoomStatus}
                onValueChange={setNewRoomStatus}
                options={ROOM_STATUS_OPTIONS}
              />

              <Button
                title="Save Status"
                onPress={handleUpdateRoomStatus}
                loading={statusSubmitting}
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
  hostelPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  hostelTabs: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hostelTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  hostelTabActive: {
    backgroundColor: '#2563EB',
  },
  hostelTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  hostelTabTextActive: {
    color: '#FFFFFF',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPillGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  statPillYellow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  statPillRed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  statPillPurple: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
  },
  unallocatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unallocatedText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    marginLeft: 4,
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
  counterRow: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  counterText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  roomGrid: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  roomCol: {
    width: '48%',
  },
  roomCard: {
    padding: 12,
    marginVertical: 4,
  },
  roomCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  roomMeta: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  occupancyBarContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  occupancyLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
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
  roomDetailHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailItem: {
    fontSize: 13,
    color: '#334155',
    marginVertical: 3,
  },
  occupantSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  occupantSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  occupantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  occName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  occMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  noOccText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
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
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 13,
  },
});
