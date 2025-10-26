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
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleApi, Vehicle } from "@/lib/api/vehicleApi";

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
    (vehicle) =>
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleVehiclePress = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  if (loading && vehicles.length === 0) {
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm xe..."
          placeholderTextColor="#9ca3af"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Vehicle List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredVehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy xe nào</Text>
          </View>
        ) : (
          filteredVehicles.map((vehicle: any) => (
            <TouchableOpacity
              key={vehicle.id}
              style={styles.vehicleCard}
              onPress={() => handleVehiclePress(vehicle)}
            >
              <Image
                source={{
                  uri: vehicle.images[0]?.url || "https://placehold.co/400x300",
                }}
                style={styles.vehicleImage}
              />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleModel}>
                  {vehicle.manufacturer.name} {vehicle.model}
                </Text>
                {vehicle.variant && (
                  <Text style={styles.vehicleVariant}>{vehicle.variant}</Text>
                )}
                <View style={styles.specs}>
                  <Text style={styles.spec}>
                    🔋 {vehicle.batteryCapacity}kWh
                  </Text>
                  <Text style={styles.spec}>📏 {vehicle.range}km</Text>
                </View>
                <Text style={styles.price}>
                  {formatPrice(vehicle.retailPrice)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedVehicle && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết xe</Text>
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
                  />
                  <View style={styles.modalBody}>
                    <Text style={styles.modalModel}>
                      {selectedVehicle.manufacturer.name}{" "}
                      {selectedVehicle.model}
                    </Text>
                    {selectedVehicle.variant && (
                      <Text style={styles.modalVariant}>
                        {selectedVehicle.variant}
                      </Text>
                    )}

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        Thông số kỹ thuật
                      </Text>
                      <View style={styles.modalSpecRow}>
                        <Text style={styles.modalSpecLabel}>Năm sản xuất:</Text>
                        <Text style={styles.modalSpecValue}>
                          {selectedVehicle.year}
                        </Text>
                      </View>
                      <View style={styles.modalSpecRow}>
                        <Text style={styles.modalSpecLabel}>
                          Dung lượng pin:
                        </Text>
                        <Text style={styles.modalSpecValue}>
                          {selectedVehicle.batteryCapacity} kWh
                        </Text>
                      </View>
                      <View style={styles.modalSpecRow}>
                        <Text style={styles.modalSpecLabel}>Phạm vi:</Text>
                        <Text style={styles.modalSpecValue}>
                          {selectedVehicle.range} km
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Giá</Text>
                      <Text style={styles.modalPriceLabel}>Giá bán lẻ:</Text>
                      <Text style={styles.modalPrice}>
                        {formatPrice(selectedVehicle.retailPrice)}
                      </Text>
                      <Text style={styles.modalPriceLabel}>
                        Giá sỉ (dành cho đại lý):
                      </Text>
                      <Text style={styles.modalPriceWholesale}>
                        {formatPrice(selectedVehicle.wholesalePrice)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.orderButton}
                      onPress={() => {
                        Alert.alert("Đặt hàng", "Tính năng đang phát triển");
                        setShowDetailModal(false);
                      }}
                    >
                      <Text style={styles.orderButtonText}>
                        Đặt hàng từ hãng
                      </Text>
                    </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 14,
  },
  searchContainer: {
    padding: 12,
    backgroundColor: "#fff",
  },
  searchInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
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
  vehicleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  vehicleImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#e5e7eb",
  },
  vehicleInfo: {
    padding: 14,
  },
  vehicleModel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  vehicleVariant: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  specs: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  spec: {
    fontSize: 12,
    color: "#6b7280",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
    marginTop: 8,
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
    flex: 1,
  },
  modalImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#e5e7eb",
  },
  modalBody: {
    padding: 16,
  },
  modalModel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  modalVariant: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  modalSpecRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalSpecLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  modalSpecValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1f2937",
  },
  modalPriceLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 12,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10b981",
    marginTop: 4,
  },
  modalPriceWholesale: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
    marginTop: 4,
  },
  orderButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
