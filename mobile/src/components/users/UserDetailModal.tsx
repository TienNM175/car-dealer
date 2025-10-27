// mobile/src/components/users/UserDetailModal.tsx
import React from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/lib/types/user';
import { ROLE_CONFIG } from '@/constants/userRoles';
import { styles } from './styles';

interface UserDetailModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
}

export default function UserDetailModal({
  visible,
  user,
  onClose,
}: UserDetailModalProps) {
  const { height } = Dimensions.get('window');
  const roleConfig = user ? ROLE_CONFIG[user.role] : null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.85 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết User</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {user && (
            <ScrollView style={styles.modalBody}>
              {/* Avatar & Name */}
              <View style={styles.detailSection}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarTextLarge}>
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </Text>
                </View>
                <Text style={styles.detailName}>
                  {user.firstName} {user.lastName}
                </Text>
              </View>

              {/* Contact Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                <DetailRow
                  label="Email"
                  value={user.email}
                  icon="mail-outline"
                />
                {user.phone && (
                  <DetailRow
                    label="Điện thoại"
                    value={user.phone}
                    icon="call-outline"
                  />
                )}
              </View>

              {/* Role */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vai trò</Text>
                <View style={[styles.roleBadgeLarge, { backgroundColor: roleConfig?.color }]}>
                  <Text style={styles.roleBadgeText}>
                    {roleConfig?.label}
                  </Text>
                  <Text style={styles.roleDescription}>
                    {roleConfig?.description}
                  </Text>
                </View>
              </View>

              {/* Dealer Info */}
              {user.dealer && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dealer</Text>
                  <View style={styles.dealerBox}>
                    <Ionicons name="business-outline" size={20} color="#16a34a" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.dealerName}>{user.dealer.name}</Text>
                      <Text style={styles.dealerCode}>{user.dealer.code}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Status & Dates */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Trạng thái</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: user.isActive ? '#10b981' : '#ef4444' },
                      ]}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Ngày tạo</Text>
                    <Text style={styles.infoValue}>
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </View>
              </View>

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

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color="#2563eb" style={{ marginRight: 12 }} />
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

