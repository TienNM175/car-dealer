// mobile/src/components/customers/CustomerDetailModal.tsx
import React from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '@/lib/api/customerApi';
import { STATUS_CONFIG } from '@/constants/customerStatus';
import { styles } from './styles';

interface CustomerDetailModalProps {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
}

export default function CustomerDetailModal({
  visible,
  customer,
  onClose,
}: CustomerDetailModalProps) {
  const { height } = Dimensions.get('window');
  const status = customer
    ? STATUS_CONFIG[customer.status as keyof typeof STATUS_CONFIG]
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.85 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết khách hàng</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {customer && (
            <ScrollView style={styles.modalBody}>
              {/* Basic Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
                <DetailRow label="Họ tên" value={`${customer.firstName} ${customer.lastName}`} />
                <DetailRow label="Email" value={customer.email} />
                {customer.phone && <DetailRow label="Điện thoại" value={customer.phone} />}
                {customer.address && <DetailRow label="Địa chỉ" value={customer.address} />}
                {customer.city && <DetailRow label="Thành phố" value={customer.city} />}
                {customer.identityCard && <DetailRow label="CCCD" value={customer.identityCard} />}
              </View>

              {/* Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trạng thái</Text>
                <View style={[styles.statusBadgeLarge, { backgroundColor: status?.color }]}>
                  <Text style={styles.statusTextLarge}>{status?.label}</Text>
                </View>
              </View>

              {/* Activity Counts */}
              {customer._count && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Hoạt động</Text>
                  <View style={styles.statsGrid}>
                    <StatItem label="Hợp đồng" value={customer._count.contracts} />
                    <StatItem label="Báo giá" value={customer._count.quotations} />
                    <StatItem label="Lái thử" value={customer._count.testDrives} />
                    <StatItem label="Phản hồi" value={customer._count.feedbacks} />
                    <StatItem label="Khiếu nại" value={customer._count.complaints} />
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Đóng</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}