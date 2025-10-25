// mobile/app/(dealer)/customers.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { customerApi } from '@/lib/api/customerApi';
import Toast from 'react-native-toast-message';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  status: string;
  createdAt: string;
}

export default function CustomersScreen() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, filterStatus]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerApi.getAllCustomers({
        search: searchTerm,
        status: filterStatus,
      });

      const responseData = res.data.data || [];
      setCustomers(Array.isArray(responseData) ? responseData : []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách khách hàng',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchCustomers().then(() => setRefreshing(false));
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      INTERESTED: '#3b82f6',
      CONTACTED: '#f59e0b',
      TEST_DRIVE: '#8b5cf6',
      QUOTED: '#ec4899',
      PURCHASED: '#10b981',
      COLD: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      INTERESTED: 'Quan tâm',
      CONTACTED: 'Đã liên hệ',
      TEST_DRIVE: 'Lái thử',
      QUOTED: 'Đã báo giá',
      PURCHASED: 'Đã mua',
      COLD: 'Từ chối',
    };
    return labels[status] || status;
  };

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => {
        setSelectedCustomer(item);
        setShowModal(true);
      }}
    >
      <View style={styles.customerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.firstName[0]}
            {item.lastName[0]}
          </Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.customerEmail}>{item.email}</Text>
          {item.city && <Text style={styles.customerCity}>📍 {item.city}</Text>}
        </View>
      </View>

      <View style={styles.customerFooter}>
        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </TouchableOpacity>
        {item.phone && <Text style={styles.phone}>📱 {item.phone}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khách hàng</Text>
        <Text style={styles.headerSubtitle}>
          {customers.length} khách hàng
        </Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#9ca3af"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {[
            { label: 'Tất cả', value: '' },
            { label: 'Quan tâm', value: 'INTERESTED' },
            { label: 'Đã mua', value: 'PURCHASED' },
            { label: 'Lái thử', value: 'TEST_DRIVE' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterChip,
                filterStatus === filter.value && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(filter.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === filter.value && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không có khách hàng</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomerCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết khách hàng</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedCustomer && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Họ tên</Text>
                    <Text style={styles.detailValue}>
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{selectedCustomer.email}</Text>
                  </View>
                  {selectedCustomer.phone && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Điện thoại</Text>
                      <Text style={styles.detailValue}>{selectedCustomer.phone}</Text>
                    </View>
                  )}
                  {selectedCustomer.city && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Thành phố</Text>
                      <Text style={styles.detailValue}>{selectedCustomer.city}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Trạng thái</Text>
                  <View
                    style={[
                      styles.statusBadgeLarge,
                      { backgroundColor: getStatusColor(selectedCustomer.status) },
                    ]}
                  >
                    <Text style={styles.statusTextLarge}>
                      {getStatusLabel(selectedCustomer.status)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Cập nhật trạng thái</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  listContent: {
    padding: 12,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  customerEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  customerCity: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  phone: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  statusBadgeLarge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusTextLarge: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});