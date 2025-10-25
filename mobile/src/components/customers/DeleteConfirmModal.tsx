// mobile/src/components/customers/DeleteConfirmModal.tsx
import React from 'react';
import { Modal, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '@/lib/api/customerApi';
import { styles } from './styles';

interface DeleteConfirmModalProps {
  visible: boolean;
  customer: Customer | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  visible,
  customer,
  loading,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          
          <Text style={styles.confirmTitle}>Xác nhận xóa</Text>
          
          <Text style={styles.confirmMessage}>
            Bạn có chắc chắn muốn xóa khách hàng{' '}
            <Text style={{ fontWeight: '600' }}>
              {customer?.firstName} {customer?.lastName}
            </Text>
            ?
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
                <ActivityIndicator color="#fff" />
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