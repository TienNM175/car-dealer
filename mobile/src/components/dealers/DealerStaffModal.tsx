// src/components/dealers/DealerStaffModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dealerApi } from '@/lib/api/dealerApi';
import type { Dealer } from '@/lib/api/dealerApi';
import { styles } from './styles';

interface DealerStaffModalProps {
  visible: boolean;
  dealer: Dealer | null;
  onClose: () => void;
}

export default function DealerStaffModal({
  visible,
  dealer,
  onClose,
}: DealerStaffModalProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dealer && visible) {
      loadStaff();
    }
  }, [dealer, visible]);

  const loadStaff = async () => {
    if (!dealer) return;
    
    try {
      setLoading(true);
      const response = await dealerApi.getDealerStaff(dealer.id);
      if (response.success) {
        setStaff(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!dealer) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nhân viên Đại lý</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionTitle}>
            Đại lý: {dealer.name} • {staff.length} nhân viên
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Đang tải danh sách nhân viên...</Text>
            </View>
          ) : staff.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>Chưa có nhân viên nào</Text>
              <Text style={styles.emptyStateText}>
                Danh sách nhân viên sẽ hiển thị ở đây khi có dữ liệu
              </Text>
            </View>
          ) : (
            <View style={styles.staffList}>
              {staff.map((staffMember) => (
                <View key={staffMember.id} style={styles.staffCard}>
                  <View style={styles.staffAvatar}>
                    <Ionicons name="person" size={24} color="#3b82f6" />
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>
                      {staffMember.lastName} {staffMember.firstName}
                    </Text>
                    <Text style={styles.staffEmail}>{staffMember.email}</Text>
                    <View style={styles.staffDetails}>
                      {staffMember.phone && (
                        <Text style={styles.staffDetail}>{staffMember.phone}</Text>
                      )}
                      <Text style={[
                        styles.staffRole, 
                        staffMember.role === 'DEALER_MANAGER' ? styles.managerRole : styles.staffRole
                      ]}>
                        {staffMember.role === 'DEALER_MANAGER' ? 'Quản lý' : 'Nhân viên'}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: staffMember.isActive ? '#10b98120' : '#ef444420' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: staffMember.isActive ? '#10b981' : '#ef4444' }
                    ]}>
                      {staffMember.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}