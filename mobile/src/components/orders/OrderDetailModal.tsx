// src/components/orders/OrderDetailModal.tsx
import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { X, Package, Truck, CheckCircle, Clock, Ban } from 'lucide-react-native';
import { DealerOrder } from '@/lib/api/dealerOrderApi';
import { styles } from './styles';

interface OrderDetailModalProps {
  visible: boolean;
  order: DealerOrder | null;
  onClose: () => void;
  onStatusChange?: (orderId: string, status: DealerOrder['status']) => void;
  userRole?: string;
}

export default function OrderDetailModal({ 
  visible, 
  order, 
  onClose, 
  onStatusChange,
  userRole 
}: OrderDetailModalProps) { // THÊM CÁC PROPS
  if (!visible || !order) return null;

  const getStatusConfig = (status: string) => {
    const config = {
      PENDING: { label: "Chờ xác nhận", color: "#f59e0b", icon: Clock },
      CONFIRMED: { label: "Đã xác nhận", color: "#3b82f6", icon: CheckCircle },
      PROCESSING: { label: "Đang xử lý", color: "#8b5cf6", icon: Package },
      SHIPPED: { label: "Đang giao", color: "#f97316", icon: Truck },
      DELIVERED: { label: "Đã giao", color: "#10b981", icon: CheckCircle },
      CANCELLED: { label: "Đã hủy", color: "#ef4444", icon: Ban },
    };
    return config[status as keyof typeof config] || config.PENDING;
  };

  // THÊM HÀM getNextStatus
  const getNextStatus = (currentStatus: DealerOrder['status']): DealerOrder['status'] | null => {
    const statusFlow = {
      PENDING: "CONFIRMED",
      CONFIRMED: "PROCESSING", 
      PROCESSING: "SHIPPED",
      SHIPPED: "DELIVERED",
      DELIVERED: null,
      CANCELLED: null,
    };
    return statusFlow[currentStatus] as DealerOrder['status'] | null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <StatusIcon size={24} color={statusConfig.color} />
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Order Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Mã đơn hàng</Text>
                  <Text style={styles.infoValue}>{order.orderNumber}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Trạng thái</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Ngày đặt</Text>
                  <Text style={styles.infoValue}>{formatDate(order.orderedAt)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Cập nhật</Text>
                  <Text style={styles.infoValue}>{formatDate(order.updatedAt)}</Text>
                </View>
              </View>
            </View>

            {/* Vehicle Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin xe</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Xe</Text>
                  <Text style={styles.infoValue}>
                    {order.vehicle?.manufacturer?.name} {order.vehicle?.model} {order.vehicle?.variant}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Số lượng</Text>
                  <Text style={styles.infoValue}>{order.quantity} xe</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Đơn giá</Text>
                  <Text style={styles.infoValue}>{formatCurrency(Number(order.unitPrice))}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tổng tiền</Text>
                  <Text style={[styles.infoValue, styles.totalAmount]}>
                    {formatCurrency(Number(order.totalAmount))}
                  </Text>
                </View>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lịch sử đơn hàng</Text>
              <View style={styles.timeline}>
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#10b981' }]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Đơn hàng được tạo</Text>
                    <Text style={styles.timelineDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                </View>
                
                {order.confirmedAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#3b82f6' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Đã xác nhận</Text>
                      <Text style={styles.timelineDate}>{formatDate(order.confirmedAt)}</Text>
                    </View>
                  </View>
                )}
                
                {order.shippedAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#f97316' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Đã giao hàng</Text>
                      <Text style={styles.timelineDate}>{formatDate(order.shippedAt)}</Text>
                    </View>
                  </View>
                )}
                
                {order.deliveredAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#10b981' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Đã giao thành công</Text>
                      <Text style={styles.timelineDate}>{formatDate(order.deliveredAt)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* EVM Staff Actions */}
            {(userRole === 'EVM_STAFF' || userRole === 'ADMIN') && order && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <View style={styles.actionSection}>
                <Text style={styles.sectionTitle}>Thao tác EVM</Text>
                <View style={styles.actionButtons}>
                  {getNextStatus(order.status) && (
                    <TouchableOpacity
                      style={[styles.statusActionButton, { backgroundColor: '#10b981' }]}
                      onPress={() => onStatusChange?.(order.id, getNextStatus(order.status)!)}
                    >
                      <Text style={styles.statusActionButtonText}>
                        Chuyển sang {getStatusConfig(getNextStatus(order.status)!).label}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Notes */}
            {order.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ghi chú</Text>
                <View style={styles.notesContainer}>
                  <Text style={styles.notesText}>{order.notes}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}