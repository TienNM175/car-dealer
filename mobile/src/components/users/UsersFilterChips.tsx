// UsersFilterChips.tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { UserRole } from '@/lib/types/user';

interface UsersFilterChipsProps {
  selectedRole: UserRole | '';
  selectedStatus: 'all' | 'active' | 'inactive';
  onRoleChange: (role: UserRole | '') => void;
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
  roleFilters: { label: string; value: UserRole | '' }[];
  statusFilters: { label: string; value: 'all' | 'active' | 'inactive' }[];
}

export function UsersFilterChips({
  selectedRole,
  selectedStatus,
  onRoleChange,
  onStatusChange,
  roleFilters,
  statusFilters,
}: UsersFilterChipsProps) {
  return (
    <View style={styles.container}>
      {/* Role Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {roleFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[styles.chip, selectedRole === filter.value && styles.chipActive]}
            onPress={() => onRoleChange(filter.value)}
          >
            <Text style={[styles.chipText, selectedRole === filter.value && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Status Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[styles.chip, selectedStatus === filter.value && styles.chipActive]}
            onPress={() => onStatusChange(filter.value)}
          >
            <Text style={[styles.chipText, selectedStatus === filter.value && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#fff',
  },
});
