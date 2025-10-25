// mobile/src/components/customers/ComplaintModal.tsx
import React from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '@/lib/api/customerApi';
import { styles } from './styles';

interface ComplaintModalProps {
  visible: boolean;
  customer: Customer | null;
  complaints: any[];
  onClose: () => void;
}

export default function ComplaintModal({
  visible,
  customer,
  complaints,
  onClose,
}: ComplaintModalProps) {
  const { height } = Dimensions.get('window');

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.85 }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Khiếu nại từ {customer?.firstName} {customer?.lastName}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalBody}>
            {complaints && complaints.length > 0 ? (
              complaints.map((cp) => (
                <View key={cp.id} style={styles.complaintItem}>
                  {/* Title */}
                  <Text style={styles.complaintTitle}>{cp.title}</Text>

                  {/* Description */}
                  <Text style={styles.complaintDescription}>{cp.description}</Text>

                  {/* Status Badge */}
                  {cp.status && (
                    <View
                      style={[
                        styles.complaintStatusBadge,
                        { backgroundColor: getStatusColor(cp.status) },
                      ]}
                    >
                      <Text style={styles.complaintStatusText}>
                        {cp.status}
                      </Text>
                    </View>
                  )}

                  {/* Date */}
                  {cp.createdAt && (
                    <Text style={styles.complaintDate}>
                      {new Date(cp.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  )}

                  {/* Resolution Notes */}
                  {cp.resolutionNotes && (
                    <View style={styles.complaintResolution}>
                      <Text style={styles.complaintResolutionLabel}>
                        Ghi chú xử lý:
                      </Text>
                      <Text style={styles.complaintResolutionText}>
                        {cp.resolutionNotes}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="warning-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyMessage}>Không có khiếu nại nào</Text>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}