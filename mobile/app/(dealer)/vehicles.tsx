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
import {
  globalStyles,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "@/styles/globalStyles";

export default function DealerVehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const dealerId = (user as any)?.dealerId;
      if (!dealerId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đại lý");
        return;
      }

      const response = await vehicleApi.getDealerVehicles(dealerId);
      const vehiclesData = response.data.data?.data || [];
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  if (loading && vehicles.length === 0) {
    return (
      <View style={globalStyles.container}>
        <View style={globalStyles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Đang tải...</Text>
        </View>
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
            style={[styles.statusBadge, { backgroundColor: colors.success }]}
          >
            <Text style={styles.statusText}>Có sẵn</Text>
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
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
          >
            <Text style={styles.primaryActionButtonText}>Đặt hàng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm xe theo tên, hãng..."
          placeholderTextColor={colors.gray400}
          value={searchTerm}
          onChangeText={setSearchTerm}
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
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={globalStyles.emptyContainer}>
            <Text style={globalStyles.emptyText}>Không tìm thấy xe nào</Text>
            <Text style={styles.emptySubtext}>
              Thử thay đổi từ khóa tìm kiếm
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            {selectedVehicle && (
              <>
                <View style={globalStyles.modalHeader}>
                  <Text style={globalStyles.modalTitle}>Chi tiết xe</Text>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
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
                  <View style={globalStyles.modalBody}>
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

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        Thông số kỹ thuật
                      </Text>
                      <View style={styles.specsGrid}>
                        <View style={styles.specCard}>
                          <Text style={styles.specCardIcon}>🔋</Text>
                          <Text style={styles.specCardLabel}>Pin</Text>
                          <Text style={styles.specCardValue}>
                            {selectedVehicle.batteryCapacity} kWh
                          </Text>
                        </View>
                        <View style={styles.specCard}>
                          <Text style={styles.specCardIcon}>📏</Text>
                          <Text style={styles.specCardLabel}>
                            Tầm hoạt động
                          </Text>
                          <Text style={styles.specCardValue}>
                            {selectedVehicle.range} km
                          </Text>
                        </View>
                        <View style={styles.specCard}>
                          <Text style={styles.specCardIcon}>🚗</Text>
                          <Text style={styles.specCardLabel}>Năm</Text>
                          <Text style={styles.specCardValue}>
                            {selectedVehicle.year}
                          </Text>
                        </View>
                        <View style={styles.specCard}>
                          <Text style={styles.specCardIcon}>👥</Text>
                          <Text style={styles.specCardLabel}>Chỗ ngồi</Text>
                          <Text style={styles.specCardValue}>
                            {selectedVehicle.seats} người
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Giá cả</Text>
                      <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Giá bán lẻ:</Text>
                          <Text style={styles.modalPrice}>
                            {formatPrice(selectedVehicle.retailPrice)}
                          </Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>
                            Giá sỉ (đại lý):
                          </Text>
                          <Text style={styles.modalPriceWholesale}>
                            {formatPrice(selectedVehicle.wholesalePrice)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        onPress={() => setShowDetailModal(false)}
                      >
                        <Text style={styles.secondaryActionButtonText}>
                          Đóng
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.primaryActionButton}
                        onPress={() => {
                          Alert.alert("Đặt hàng", "Tính năng đang phát triển");
                          setShowDetailModal(false);
                        }}
                      >
                        <Text style={styles.primaryActionButtonText}>
                          Đặt hàng từ hãng
                        </Text>
                      </TouchableOpacity>
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
  },
  specCardValue: {
    ...typography.bodySmall,
    fontWeight: "600",
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
    color: colors.success,
  },
  modalPriceWholesale: {
    ...typography.h4,
    fontWeight: "bold",
    color: colors.primary,
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

  // Close Button
  closeButton: {
    fontSize: 24,
    color: colors.gray500,
    fontWeight: "bold",
  },
});
