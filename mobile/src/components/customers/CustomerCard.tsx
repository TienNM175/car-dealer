// mobile/src/components/customers/CustomerCard.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '@/lib/api/customerApi';
import { STATUS_CONFIG } from '@/constants/customerStatus';
import { styles } from './styles';

interface CustomerCardProps {
  customer: Customer;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewFeedbacks: () => void;
  onViewComplaints: () => void;
}

export default function CustomerCard({
  customer,
  onViewDetail,
  onEdit,
  onDelete,
  onViewFeedbacks,
  onViewComplaints,
}: CustomerCardProps) {
  const status = STATUS_CONFIG[customer.status as keyof typeof STATUS_CONFIG];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onViewDetail}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {customer.firstName[0]}
            {customer.lastName[0]}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>
            {customer.firstName} {customer.lastName}
          </Text>
          <Text style={styles.email}>{customer.email}</Text>
          {customer.phone && (
            <Text style={styles.phone}>📱 {customer.phone}</Text>
          )}
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: status?.color }]}
        >
          <Text style={styles.statusText}>{status?.label}</Text>
        </View>
      </View>

      {/* City */}
      {customer.city && <Text style={styles.city}>📍 {customer.city}</Text>}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <ActionButton
          icon="eye-outline"
          label="Chi tiết"
          color="#2563eb"
          bgColor="#dbeafe"
          onPress={onViewDetail}
        />
        <ActionButton
          icon="pencil-outline"
          label="Sửa"
          color="#10b981"
          bgColor="#dcfce7"
          onPress={onEdit}
        />
        <ActionButton
          icon="trash-outline"
          label="Xóa"
          color="#ef4444"
          bgColor="#fee2e2"
          onPress={onDelete}
        />
        {(customer._count?.feedbacks ?? 0) > 0 && (
          <ActionButton
            icon="chatbubble-outline"
            label="FB"
            color="#f59e0b"
            bgColor="#fef3c7"
            onPress={onViewFeedbacks}
          />
        )}
        {(customer._count?.complaints ?? 0) > 0 && (
          <ActionButton
            icon="warning-outline"
            label="KN"
            color="#ef4444"
            bgColor="#fee2e2"
            onPress={onViewComplaints}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

function ActionButton({
  icon,
  label,
  color,
  bgColor,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: bgColor }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}