// mobile/src/components/users/AssignDealerModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Text, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '@/lib/api/users';
import { dealersApi } from '@/lib/api/dealer';
import { User } from '@/lib/types/user';
import Toast from 'react-native-toast-message';
import { styles } from './styles';

interface AssignDealerModalProps {
  visible: boolean;
  user: User | null;
  loading: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignDealerModal({
  visible,
  user,
  loading,
  onClose,
  onSuccess,
}: AssignDealerModalProps) {
  const { height } = Dimensions.get('window');
  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [loadingDealers, setLoadingDealers] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadDealers();
      setSelectedDealerId(user.dealerId || '');
    }
  }, [visible, user]);

  const loadDealers = async () => {
    setLoadingDealers(true);
    try {
      const response = await dealersApi.list({ page: 1, limit: 100 });
      setDealers(response.data);
    } catch (err) {
      console.error('Error loading dealers:', err);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách dealers',
      });
    } finally {
      setLoadingDealers(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedDealerId) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng chọn dealer',
      });
      return;
    }

    try {
      await usersApi.assignToDealer(user.id, selectedDealerId);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'User đã được gán vào dealer',
      });
      onSuccess();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: err.response?.data?.message || 'Không thể gán dealer',
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.9 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gán Dealer</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Current Dealer Info */}
            {user?.dealer && (
              <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#dbeafe', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#2563eb' }}>
                <Text style={{ fontSize: 12, color: '#1e40af', fontWeight: '600', marginBottom: 6 }}>
                  DEALER HIỆN TẠI
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                  {user.dealer.name}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {user.dealer.code}
                </Text>
              </View>
            )}

            {/* Dealer List */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 }}>
              Chọn Dealer Mới *
            </Text>

            {loadingDealers ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : dealers.length === 0 ? (
              <Text style={{ color: '#6b7280', textAlign: 'center', paddingVertical: 20 }}>
                Không có dealer nào
              </Text>
            ) : (
              dealers.map((dealer) => (
                <TouchableOpacity
                  key={dealer.id}
                  style={[
                    styles.dealerOption,
                    selectedDealerId === dealer.id && styles.dealerOptionSelected,
                  ]}
                  onPress={() => setSelectedDealerId(dealer.id)}
                >
                  <View style={styles.dealerOptionContent}>
                    <Text style={styles.dealerOptionName}>{dealer.name}</Text>
                    <Text style={styles.dealerOptionCode}>{dealer.code}</Text>
                    {dealer.city && (
                      <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                        📍 {dealer.city}
                      </Text>
                    )}
                  </View>
                  {selectedDealerId === dealer.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))
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
              style={[styles.submitBtn, { opacity: !selectedDealerId || loading ? 0.5 : 1 }]}
              onPress={handleSubmit}
              disabled={loading || !selectedDealerId}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Gán Dealer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}