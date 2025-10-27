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
import {
  globalStyles,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "@/styles/globalStyles";

export default function EVMContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const userRole = user?.role?.toUpperCase() || 'EVM_STAFF';
  const isAdmin = userRole === 'ADMIN';

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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'SIGNED': return colors.info;
      case 'COMPLETED': return colors.success;
      case 'CANCELLED': return colors.danger;
      default: return colors.gray500;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ ký';
      case 'SIGNED': return 'Đã ký';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading && contracts.length === 0) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>Đang tải danh sách hợp đồng...</Text>
      </View>
    );
  }

  const renderContractCard = ({ item: contract }: { item: Contract }) => (
    <TouchableOpacity
      style={styles.contractCard}
      onPress={() => {
        setSelectedContract(contract);
        setShowDetailModal(true);
      }}
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
            { backgroundColor: getStatusColor(contract.status) }
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusText(contract.status)}
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
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setSelectedContract(contract);
              setShowDetailModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>Chi tiết</Text>
          </TouchableOpacity>
          {isAdmin && contract.status === "PENDING" && (
            <TouchableOpacity style={styles.primaryActionButton}>
              <Text style={styles.primaryActionButtonText}>Xem xét</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Quản lý hợp đồng</Text>
        <Text style={styles.headerSubtitle}>
          Tổng cộng: {contracts.length} hợp đồng
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === "" && styles.filterTabActive]}
            onPress={() => setFilterStatus("")}
          >
            <Text style={[styles.filterTabText, filterStatus === "" && styles.filterTabTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === "PENDING" && styles.filterTabActive]}
            onPress={() => setFilterStatus("PENDING")}
          >
            <Text style={[styles.filterTabText, filterStatus === "PENDING" && styles.filterTabTextActive]}>
              Chờ ký
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === "SIGNED" && styles.filterTabActive]}
            onPress={() => setFilterStatus("SIGNED")}
          >
            <Text style={[styles.filterTabText, filterStatus === "SIGNED" && styles.filterTabTextActive]}>
              Đã ký
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === "COMPLETED" && styles.filterTabActive]}
            onPress={() => setFilterStatus("COMPLETED")}
          >
            <Text style={[styles.filterTabText, filterStatus === "COMPLETED" && styles.filterTabTextActive]}>
              Hoàn thành
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contracts List */}
      <FlatList
        data={contracts}
        renderItem={renderContractCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={globalStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={globalStyles.emptyContainer}>
            <Text style={globalStyles.emptyText}>Chưa có hợp đồng nào</Text>
            <Text style={styles.emptySubtext}>
              Các đại lý sẽ tạo hợp đồng và hiển thị ở đây
            </Text>
          </View>
        }
      />

      {/* Contract Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <View style={globalStyles.modalHeader}>
              <Text style={globalStyles.modalTitle}>Chi tiết hợp đồng</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedContract && (
              <>
                <ScrollView style={styles.modalScroll}>
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
                        {getStatusText(selectedContract.status)}
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
                        {selectedContract.customer.firstName} {selectedContract.customer.lastName}
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
                        {selectedContract.vehicle.manufacturer.name} {selectedContract.vehicle.model}
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
                            ? "Trả một lần"
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
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.secondaryActionButton}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.secondaryActionButtonText}>
                      Đóng
                    </Text>
                  </TouchableOpacity>
                  {isAdmin && selectedContract.status === "PENDING" && (
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={() => {
                        Alert.alert(
                          "Xem xét",
                          "Tính năng đang phát triển"
                        );
                        setShowDetailModal(false);
                      }}
                    >
                      <Text style={styles.primaryActionButtonText}>
                        Xem xét hợp đồng
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.gray500,
  },

  // Filter Container
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    ...typography.bodySmall,
    fontWeight: "600",
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
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  contractCodeContainer: {
    flex: 1,
  },
  contractCode: {
    ...typography.h4,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  contractDate: {
    ...typography.bodySmall,
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
  customerInfo: {
    marginBottom: spacing.md,
  },
  customerLabel: {
    ...typography.caption,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  customerName: {
    ...typography.bodyBold,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  customerEmail: {
    ...typography.bodySmall,
    color: colors.gray500,
  },

  // Vehicle Info
  vehicleInfo: {
    marginBottom: spacing.md,
  },
  vehicleLabel: {
    ...typography.caption,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  vehicleName: {
    ...typography.bodyBold,
    color: colors.gray800,
  },

  // Payment Info
  paymentInfo: {
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
    ...typography.bodySmallBold,
    color: colors.gray800,
  },
  discountValue: {
    ...typography.bodySmallBold,
    color: colors.danger,
  },
  totalLabel: {
    ...typography.bodyBold,
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
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  primaryActionButtonText: {
    ...typography.bodySmall,
    fontWeight: "600",
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
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    marginBottom: spacing.lg,
  },
  modalContractCodeContainer: {
    flex: 1,
  },
  modalContractCode: {
    ...typography.h3,
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
    ...typography.caption,
    color: colors.gray500,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  modalInfoValue: {
    ...typography.bodyBold,
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
    ...typography.bodySmallBold,
    color: colors.gray800,
  },
  modalDiscountValue: {
    ...typography.bodySmallBold,
    color: colors.danger,
  },
  modalTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  modalTotalLabel: {
    ...typography.bodyBold,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
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
    ...typography.bodyBold,
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
    ...typography.bodyBold,
    color: colors.white,
  },

  // Close Button
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    ...typography.bodyBold,
    color: colors.gray500,
  },
});
