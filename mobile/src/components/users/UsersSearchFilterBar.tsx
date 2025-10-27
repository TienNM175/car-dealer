// mobile/src/components/users/UsersSearchFilterBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { UserRole } from '@/lib/types/user';

interface UsersSearchFilterBarProps {
  searchValue: string;
  onSearchChange: (text: string) => void;
  selectedRole: UserRole | '';
  onRoleChange: (role: UserRole | '') => void;
  roleFilters: { label: string; value: UserRole | '' }[];
}

export function UsersSearchFilterBar({
  searchValue,
  onSearchChange,
  selectedRole,
  onRoleChange,
  roleFilters,
}: UsersSearchFilterBarProps) {
  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Tìm theo email, tên..."
          value={searchValue}
          onChangeText={onSearchChange}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Role filter */}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedRole}
          onValueChange={(value) => onRoleChange(value)}
          style={styles.picker}
          mode="dropdown"
        >
          {roleFilters.map((item) => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
              color="#1f2937"
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
   container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 12,
    gap: 8,
  },
  searchWrapper: {
    flex: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    height: 44,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: Platform.OS === 'ios' ? 10 : 6, // căn padding cho iOS/Android
  },
  pickerWrapper: {
    flex: 1.8, // nhỏ hơn search, chữ không bị cắt
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    height: 44,
    justifyContent: Platform.OS === 'ios' ? 'center' : 'flex-start', // iOS picker căn giữa
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 44 : 44, // buộc set height để hiển thị đầy đủ
    color: '#1f2937',
    fontSize: 14,
  },
});
