// mobile/src/components/users/DeleteConfirmModal.tsx

import React from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/lib/types/user';
import { ROLE_CONFIG } from '@/constants/userRoles';
import { styles } from './styles';

export function DeleteConfirmModal({
  visible,
  user,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  user: User | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <Ionicons name="warning" size={48} color="#ef4444" />

          <Text style={styles.confirmTitle}>Xác nhận xóa</Text>

          <Text style={styles.confirmMessage}>
            Bạn có chắc muốn xóa user {user?.email}? Hành động này không thể hoàn tác.
          </Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.cancelConfirmBtn}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelConfirmBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteConfirmBtn}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <Ionicons name="hourglass" size={18} color="#fff" />
              ) : (
                <Text style={styles.deleteConfirmBtnText}>Xóa</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}