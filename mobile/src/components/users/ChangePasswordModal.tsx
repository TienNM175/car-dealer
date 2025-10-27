// mobile/src/components/users/ChangePasswordModal.tsx
import React, { useState } from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '@/lib/api/users';
import { User } from '@/lib/types/user';
import Toast from 'react-native-toast-message';
import { styles } from './styles';

interface ChangePasswordModalProps {
  visible: boolean;
  user: User | null;
  loading: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  showPassword,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  showPassword: boolean;
  onToggleShow: () => void;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          style={styles.formInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          onPress={onToggleShow}
          style={{ position: 'absolute', right: 12, top: 10 }}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#6b7280"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordModal({
  visible,
  user,
  loading,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const { height } = Dimensions.get('window');
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordsMatch = formData.newPassword === formData.confirmPassword;

  const handleSubmit = async () => {
    if (!user) return;

    if (!formData.oldPassword) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập mật khẩu hiện tại',
      });
      return;
    }

    if (!formData.newPassword) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập mật khẩu mới',
      });
      return;
    }

    if (!passwordsMatch) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu không khớp',
      });
      return;
    }

    try {
      await usersApi.changePassword(user.id, {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Mật khẩu đã được đổi',
      });
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: err.response?.data?.message || 'Không thể đổi mật khẩu',
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.9 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đổi Mật khẩu</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <PasswordField
              label="Mật khẩu hiện tại *"
              value={formData.oldPassword}
              onChangeText={(text) => setFormData({ ...formData, oldPassword: text })}
              placeholder="••••••••"
              showPassword={showOld}
              onToggleShow={() => setShowOld(!showOld)}
            />

            <PasswordField
              label="Mật khẩu mới *"
              value={formData.newPassword}
              onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
              placeholder="••••••••"
              showPassword={showNew}
              onToggleShow={() => setShowNew(!showNew)}
            />

            <PasswordField
              label="Xác nhận mật khẩu *"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder="••••••••"
              showPassword={showConfirm}
              onToggleShow={() => setShowConfirm(!showConfirm)}
            />

            {formData.confirmPassword && !passwordsMatch && (
              <View style={{ marginBottom: 12, padding: 10, backgroundColor: '#fee2e2', borderRadius: 8 }}>
                <Text style={{ color: '#dc2626', fontSize: 12 }}>❌ Mật khẩu không khớp</Text>
              </View>
            )}

            {passwordsMatch && formData.confirmPassword && (
              <View style={{ marginBottom: 12, padding: 10, backgroundColor: '#dcfce7', borderRadius: 8 }}>
                <Text style={{ color: '#15803d', fontSize: 12 }}>✓ Mật khẩu khớp</Text>
              </View>
            )}
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
              disabled={loading || !passwordsMatch}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Đổi Mật khẩu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}