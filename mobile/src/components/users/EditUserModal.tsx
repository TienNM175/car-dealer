// mobile/src/components/users/EditUserModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '@/lib/api/users';
import { User } from '@/lib/types/user';
import Toast from 'react-native-toast-message';
import { styles } from './styles';

interface EditUserModalProps {
  visible: boolean;
  user: User | null;
  loading: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: any;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

export default function EditUserModal({
  visible,
  user,
  loading,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const { height } = Dimensions.get('window');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
      });
    }
  }, [user, visible]);

  const handleSubmit = async () => {
    if (!user) return;

    try {
      await usersApi.update(user.id, formData);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'User đã được cập nhật',
      });
      onSuccess();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: err.response?.data?.message || 'Không thể cập nhật user',
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.9 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chỉnh sửa User</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <FormField
              label="Họ"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              placeholder="Nguyễn"
            />

            <FormField
              label="Tên"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              placeholder="Văn A"
            />

            <FormField
              label="Điện thoại"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="0901234567"
              keyboardType="phone-pad"
            />
          </ScrollView>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}