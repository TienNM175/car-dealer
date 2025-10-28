import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Image,
  FlatList,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleApi, Vehicle } from "@/lib/api/vehicleApi";
import Header from "@/components/shared/Header";
import {
  globalStyles,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "@/styles/globalStyles";

export default function EVMProductsPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const userRole = user?.role?.toUpperCase() || "EVM_STAFF";
  const isAdmin = userRole === "ADMIN";

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      const response = await vehicleApi.getAllVehicles();
      const vehiclesData =
        response.data.data?.data || response.data.data || response.data || [];
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách xe");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const filteredVehicles = vehicles.filter(
    (vehicle: Vehicle) =>
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const handleVehiclePress = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const handleCreateVehicle = () => {
    Alert.alert("Tạo xe mới", "Tính năng đang phát triển");
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    Alert.alert(
      "Chỉnh sửa xe",
      `Chỉnh sửa ${vehicle.model} - Tính năng đang phát triển`
    );
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert("Xóa xe", `Bạn có chắc chắn muốn xóa ${vehicle.model}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => Alert.alert("Thành công", "Xóa xe thành công!"),
      },
    ]);
  };

  if (loading && vehicles.length === 0) {
    return (
      <View style={globalStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>Đang tải danh sách xe...</Text>
      </View>
    );
  }

  const renderVehicleCard = ({ item: vehicle }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => handleVehiclePress(vehicle)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: vehicle.images[0]?.url || "https://placehold.co/400x300",
        }}
        style={styles.vehicleImage}
        resizeMode="cover"
      />
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleModel}>
            {vehicle.manufacturer.name} {vehicle.model}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  vehicle.status === "ACTIVE" ? colors.success : colors.warning,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {vehicle.status === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}
            </Text>
          </View>
        </View>

        {vehicle.variant && (
          <Text style={styles.vehicleVariant}>{vehicle.variant}</Text>
        )}

        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <Text style={styles.specIcon}>🔋</Text>
            <Text style={styles.specText}>{vehicle.batteryCapacity}kWh</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specIcon}>📏</Text>
            <Text style={styles.specText}>{vehicle.range}km</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specIcon}>🚗</Text>
            <Text style={styles.specText}>{vehicle.year}</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Giá bán lẻ:</Text>
          <Text style={styles.price}>{formatPrice(vehicle.retailPrice)}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleVehiclePress(vehicle)}
          >
            <Text style={styles.actionButtonText}>Chi tiết</Text>
          </TouchableOpacity>
          {(isAdmin || userRole === "EVM_STAFF") && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditVehicle(vehicle)}
              >
                <Text style={styles.actionButtonText}>Sửa</Text>
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={() => handleDeleteVehicle(vehicle)}
                >
                  <Text style={styles.dangerButtonText}>Xóa</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      <Header title="Quản lý sản phẩm" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm xe theo tên hoặc hãng..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={colors.gray400}
        />
      </View>

      {/* Vehicle List */}
      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicleCard}
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
            <Text style={globalStyles.emptyText}>Không tìm thấy xe nào</Text>
            <Text style={styles.emptySubtext}>
              Thử thay đổi từ khóa tìm kiếm
            </Text>
          </View>
        }
      />

      {/* Vehicle Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <View style={globalStyles.modalHeader}>
              <Text style={globalStyles.modalTitle}>Chi tiết xe</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedVehicle ? (
              <>
                <ScrollView style={styles.modalScroll}>
                  <Image
                    source={{
                      uri:
                        selectedVehicle.images[0]?.url ||
                        "https://placehold.co/400x300",
                    }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />

                  <View style={styles.vehicleTitleContainer}>
                    <Text style={styles.modalModel}>
                      {selectedVehicle.manufacturer.name}{" "}
                      {selectedVehicle.model}
                    </Text>
                    {selectedVehicle.variant && (
                      <Text style={styles.modalVariant}>
                        {selectedVehicle.variant}
                      </Text>
                    )}
                  </View>

                  {/* Specifications */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Thông số kỹ thuật
                    </Text>
                    <View style={styles.specsGrid}>
                      <View style={styles.specCard}>
                        <Text style={styles.specCardIcon}>🔋</Text>
                        <Text style={styles.specCardLabel}>Dung lượng pin</Text>
                        <Text style={styles.specCardValue}>
                          {selectedVehicle.batteryCapacity} kWh
                        </Text>
                      </View>
                      <View style={styles.specCard}>
                        <Text style={styles.specCardIcon}>📏</Text>
                        <Text style={styles.specCardLabel}>Tầm hoạt động</Text>
                        <Text style={styles.specCardValue}>
                          {selectedVehicle.range} km
                        </Text>
                      </View>
                      <View style={styles.specCard}>
                        <Text style={styles.specCardIcon}>🚗</Text>
                        <Text style={styles.specCardLabel}>Năm sản xuất</Text>
                        <Text style={styles.specCardValue}>
                          {selectedVehicle.year}
                        </Text>
                      </View>
                      <View style={styles.specCard}>
                        <Text style={styles.specCardIcon}>⚡</Text>
                        <Text style={styles.specCardLabel}>Công suất</Text>
                        <Text style={styles.specCardValue}>
                          {selectedVehicle.motorPower || 0} kW
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Pricing */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Giá cả</Text>
                    <View style={styles.priceCard}>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Giá sỉ (đại lý):</Text>
                        <Text style={styles.modalPriceWholesale}>
                          {formatPrice(selectedVehicle.wholesalePrice)}
                        </Text>
                      </View>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Giá bán lẻ:</Text>
                        <Text style={styles.modalPrice}>
                          {formatPrice(selectedVehicle.retailPrice)}
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
                    <Text style={styles.secondaryActionButtonText}>Đóng</Text>
                  </TouchableOpacity>
                  {(isAdmin || userRole === "EVM_STAFF") && (
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={() => {
                        Alert.alert("Chỉnh sửa", "Tính năng đang phát triển");
                        setShowDetailModal(false);
                      }}
                    >
                      <Text style={styles.primaryActionButtonText}>
                        Chỉnh sửa xe
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>Không có dữ liệu xe</Text>
                <Text style={styles.modalEmptySubtext}>
                  selectedVehicle is null
                </Text>
              </View>
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
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  createButtonText: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.white,
  },

  // Search Container
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  searchInput: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.gray800,
  },

  // Vehicle Card
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.md,
  },
  vehicleImage: {
    width: "100%",
    height: 200,
    backgroundColor: colors.gray200,
  },
  vehicleInfo: {
    padding: spacing.lg,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  vehicleModel: {
    ...typography.h4,
    color: colors.gray800,
    flex: 1,
    marginRight: spacing.sm,
  },
  vehicleVariant: {
    ...typography.bodySmall,
    color: colors.gray500,
    marginBottom: spacing.md,
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

  // Specs Container
  specsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  specItem: {
    alignItems: "center",
    flex: 1,
  },
  specIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  specText: {
    ...typography.caption,
    color: colors.gray600,
    textAlign: "center",
  },

  // Price Container
  priceContainer: {
    marginBottom: spacing.md,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.h4,
    fontWeight: "bold",
    color: colors.success,
  },

  // Action Buttons
  actionButtons: {
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
  dangerButton: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  dangerButtonText: {
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

  // Modal Empty State
  modalEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalEmptyText: {
    ...typography.h4,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  modalEmptySubtext: {
    ...typography.bodySmall,
    color: colors.gray400,
  },

  // Modal Styles
  modalScroll: {
    flex: 1,
  },
  modalImage: {
    width: "100%",
    height: 250,
    backgroundColor: colors.gray200,
  },
  vehicleTitleContainer: {
    marginBottom: spacing.lg,
  },
  modalModel: {
    ...typography.h2,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  modalVariant: {
    ...typography.body,
    color: colors.gray500,
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

  // Specs Grid
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  specCard: {
    width: "48%",
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  specCardIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  specCardLabel: {
    ...typography.caption,
    color: colors.gray500,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  specCardValue: {
    ...typography.bodySmallBold,
    color: colors.gray800,
    textAlign: "center",
  },

  // Price Card
  priceCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  modalPrice: {
    ...typography.h4,
    fontWeight: "bold",
    color: colors.primary,
  },
  modalPriceWholesale: {
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
