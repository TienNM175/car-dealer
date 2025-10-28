import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import {
  Search,
  Filter,
  Eye,
  ChevronDown,
  CheckCircle,
  Package,
  Truck,
  Clock,
  Ban,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import Header from "@/components/shared/Header";
import { dealerOrderApi, DealerOrder } from "@/lib/api/dealerOrderApi";
import OrderDetailModal from "@/components/orders/OrderDetailModal";

export default function DealerOrdersScreen() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  // Selected order
  const [selectedOrder, setSelectedOrder] = useState<DealerOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const statusOptions = [
    { label: "Tất cả", value: "" },
    { label: "Chờ xử lý", value: "PENDING" },
    { label: "Đã xác nhận", value: "CONFIRMED" },
    { label: "Đang sản xuất", value: "IN_PRODUCTION" },
    { label: "Đã hoàn thành", value: "COMPLETED" },
    { label: "Đã giao hàng", value: "DELIVERED" },
    { label: "Đã hủy", value: "CANCELLED" },
  ];

  useEffect(() => {
    if (isAuthenticated && user?.dealerId) {
      fetchOrders();
    }
  }, [isAuthenticated, user?.dealerId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await dealerOrderApi.getAllDealerOrders({
        dealerId: user?.dealerId,
        status: filterStatus || undefined,
        search: searchTerm || undefined,
      });
      setOrders(response.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleViewDetail = (order: DealerOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const getStatusConfig = (status: string) => {
    const config = {
      PENDING: { label: "Chờ xử lý", color: "#f59e0b", icon: Clock },
      CONFIRMED: { label: "Đã xác nhận", color: "#3b82f6", icon: CheckCircle },
      IN_PRODUCTION: {
        label: "Đang sản xuất",
        color: "#8b5cf6",
        icon: Package,
      },
      COMPLETED: {
        label: "Đã hoàn thành",
        color: "#10b981",
        icon: CheckCircle,
      },
      DELIVERED: { label: "Đã giao hàng", color: "#059669", icon: Truck },
      CANCELLED: { label: "Đã hủy", color: "#ef4444", icon: Ban },
    };
    return config[status as keyof typeof config] || config.PENDING;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const renderOrderCard = ({ item }: { item: DealerOrder }) => {
    const statusConfig = getStatusConfig(item.status);
    const StatusIcon = statusConfig.icon;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleViewDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color },
            ]}
          >
            <StatusIcon size={12} color="#fff" />
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          <Text style={styles.orderTitle}>{item.vehicle?.model || "N/A"}</Text>
          <Text style={styles.orderSubtitle}>
            {item.vehicle?.manufacturer?.name || "N/A"}
          </Text>

          <View style={styles.orderDetails}>
            <Text style={styles.orderDetail}>Số lượng: {item.quantity}</Text>
            <Text style={styles.orderDetail}>
              Tổng tiền: {formatPrice(item.totalAmount)}
            </Text>
            <Text style={styles.orderDetail}>
              Ngày đặt: {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewDetail(item)}
          >
            <Eye size={16} color="#2563eb" />
            <Text style={styles.actionButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Đơn hàng" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Đơn hàng của tôi" />

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitleText}>Quản lý đơn hàng từ hãng xe</Text>
      </View>

      {/* Search & Filters */}
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

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowStatusFilter(!showStatusFilter)}
        >
          <Filter size={18} color="#6b7280" />
          <Text style={styles.filterButtonText}>Trạng thái</Text>
          <ChevronDown size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Status Filter Dropdown */}
      {showStatusFilter && (
        <View style={styles.filterDropdown}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterOption,
                filterStatus === option.value && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilterStatus(option.value);
                setShowStatusFilter(false);
                fetchOrders();
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filterStatus === option.value &&
                    styles.filterOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Orders List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        visible={showDetailModal}
        order={selectedOrder}
        onClose={() => setShowDetailModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  subtitleText: {
    fontSize: 14,
    color: "#6b7280",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  filterDropdown: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 12,
  },
  filterOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  filterOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#374151",
  },
  filterOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  listContent: {
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 14,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
  orderContent: {
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  orderSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  orderDetails: {
    gap: 4,
  },
  orderDetail: {
    fontSize: 13,
    color: "#6b7280",
  },
  orderActions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewButton: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
  },
});
