import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { contractApi, Contract } from "@/lib/api/contractApi";
import { useRouter } from "expo-router";

export default function DealerContractsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const fetchContracts = async () => {
    try {
      setLoading(true);

      const filters = filterStatus ? { status: filterStatus } : undefined;
      const response = await contractApi.getAllContracts(filters);
      const contractsData = response.data.data?.data || [];
      setContracts(contractsData);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách hợp đồng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [filterStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#10b981";
      case "SIGNED":
        return "#3b82f6";
      case "DELIVERING":
        return "#f59e0b";
      case "PENDING":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Hoàn thành";
      case "SIGNED":
        return "Đã ký";
      case "DELIVERING":
        return "Đang giao";
      case "PENDING":
        return "Chờ xử lý";
      default:
        return status;
    }
  };

  const filteredContracts = filterStatus
    ? contracts.filter((c) => c.status === filterStatus)
    : contracts;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleContractPress = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  };

  if (loading && contracts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Create Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/(dealer)/contract-create")}
        >
          <Text style={styles.createButtonText}>+ Tạo hợp đồng</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, !filterStatus && styles.filterTabActive]}
            onPress={() => setFilterStatus("")}
          >
            <Text
              style={[
                styles.filterTabText,
                !filterStatus && styles.filterTabTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterStatus === "PENDING" && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus("PENDING")}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === "PENDING" && styles.filterTabTextActive,
              ]}
            >
              Chờ xử lý
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterStatus === "SIGNED" && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus("SIGNED")}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === "SIGNED" && styles.filterTabTextActive,
              ]}
            >
              Đã ký
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterStatus === "COMPLETED" && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus("COMPLETED")}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === "COMPLETED" && styles.filterTabTextActive,
              ]}
            >
              Hoàn thành
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contract List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredContracts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có hợp đồng nào</Text>
          </View>
        ) : (
          filteredContracts.map((contract) => (
            <TouchableOpacity
              key={contract.id}
              style={styles.contractCard}
              onPress={() => handleContractPress(contract)}
            >
              <View style={styles.contractHeader}>
                <Text style={styles.contractCode}>{contract.contractCode}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(contract.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusLabel(contract.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.contractInfo}>
                <Text style={styles.label}>Khách hàng:</Text>
                <Text style={styles.value}>
                  {contract.customer.firstName} {contract.customer.lastName}
                </Text>
              </View>

              <View style={styles.contractInfo}>
                <Text style={styles.label}>Xe:</Text>
                <Text style={styles.value}>
                  {contract.vehicle.manufacturer.name} {contract.vehicle.model}
                </Text>
              </View>

              <View style={styles.contractInfo}>
                <Text style={styles.label}>Thành tiền:</Text>
                <Text style={styles.price}>
                  {formatPrice(contract.finalPrice)}
                </Text>
              </View>

              {contract.signedAt && (
                <View style={styles.contractInfo}>
                  <Text style={styles.label}>Ngày ký:</Text>
                  <Text style={styles.value}>
                    {new Date(contract.signedAt).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedContract && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết hợp đồng</Text>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Mã hợp đồng:</Text>
                    <Text style={styles.modalValue}>
                      {selectedContract.contractCode}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Khách hàng:</Text>
                    <Text style={styles.modalValue}>
                      {selectedContract.customer.firstName}{" "}
                      {selectedContract.customer.lastName}
                    </Text>
                    <Text style={styles.modalSubValue}>
                      {selectedContract.customer.email}
                    </Text>
                    {selectedContract.customer.phone && (
                      <Text style={styles.modalSubValue}>
                        {selectedContract.customer.phone}
                      </Text>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Xe:</Text>
                    <Text style={styles.modalValue}>
                      {selectedContract.vehicle.manufacturer.name}{" "}
                      {selectedContract.vehicle.model}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Giá gốc:</Text>
                    <Text style={styles.modalValue}>
                      {formatPrice(selectedContract.basePrice)}
                    </Text>
                  </View>

                  {selectedContract.discount > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Chiết khấu:</Text>
                      <Text style={[styles.modalValue, { color: "#10b981" }]}>
                        -{formatPrice(selectedContract.discount)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Thành tiền:</Text>
                    <Text style={[styles.modalValue, styles.modalPrice]}>
                      {formatPrice(selectedContract.finalPrice)}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Thanh toán:</Text>
                    <Text style={styles.modalValue}>
                      {selectedContract.paymentType === "FULL"
                        ? "Trả thẳng"
                        : `Trả góp ${selectedContract.installmentMonths} tháng`}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Trạng thái:</Text>
                    <View
                      style={[
                        styles.modalStatusBadge,
                        {
                          backgroundColor: getStatusColor(
                            selectedContract.status
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.modalStatusText}>
                        {getStatusLabel(selectedContract.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Ngày tạo:</Text>
                    <Text style={styles.modalValue}>
                      {new Date(selectedContract.createdAt).toLocaleString(
                        "vi-VN"
                      )}
                    </Text>
                  </View>

                  {selectedContract.signedAt && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Ngày ký:</Text>
                      <Text style={styles.modalValue}>
                        {new Date(selectedContract.signedAt).toLocaleString(
                          "vi-VN"
                        )}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </>
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
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  createButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 14,
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  filterTabActive: {
    backgroundColor: "#2563eb",
  },
  filterTabText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
  },
  contractCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  contractCode: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  contractInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    fontSize: 24,
    color: "#6b7280",
  },
  modalScroll: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  modalSubValue: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10b981",
  },
  modalStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
});
