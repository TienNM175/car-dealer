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
  FlatList,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { contractApi, Contract } from "@/lib/api/contractApi";
import { useRouter } from "expo-router";
import {
  globalStyles,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "@/styles/globalStyles";

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

  const renderContractCard = ({ item: contract }: { item: Contract }) => (
    <TouchableOpacity
      style={styles.contractCard}
      onPress={() => handleContractPress(contract)}
      activeOpacity={0.7}
    >
      <View style={styles.contractHeader}>
        <View style={styles.contractCodeContainer}>
          <Text style={styles.contractCode}>{contract.contractCode}</Text>
          <Text style={styles.contractDate}>
            {new Date(contract.createdAt).toLocaleDateString("vi-VN")}
          </Text>
        </View>
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

      <View style={styles.contractBody}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerLabel}>Khách hàng</Text>
          <Text style={styles.customerName}>
            {contract.customer.firstName} {contract.customer.lastName}
          </Text>
          <Text style={styles.customerEmail}>{contract.customer.email}</Text>
        </View>

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Xe</Text>
          <Text style={styles.vehicleName}>
            {contract.vehicle.manufacturer.name} {contract.vehicle.model}
          </Text>
        </View>

        <View style={styles.paymentInfo}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Giá gốc:</Text>
            <Text style={styles.paymentValue}>
              {formatPrice(contract.basePrice)}
            </Text>
          </View>
          {contract.discount > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Chiết khấu:</Text>
              <Text style={styles.discountValue}>
                -{formatPrice(contract.discount)}
              </Text>
            </View>
          )}
          <View style={styles.paymentRow}>
            <Text style={styles.totalLabel}>Thành tiền:</Text>
            <Text style={styles.totalValue}>
              {formatPrice(contract.finalPrice)}
            </Text>
          </View>
        </View>

        <View style={styles.contractActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Chi tiết</Text>
          </TouchableOpacity>
          {contract.status === "PENDING" && (
            <TouchableOpacity style={styles.primaryActionButton}>
              <Text style={styles.primaryActionButtonText}>Cập nhật</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && contracts.length === 0) {
    return (
      <View style={globalStyles.container}>
        <View style={globalStyles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
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
      <FlatList
        data={filteredContracts}
        renderItem={renderContractCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={globalStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={globalStyles.emptyContainer}>
            <Text style={globalStyles.emptyText}>Không có hợp đồng nào</Text>
            <Text style={styles.emptySubtext}>Tạo hợp đồng mới để bắt đầu</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            {selectedContract && (
              <>
                <View style={globalStyles.modalHeader}>
                  <Text style={globalStyles.modalTitle}>Chi tiết hợp đồng</Text>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  <View style={globalStyles.modalBody}>
                    {/* Contract Header */}
                    <View style={styles.modalContractHeader}>
                      <View style={styles.modalContractCodeContainer}>
                        <Text style={styles.modalContractCode}>
                          {selectedContract.contractCode}
                        </Text>
                        <Text style={styles.modalContractDate}>
                          Tạo ngày:{" "}
                          {new Date(
                            selectedContract.createdAt
                          ).toLocaleDateString("vi-VN")}
                        </Text>
                      </View>
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

                    {/* Customer Info */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        Thông tin khách hàng
                      </Text>
                      <View style={styles.modalInfoCard}>
                        <Text style={styles.modalInfoLabel}>Họ tên:</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedContract.customer.firstName}{" "}
                          {selectedContract.customer.lastName}
                        </Text>
                        <Text style={styles.modalInfoLabel}>Email:</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedContract.customer.email}
                        </Text>
                        {selectedContract.customer.phone && (
                          <>
                            <Text style={styles.modalInfoLabel}>
                              Số điện thoại:
                            </Text>
                            <Text style={styles.modalInfoValue}>
                              {selectedContract.customer.phone}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Vehicle Info */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Thông tin xe</Text>
                      <View style={styles.modalInfoCard}>
                        <Text style={styles.modalInfoLabel}>Xe:</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedContract.vehicle.manufacturer.name}{" "}
                          {selectedContract.vehicle.model}
                        </Text>
                      </View>
                    </View>

                    {/* Payment Info */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        Thông tin thanh toán
                      </Text>
                      <View style={styles.modalPaymentCard}>
                        <View style={styles.modalPaymentRow}>
                          <Text style={styles.modalPaymentLabel}>Giá gốc:</Text>
                          <Text style={styles.modalPaymentValue}>
                            {formatPrice(selectedContract.basePrice)}
                          </Text>
                        </View>
                        {selectedContract.discount > 0 && (
                          <View style={styles.modalPaymentRow}>
                            <Text style={styles.modalPaymentLabel}>
                              Chiết khấu:
                            </Text>
                            <Text style={styles.modalDiscountValue}>
                              -{formatPrice(selectedContract.discount)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.modalPaymentRow}>
                          <Text style={styles.modalPaymentLabel}>
                            Hình thức thanh toán:
                          </Text>
                          <Text style={styles.modalPaymentValue}>
                            {selectedContract.paymentType === "FULL"
                              ? "Trả thẳng"
                              : `Trả góp ${selectedContract.installmentMonths} tháng`}
                          </Text>
                        </View>
                        <View
                          style={[styles.modalPaymentRow, styles.modalTotalRow]}
                        >
                          <Text style={styles.modalTotalLabel}>
                            Thành tiền:
                          </Text>
                          <Text style={styles.modalTotalValue}>
                            {formatPrice(selectedContract.finalPrice)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Contract Actions */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        onPress={() => setShowDetailModal(false)}
                      >
                        <Text style={styles.secondaryActionButtonText}>
                          Đóng
                        </Text>
                      </TouchableOpacity>
                      {selectedContract.status === "PENDING" && (
                        <TouchableOpacity
                          style={styles.primaryActionButton}
                          onPress={() => {
                            Alert.alert(
                              "Cập nhật",
                              "Tính năng đang phát triển"
                            );
                            setShowDetailModal(false);
                          }}
                        >
                          <Text style={styles.primaryActionButtonText}>
                            Cập nhật trạng thái
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
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
  // Header Container
  headerContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  createButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.white,
  },

  // Filter Container
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginLeft: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    ...typography.bodySmall,
    fontWeight: "500",
    color: colors.gray600,
  },
  filterTabTextActive: {
    color: colors.white,
  },

  // Contract Card
  contractCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.md,
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  contractCodeContainer: {
    flex: 1,
  },
  contractCode: {
    ...typography.h4,
    fontWeight: "bold",
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  contractDate: {
    ...typography.caption,
    color: colors.gray500,
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.white,
  },

  // Contract Body
  contractBody: {
    padding: spacing.lg,
  },

  // Customer Info
  customerInfo: {
    marginBottom: spacing.md,
  },
  customerLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  customerName: {
    ...typography.body,
    fontWeight: "600",
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  customerEmail: {
    ...typography.bodySmall,
    color: colors.gray600,
  },

  // Vehicle Info
  vehicleInfo: {
    marginBottom: spacing.md,
  },
  vehicleLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  vehicleName: {
    ...typography.body,
    fontWeight: "500",
    color: colors.gray800,
  },

  // Payment Info
  paymentInfo: {
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  paymentLabel: {
    ...typography.bodySmall,
    color: colors.gray600,
  },
  paymentValue: {
    ...typography.bodySmall,
    fontWeight: "500",
    color: colors.gray800,
  },
  discountValue: {
    ...typography.bodySmall,
    fontWeight: "500",
    color: colors.danger,
  },
  totalLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.gray800,
  },
  totalValue: {
    ...typography.h4,
    fontWeight: "bold",
    color: colors.success,
  },

  // Contract Actions
  contractActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  actionButtonText: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.gray700,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  primaryActionButtonText: {
    color: colors.white,
  },

  // Empty State
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.gray400,
    marginTop: spacing.xs,
  },

  // Modal Styles
  modalScroll: {
    flex: 1,
  },
  modalContractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalContractCodeContainer: {
    flex: 1,
  },
  modalContractCode: {
    ...typography.h3,
    fontWeight: "bold",
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  modalContractDate: {
    ...typography.bodySmall,
    color: colors.gray500,
  },
  modalStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  modalStatusText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.white,
  },

  // Modal Section
  modalSection: {
    marginBottom: spacing.xl,
  },
  modalSectionTitle: {
    ...typography.h4,
    color: colors.gray700,
    marginBottom: spacing.md,
  },

  // Modal Info Card
  modalInfoCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  modalInfoLabel: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.gray600,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  modalInfoValue: {
    ...typography.body,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },

  // Modal Payment Card
  modalPaymentCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  modalPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  modalPaymentLabel: {
    ...typography.bodySmall,
    color: colors.gray600,
  },
  modalPaymentValue: {
    ...typography.bodySmall,
    fontWeight: "500",
    color: colors.gray800,
  },
  modalDiscountValue: {
    ...typography.bodySmall,
    fontWeight: "500",
    color: colors.danger,
  },
  modalTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  modalTotalLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.gray800,
  },
  modalTotalValue: {
    ...typography.h4,
    fontWeight: "bold",
    color: colors.success,
  },

  // Modal Actions
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  secondaryActionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  secondaryActionButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.gray700,
  },
  primaryActionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  primaryActionButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.white,
  },

  // Close Button
  closeButton: {
    fontSize: 24,
    color: colors.gray500,
    fontWeight: "bold",
  },
});
