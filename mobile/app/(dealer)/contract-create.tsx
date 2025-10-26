import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { contractApi, CreateContractInput } from "@/lib/api/contractApi";
import { vehicleApi, Vehicle } from "@/lib/api/vehicleApi";
import { customerApi } from "@/lib/api/customerApi";

export default function ContractCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  // Contract data
  const [formData, setFormData] = useState<CreateContractInput>({
    customerId: "",
    vehicleId: "",
    basePrice: 0,
    discount: 0,
    paymentType: "FULL",
    installmentMonths: 24,
    interestRate: 12,
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const dealerId = (user as any)?.dealerId;
      if (!dealerId) return;

      const response = await vehicleApi.getDealerVehicles(dealerId);
      const vehiclesData = response.data.data?.data || [];
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);

  const finalPrice = formData.basePrice - (formData.discount || 0);

  const calculateMonthlyPayment = () => {
    if (formData.paymentType !== "INSTALLMENT") return 0;
    const principal = finalPrice * 0.9;
    const monthlyRate = (formData.interestRate || 0) / 100 / 12;
    const months = formData.installmentMonths || 24;

    if (monthlyRate === 0) return principal / months;
    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment * 100) / 100;
  };

  const monthlyPayment = calculateMonthlyPayment();
  const totalInstallmentAmount =
    formData.paymentType === "INSTALLMENT"
      ? finalPrice * 0.1 + monthlyPayment * (formData.installmentMonths || 0)
      : finalPrice;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerInfo.firstName.trim())
      newErrors.firstName = "Vui lòng nhập họ";
    if (!customerInfo.lastName.trim()) newErrors.lastName = "Vui lòng nhập tên";
    if (!customerInfo.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!customerInfo.phone.trim())
      newErrors.phone = "Vui lòng nhập số điện thoại";
    if (!customerInfo.address.trim())
      newErrors.address = "Vui lòng nhập địa chỉ";

    if (!formData.vehicleId) newErrors.vehicleId = "Vui lòng chọn xe";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create customer first
      const customerRes = await customerApi.createCustomer(customerInfo);
      const customerId = customerRes.data.data?.id || customerRes.data.id;

      if (!customerId) {
        throw new Error("Không thể tạo khách hàng");
      }

      // Get user ID for staffId
      const staffId = (user as any)?.id;

      // Create contract
      const contractData: any = {
        customerId,
        vehicleId: formData.vehicleId,
        staffId: staffId, // Add staffId
        basePrice: Number(formData.basePrice),
        discount: Number(formData.discount) || 0,
        paymentType: formData.paymentType,
        installmentMonths: Number(formData.installmentMonths),
        interestRate: Number(formData.interestRate),
        notes: formData.notes || "",
      };

      await contractApi.createContract(contractData);

      Alert.alert("Thành công", "Tạo hợp đồng thành công!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error creating contract:", error);
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi tạo hợp đồng";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setFormData((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      basePrice: Number(vehicle.retailPrice || 0),
    }));
    setShowVehicleModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Customer Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Họ *</Text>
              <TextInput
                style={styles.input}
                value={customerInfo.firstName}
                onChangeText={(text) =>
                  setCustomerInfo((prev) => ({ ...prev, firstName: text }))
                }
                placeholder="Nhập họ"
              />
              {errors.firstName && (
                <Text style={styles.error}>{errors.firstName}</Text>
              )}
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>Tên *</Text>
              <TextInput
                style={styles.input}
                value={customerInfo.lastName}
                onChangeText={(text) =>
                  setCustomerInfo((prev) => ({ ...prev, lastName: text }))
                }
                placeholder="Nhập tên"
              />
              {errors.lastName && (
                <Text style={styles.error}>{errors.lastName}</Text>
              )}
            </View>
          </View>

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={customerInfo.email}
            onChangeText={(text) =>
              setCustomerInfo((prev) => ({ ...prev, email: text }))
            }
            placeholder="example@email.com"
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          <Text style={styles.label}>Số điện thoại *</Text>
          <TextInput
            style={styles.input}
            value={customerInfo.phone}
            onChangeText={(text) =>
              setCustomerInfo((prev) => ({ ...prev, phone: text }))
            }
            placeholder="0123456789"
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

          <Text style={styles.label}>Địa chỉ *</Text>
          <TextInput
            style={styles.input}
            value={customerInfo.address}
            onChangeText={(text) =>
              setCustomerInfo((prev) => ({ ...prev, address: text }))
            }
            placeholder="Nhập địa chỉ"
            multiline
          />
          {errors.address && <Text style={styles.error}>{errors.address}</Text>}
        </View>

        {/* Vehicle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin xe</Text>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowVehicleModal(true)}
          >
            <Text
              style={
                selectedVehicle
                  ? styles.selectButtonText
                  : styles.selectButtonPlaceholder
              }
            >
              {selectedVehicle
                ? `${selectedVehicle.manufacturer.name} ${selectedVehicle.model}`
                : "Chọn xe *"}
            </Text>
          </TouchableOpacity>
          {errors.vehicleId && (
            <Text style={styles.error}>{errors.vehicleId}</Text>
          )}

          {selectedVehicle && (
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleInfoText}>
                Năm: {selectedVehicle.year}
              </Text>
              <Text style={styles.vehicleInfoText}>
                Giá: {formatPrice(Number(selectedVehicle.retailPrice))}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>

          <Text style={styles.label}>Hình thức thanh toán</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                formData.paymentType === "FULL" && styles.paymentOptionActive,
              ]}
              onPress={() =>
                setFormData((prev) => ({ ...prev, paymentType: "FULL" }))
              }
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  formData.paymentType === "FULL" &&
                    styles.paymentOptionTextActive,
                ]}
              >
                Trả thẳng
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                formData.paymentType === "INSTALLMENT" &&
                  styles.paymentOptionActive,
              ]}
              onPress={() =>
                setFormData((prev) => ({ ...prev, paymentType: "INSTALLMENT" }))
              }
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  formData.paymentType === "INSTALLMENT" &&
                    styles.paymentOptionTextActive,
                ]}
              >
                Trả góp
              </Text>
            </TouchableOpacity>
          </View>

          {formData.paymentType === "INSTALLMENT" && (
            <>
              <Text style={styles.label}>Số tháng trả góp</Text>
              <View style={styles.installmentRow}>
                {[12, 18, 24, 36, 48, 60].map((months) => (
                  <TouchableOpacity
                    key={months}
                    style={[
                      styles.installmentOption,
                      formData.installmentMonths === months &&
                        styles.installmentOptionActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        installmentMonths: months,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.installmentOptionText,
                        formData.installmentMonths === months &&
                          styles.installmentOptionTextActive,
                      ]}
                    >
                      {months}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Tóm tắt trả góp</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Trả trước (10%):</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(Math.round(finalPrice * 0.1))}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Hàng tháng:</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(monthlyPayment)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng cộng:</Text>
                  <Text style={[styles.summaryValue, styles.summaryTotal]}>
                    {formatPrice(totalInstallmentAmount)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes || ""}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, notes: text }))
            }
            placeholder="Nhập ghi chú..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Tóm tắt hợp đồng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá xe:</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(formData.basePrice)}
            </Text>
          </View>
          {formData.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Chiết khấu:</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -{formatPrice(formData.discount)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Thành tiền:</Text>
            <Text style={styles.totalValue}>{formatPrice(finalPrice)}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Tạo hợp đồng</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Vehicle Selection Modal */}
      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn xe</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={styles.vehicleOption}
                  onPress={() => handleSelectVehicle(vehicle)}
                >
                  <Text style={styles.vehicleOptionName}>
                    {vehicle.manufacturer.name} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleOptionPrice}>
                    {formatPrice(Number(vehicle.retailPrice))}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  error: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  selectButtonText: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
  selectButtonPlaceholder: {
    fontSize: 14,
    color: "#9ca3af",
  },
  vehicleInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  vehicleInfoText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  paymentRow: {
    flexDirection: "row",
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  paymentOptionActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  paymentOptionText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  paymentOptionTextActive: {
    color: "#fff",
  },
  installmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  installmentOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  installmentOptionActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  installmentOptionText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  installmentOptionTextActive: {
    color: "#fff",
  },
  summaryBox: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1f2937",
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
  },
  discountText: {
    color: "#ef4444",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10b981",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  closeButton: {
    fontSize: 24,
    color: "#6b7280",
  },
  vehicleOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  vehicleOptionName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 4,
  },
  vehicleOptionPrice: {
    fontSize: 13,
    color: "#10b981",
    fontWeight: "600",
  },
});
