// app/(dealer)/orders.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, ActivityIndicator, SafeAreaView,
  RefreshControl, TextInput, TouchableOpacity, Modal,
  ScrollView, KeyboardAvoidingView, Platform, Alert
} from "react-native";
import { Search, Filter, Plus, Eye, Edit, Trash2, Package, Truck, CheckCircle, Clock, Ban } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { dealerOrderApi, DealerOrder } from "@/lib/api/dealerOrderApi";
import { styles } from "@/components/orders/styles";
import OrderDetailModal from "@/components/orders/OrderDetailModal";
import CreateOrderModal from '@/components/orders/CreateOrderModal';

export default function DealerOrdersScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  // Pagination
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(0);
  
  // Selected order for actions
  const [selectedOrder, setSelectedOrder] = useState<DealerOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
  if (!user?.dealerId) return;

  try {
    setLoading(true);
    
    // Log để debug
    console.log('🔄 Fetching orders with params:', {
      search: searchTerm,
      status: filterStatus,
      dealerId: user.dealerId,
      page: currentPage + 1,
      limit: itemsPerPage
    });

    const response = await dealerOrderApi.getAllDealerOrders(
      {
        search: searchTerm,
        status: filterStatus,
        dealerId: user.dealerId,
      },
      { page: currentPage + 1, limit: itemsPerPage }
    );
    
    console.log('✅ API Response:', response.data);
    
    const responseData = response.data.data || response.data;
    const orders = Array.isArray(responseData) ? responseData : responseData.data || [];
    setOrders(orders);
  } catch (err: any) {
    console.error('❌ API Error Details:', {
      url: err.config?.url,
      method: err.config?.method,
      status: err.response?.status,
      data: err.response?.data
    });
    
    Alert.alert("Lỗi", err.response?.data?.message || "Không thể tải danh sách đơn hàng");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    if (user?.dealerId) {
      fetchOrders();
    }
  }, [user?.dealerId, currentPage, searchTerm, filterStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleViewDetail = (order: DealerOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCancelOrder = async (order: DealerOrder) => {
    if (order.status !== 'PENDING') {
      Alert.alert("Lỗi", "Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận");
      return;
    }

    Alert.alert(
      "Xác nhận hủy",
      `Bạn có chắc muốn hủy đơn hàng ${order.orderNumber}?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xác nhận", 
          style: "destructive",
          onPress: async () => {
            try {
              await dealerOrderApi.cancelDealerOrder(order.id, "Hủy từ mobile app");
              Alert.alert("Thành công", "Đã hủy đơn hàng thành công");
              fetchOrders();
            } catch (err: any) {
              Alert.alert("Lỗi", err.response?.data?.message || "Không thể hủy đơn hàng");
            }
          }
        },
      ]
    );
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderOrderCard = ({ item }: { item: DealerOrder }) => {
    const statusConfig = getStatusConfig(item.status);
    const StatusIcon = statusConfig.icon;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.vehicleName}>
              {item.vehicle?.manufacturer?.name} {item.vehicle?.model}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
            <StatusIcon size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số lượng:</Text>
            <Text style={styles.detailValue}>{item.quantity} xe</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tổng tiền:</Text>
            <Text style={styles.detailValue}>{formatCurrency(Number(item.totalAmount))}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày đặt:</Text>
            <Text style={styles.detailValue}>{formatDate(item.orderedAt)}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleViewDetail(item)}
          >
            <Eye size={16} color="#3b82f6" />
            <Text style={[styles.actionButtonText, { color: "#3b82f6" }]}>Chi tiết</Text>
          </TouchableOpacity>
          
          {item.status === 'PENDING' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelOrder(item)}
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={[styles.actionButtonText, { color: "#ef4444" }]}>Hủy</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn đặt hàng</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý đơn đặt xe từ đại lý
        </Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <Search size={18} color="#6b7280" />
            <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm đơn hàng..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
            />
        </View>
        
        {/* Nút Tạo đơn hàng - Chỉ hiện cho Manager */}
        {(user?.role === 'DEALER_MANAGER' || user?.role === 'ADMIN') && (
            <TouchableOpacity 
            style={styles.createOrderButton}
            onPress={() => setShowCreateModal(true)}
            >
            <Plus size={18} color="#fff" />
            <Text style={styles.createOrderButtonText}>Tạo đơn</Text>
            </TouchableOpacity>
        )}
        </View>


      {/* Order List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          </View>
        }
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        visible={showDetailModal}
        order={selectedOrder}
        onClose={() => setShowDetailModal(false)}
      />
      <CreateOrderModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchOrders}
        />
    </SafeAreaView>
  );
}