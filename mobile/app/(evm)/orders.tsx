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
import { styles } from "@/components/orders/evmOrdersStyles";

export default function EVMOrdersScreen() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth(); // THÊM authLoading
  const router = useRouter();

  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDealer, setFilterDealer] = useState("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showDealerFilter, setShowDealerFilter] = useState(false);

  // Selected order
  const [selectedOrder, setSelectedOrder] = useState<DealerOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Auth guard - chỉ EVM Staff và Admin
  useEffect(() => {
    if (
      !authLoading &&
      (!isAuthenticated ||
        (user?.role !== "EVM_STAFF" && user?.role !== "ADMIN"))
    ) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, authLoading, user]);

  // Fetch all orders (EVM Staff có thể xem tất cả orders)
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await dealerOrderApi.getAllDealerOrders(
        {
          search: searchTerm,
          status: filterStatus || undefined,
          dealerId: filterDealer || undefined,
        },
        { page: 1, limit: 50 } // EVM Staff xem nhiều orders hơn
      );

      const responseData = response.data.data || response.data;
      const ordersData = Array.isArray(responseData)
        ? responseData
        : responseData.data || [];
      setOrders(ordersData);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể tải danh sách đơn hàng"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === "EVM_STAFF" || user?.role === "ADMIN") {
      fetchOrders();
    }
  }, [user, searchTerm, filterStatus, filterDealer]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleViewDetail = (order: DealerOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Update order status - EVM Staff có thể update status
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: DealerOrder["status"]
  ) => {
    try {
      setUpdatingStatus(orderId);

      await dealerOrderApi.updateDealerOrderStatus(orderId, newStatus);

      Alert.alert(
        "Thành công",
        `Đã cập nhật trạng thái đơn hàng thành ${
          getStatusConfig(newStatus).label
        }`
      );

      // Refresh orders
      fetchOrders();

      // Close detail modal if open
      if (showDetailModal) {
        setShowDetailModal(false);
      }
    } catch (err: any) {
      console.error("Error updating order status:", err);
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Cancel order - EVM Staff có thể cancel nhiều trạng thái
  const handleCancelOrder = async (order: DealerOrder) => {
    if (order.status === "DELIVERED") {
      Alert.alert("Lỗi", "Không thể hủy đơn hàng đã giao");
      return;
    }

    if (order.status === "CANCELLED") {
      Alert.alert("Thông báo", "Đơn hàng đã được hủy trước đó");
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
              await dealerOrderApi.cancelDealerOrder(
                order.id,
                "Hủy bởi EVM Staff"
              );
              Alert.alert("Thành công", "Đã hủy đơn hàng thành công");
              fetchOrders();
            } catch (err: any) {
              Alert.alert(
                "Lỗi",
                err.response?.data?.message || "Không thể hủy đơn hàng"
              );
            }
          },
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

  // THÊM HÀM getNextStatus
  const getNextStatus = (
    currentStatus: DealerOrder["status"]
  ): DealerOrder["status"] | null => {
    const statusFlow = {
      PENDING: "CONFIRMED",
      CONFIRMED: "PROCESSING",
      PROCESSING: "SHIPPED",
      SHIPPED: "DELIVERED",
      DELIVERED: null,
      CANCELLED: null,
    };
    return statusFlow[currentStatus] as DealerOrder["status"] | null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Get unique dealers for filter
  const uniqueDealers = Array.from(
    new Set(orders.map((order) => order.dealer?.name).filter(Boolean))
  ) as string[];

  const renderOrderCard = ({ item }: { item: DealerOrder }) => {
    const statusConfig = getStatusConfig(item.status);
    const StatusIcon = statusConfig.icon;
    const nextStatus = getNextStatus(item.status);
    const canUpdateStatus =
      nextStatus && user?.role && ["EVM_STAFF", "ADMIN"].includes(user.role);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.dealerName}>{item.dealer?.name}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + "20" },
            ]}
          >
            <StatusIcon size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Xe:</Text>
            <Text style={styles.detailValue}>
              {item.vehicle?.manufacturer?.name} {item.vehicle?.model}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số lượng:</Text>
            <Text style={styles.detailValue}>{item.quantity} xe</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tổng tiền:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(Number(item.totalAmount))}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày đặt:</Text>
            <Text style={styles.detailValue}>{formatDate(item.orderedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Người tạo:</Text>
            <Text style={styles.detailValue}>
              {item.staff?.firstName} {item.staff?.lastName}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleViewDetail(item)}
          >
            <Eye size={16} color="#3b82f6" />
            <Text style={[styles.actionButtonText, { color: "#3b82f6" }]}>
              Chi tiết
            </Text>
          </TouchableOpacity>

          {/* Update Status Button - chỉ hiện khi có thể update */}
          {canUpdateStatus && (
            <TouchableOpacity
              style={[styles.actionButton, styles.updateButton]}
              onPress={() => handleUpdateStatus(item.id, nextStatus!)}
              disabled={updatingStatus === item.id}
            >
              <CheckCircle size={16} color="#10b981" />
              <Text style={[styles.actionButtonText, { color: "#10b981" }]}>
                {updatingStatus === item.id
                  ? "..."
                  : getStatusConfig(nextStatus!).label}
              </Text>
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
      <Header title="Quản lý đơn hàng EVM" />

      {/* Subtitle */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>
          Quản lý tất cả đơn hàng từ các đại lý
        </Text>
      </View>

      {/* Search & Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm đơn hàng, đại lý..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {/* Status Filter */}
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowStatusFilter(!showStatusFilter)}
          >
            <Text style={styles.filterButtonText}>
              {filterStatus
                ? getStatusConfig(filterStatus).label
                : "Tất cả trạng thái"}
            </Text>
            <ChevronDown size={16} color="#6b7280" />
          </TouchableOpacity>

          {showStatusFilter && (
            <View style={styles.filterDropdown}>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => {
                  setFilterStatus("");
                  setShowStatusFilter(false);
                }}
              >
                <Text style={styles.filterOptionText}>Tất cả trạng thái</Text>
              </TouchableOpacity>
              {[
                "PENDING",
                "CONFIRMED",
                "PROCESSING",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED",
              ].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.filterOption}
                  onPress={() => {
                    setFilterStatus(status);
                    setShowStatusFilter(false);
                  }}
                >
                  <Text style={styles.filterOptionText}>
                    {getStatusConfig(status).label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Dealer Filter */}
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowDealerFilter(!showDealerFilter)}
          >
            <Text style={styles.filterButtonText}>
              {filterDealer ? filterDealer : "Tất cả đại lý"}
            </Text>
            <ChevronDown size={16} color="#6b7280" />
          </TouchableOpacity>

          {showDealerFilter && (
            <View style={styles.filterDropdown}>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => {
                  setFilterDealer("");
                  setShowDealerFilter(false);
                }}
              >
                <Text style={styles.filterOptionText}>Tất cả đại lý</Text>
              </TouchableOpacity>
              {uniqueDealers.map((dealer) => (
                <TouchableOpacity
                  key={dealer}
                  style={styles.filterOption}
                  onPress={() => {
                    setFilterDealer(dealer);
                    setShowDealerFilter(false);
                  }}
                >
                  <Text style={styles.filterOptionText}>{dealer}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
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
        onStatusChange={handleUpdateStatus}
        userRole={user?.role || "EVM_STAFF"}
      />
    </SafeAreaView>
  );
}
