import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SelectPicker({
  label,
  value,
  onValueChange,
  options = [], // Array of string OR { label, value, sublabel, disabled }
  placeholder = 'Select an option',
  searchable = false,
  searchPlaceholder = 'Search...',
  error,
  disabled = false,
  style,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize options to { label, value, sublabel, disabled }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { label: String(opt), value: opt, sublabel: null, disabled: false };
    }
    return {
      label: opt.label,
      value: opt.value,
      sublabel: opt.sublabel || null,
      disabled: !!opt.disabled,
    };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  const filteredOptions = searchable && searchQuery.trim()
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : normalizedOptions;

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onValueChange(opt.value);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, style]}>
      {Boolean(label) ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[
          styles.trigger,
          disabled && styles.disabledTrigger,
          error && styles.errorTrigger,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedOption && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748B" />
      </TouchableOpacity>
      {Boolean(error) ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Picker Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Optional Search Bar */}
            {Boolean(searchable) ? (
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>
            ) : null}

            {/* Options List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => String(item.value ?? index)}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      isSelected && styles.selectedOptionItem,
                      item.disabled && styles.disabledOptionItem,
                    ]}
                    onPress={() => handleSelect(item)}
                    disabled={item.disabled}
                    activeOpacity={0.6}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.selectedOptionLabel,
                          item.disabled && styles.disabledOptionLabel,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {Boolean(item.sublabel) ? (
                        <Text style={styles.optionSublabel}>{item.sublabel}</Text>
                      ) : null}
                    </View>
                    {Boolean(isSelected) ? (
                      <Ionicons name="checkmark" size={20} color="#2563EB" />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No options available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  disabledTrigger: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  errorTrigger: {
    borderColor: '#EF4444',
  },
  triggerText: {
    fontSize: 14,
    color: '#0F172A',
    flex: 1,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  list: {
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  selectedOptionItem: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  disabledOptionItem: {
    opacity: 0.4,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  selectedOptionLabel: {
    color: '#2563EB',
    fontWeight: '700',
  },
  disabledOptionLabel: {
    color: '#94A3B8',
  },
  optionSublabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
