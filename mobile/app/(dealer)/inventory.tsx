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
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  Package,
  Search,
  RefreshCw,
  Filter,
  Eye,
  Edit,
  ShoppingCart,
  CheckSquare,
  X as CloseIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import Header from "@/components/shared/Header";
import inventoryApi, {
  DealerInventory,
  UpdateDealerInventoryInput,
  ReserveInventoryInput,
  CompleteSaleInput,
  CancelReservationInput,
} from "@/lib/api/inventoryApi";
import { StyleSheet } from "react-native";

export default function DealerInventoryScreen() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [inventory, setInventory] = useState<DealerInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(0);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DealerInventory | null>(
    null
  );

  // Forms
  const [editForm, setEditForm] = useState<UpdateDealerInventoryInput>({});
  const [reserveForm, setReserveForm] = useState<ReserveInventoryInput>({
    quantity: 0,
  });
  const [saleForm, setSaleForm] = useState<CompleteSaleInput>({ quantity: 0 });
  const [cancelForm, setCancelForm] = useState<CancelReservationInput>({
    quantity: 0,
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.dealerId)) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, authLoading, user]);

  // Fetch inventory
  const fetchInventory = async () => {
    if (!user?.dealerId) return;

    try {
      setError(null);
      const response = await inventoryApi.getDealerInventory(user.dealerId);
      setInventory(response.data.data);
      setCurrentPage(0); // Reset page khi refresh
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu tồn kho");
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.dealerId) {
      fetchInventory();
    }
  }, [user?.dealerId]);

  // Reset page khi search
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const handleEdit = (item: DealerInventory) => {
    setSelectedItem(item);
    setEditForm({
      quantity: item.quantity,
      reserved: item.reserved,
      sold: item.sold,
      location: item.location,
    });
    setShowEditModal(true);
  };

  const handleReserve = (item: DealerInventory) => {
    setSelectedItem(item);
    setReserveForm({ quantity: 0 });
    setShowReserveModal(true);
  };

  const handleCompleteSale = (item: DealerInventory) => {
    setSelectedItem(item);
    setSaleForm({ quantity: 0 });
    setShowSaleModal(true);
  };

  const handleCancelReservation = (item: DealerInventory) => {
    setSelectedItem(item);
    setCancelForm({ quantity: 0 });
    setShowCancelModal(true);
  };

  const submitEdit = async () => {
    if (!selectedItem || !user?.dealerId) return;

    try {
      await inventoryApi.updateDealerInventory(
        user.dealerId,
        selectedItem.vehicleId,
        editForm
      );
      setSuccess("Cập nhật tồn kho thành công!");
      setShowEditModal(false);
      fetchInventory();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể cập nhật tồn kho"
      );
    }
  };

  const submitReserve = async () => {
    if (
      !selectedItem ||
      !user?.dealerId ||
      !reserveForm.quantity ||
      reserveForm.quantity <= 0
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập số lượng hợp lệ");
      return;
    }

    try {
      await inventoryApi.reserveInventory(
        user.dealerId,
        selectedItem.vehicleId,
        reserveForm
      );
      setSuccess("Đặt trước thành công!");
      setShowReserveModal(false);
      fetchInventory();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể đặt trước");
    }
  };

  const submitCompleteSale = async () => {
    if (
      !selectedItem ||
      !user?.dealerId ||
      !saleForm.quantity ||
      saleForm.quantity <= 0
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập số lượng hợp lệ");
      return;
    }

    try {
      await inventoryApi.completeSale(
        user.dealerId,
        selectedItem.vehicleId,
        saleForm
      );
      setSuccess("Hoàn thành bán hàng thành công!");
      setShowSaleModal(false);
      fetchInventory();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể hoàn thành bán hàng"
      );
    }
  };

  const submitCancelReservation = async () => {
    if (
      !selectedItem ||
      !user?.dealerId ||
      !cancelForm.quantity ||
      cancelForm.quantity <= 0
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập số lượng hợp lệ");
      return;
    }

    try {
      await inventoryApi.cancelReservation(
        user.dealerId,
        selectedItem.vehicleId,
        cancelForm
      );
      setSuccess("Hủy đặt trước thành công!");
      setShowCancelModal(false);
      fetchInventory();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể hủy đặt trước"
      );
    }
  };

  const getStockStatus = (available: number) => {
    if (available > 50) return { label: "Tốt", color: "#10b981" };
    if (available > 20) return { label: "Bình thường", color: "#f59e0b" };
    return { label: "Thấp", color: "#ef4444" };
  };

  const filteredInventory = inventory.filter((item) =>
    item.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedData = filteredInventory.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (authLoading || !user?.dealerId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderInventoryCard = ({ item }: { item: DealerInventory }) => {
    const status = getStockStatus(item.available);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.vehicle.model}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.color + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tổng</Text>
            <Text style={styles.statValue}>{item.quantity}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Đã đặt</Text>
            <Text style={styles.statValue}>{item.reserved}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Đã bán</Text>
            <Text style={styles.statValue}>{item.sold}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Khả dụng</Text>
            <Text style={styles.statValue}>{item.available}</Text>
          </View>
        </View>

        {item.location && (
          <Text style={styles.locationText}>📍 {item.location}</Text>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Edit size={14} color="#10b981" />
            <Text style={[styles.actionButtonText, { color: "#10b981" }]}>
              Sửa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.reserveButton]}
            onPress={() => handleReserve(item)}
          >
            <Package size={14} color="#3b82f6" />
            <Text style={[styles.actionButtonText, { color: "#3b82f6" }]}>
              Đặt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saleButton]}
            onPress={() => handleCompleteSale(item)}
          >
            <CheckSquare size={14} color="#8b5cf6" />
            <Text style={[styles.actionButtonText, { color: "#8b5cf6" }]}>
              Bán
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelReservation(item)}
          >
            <CloseIcon size={14} color="#ef4444" />
            <Text style={[styles.actionButtonText, { color: "#ef4444" }]}>
              Hủy
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Quản lý kho" />

      {/* Stats */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>
          Tổng: {filteredInventory.length} xe | Trang {currentPage + 1} /{" "}
          {totalPages}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm xe..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Success/Error Messages */}
      {success && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorMessage}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={paginatedData}
            keyExtractor={(item) => item.id}
            renderItem={renderInventoryCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#3b82f6"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>Không có dữ liệu tồn kho</Text>
              </View>
            }
          />
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === 0 && styles.disabledButton,
                ]}
                onPress={handlePrevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft
                  size={20}
                  color={currentPage === 0 ? "#9ca3af" : "#3b82f6"}
                />
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage === 0 && styles.disabledText,
                  ]}
                >
                  Trước
                </Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>
                Trang {currentPage + 1} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === totalPages - 1 && styles.disabledButton,
                ]}
                onPress={handleNextPage}
                disabled={currentPage === totalPages - 1}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage === totalPages - 1 && styles.disabledText,
                  ]}
                >
                  Sau
                </Text>
                <ChevronRight
                  size={20}
                  color={currentPage === totalPages - 1 ? "#9ca3af" : "#3b82f6"}
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa tồn kho</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <CloseIcon size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Số lượng</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editForm.quantity?.toString() || ""}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, quantity: parseInt(text) || 0 })
                  }
                  placeholder="Nhập số lượng"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Vị trí</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.location || ""}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, location: text })
                  }
                  placeholder="Nhập vị trí kho"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButtonModal}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitEdit}
              >
                <Text style={styles.submitButtonText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reserve Modal */}
      <Modal visible={showReserveModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đặt trước</Text>
              <TouchableOpacity onPress={() => setShowReserveModal(false)}>
                <CloseIcon size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Số lượng đặt trước</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={reserveForm.quantity?.toString() || ""}
                  onChangeText={(text) =>
                    setReserveForm({ quantity: parseInt(text) || 0 })
                  }
                  placeholder="Nhập số lượng"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButtonModal}
                onPress={() => setShowReserveModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitReserve}
              >
                <Text style={styles.submitButtonText}>Đặt trước</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Complete Sale Modal */}
      <Modal visible={showSaleModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hoàn thành bán hàng</Text>
              <TouchableOpacity onPress={() => setShowSaleModal(false)}>
                <CloseIcon size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Số lượng đã bán</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={saleForm.quantity?.toString() || ""}
                  onChangeText={(text) =>
                    setSaleForm({ quantity: parseInt(text) || 0 })
                  }
                  placeholder="Nhập số lượng"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButtonModal}
                onPress={() => setShowSaleModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitCompleteSale}
              >
                <Text style={styles.submitButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Cancel Reservation Modal */}
      <Modal visible={showCancelModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hủy đặt trước</Text>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                <CloseIcon size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Số lượng hủy</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={cancelForm.quantity?.toString() || ""}
                  onChangeText={(text) =>
                    setCancelForm({ quantity: parseInt(text) || 0 })
                  }
                  placeholder="Nhập số lượng"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButtonModal}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitCancelReservation}
              >
                <Text style={styles.submitButtonText}>Xác nhận hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#fff",
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
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 14,
  },
  emptyText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    minWidth: "22%",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  locationText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    gap: 6,
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
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButton: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  reserveButton: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  saleButton: {
    borderColor: "#8b5cf6",
    backgroundColor: "#f5f3ff",
  },
  cancelButton: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  successMessage: {
    backgroundColor: "#d1fae5",
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  successText: {
    color: "#065f46",
    fontSize: 14,
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  cancelButtonModal: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // Pagination Styles
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b82f6",
    backgroundColor: "#fff",
  },
  disabledButton: {
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  paginationButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  disabledText: {
    color: "#9ca3af",
  },
  pageInfo: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
});
