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
import Header from "@/components/shared/Header";
import {
  globalStyles,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "@/styles/globalStyles";

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
    <View style={globalStyles.container}>
      <Header title="Tạo hợp đồng mới" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Họ *</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                value={customerInfo.firstName}
                onChangeText={(text) =>
                  setCustomerInfo((prev) => ({ ...prev, firstName: text }))
                }
                placeholder="Nhập họ"
                placeholderTextColor={colors.gray400}
              />
              {errors.firstName && (
                <Text style={styles.error}>{errors.firstName}</Text>
              )}
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>Tên *</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                value={customerInfo.lastName}
                onChangeText={(text) =>
                  setCustomerInfo((prev) => ({ ...prev, lastName: text }))
                }
                placeholder="Nhập tên"
                placeholderTextColor={colors.gray400}
              />
              {errors.lastName && (
                <Text style={styles.error}>{errors.lastName}</Text>
              )}
            </View>
          </View>

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={customerInfo.email}
            onChangeText={(text) =>
              setCustomerInfo((prev) => ({ ...prev, email: text }))
            }
            placeholder="example@email.com"
            placeholderTextColor={colors.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          <Text style={styles.label}>Số điện thoại *</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={customerInfo.phone}
            onChangeText={(text) =>
              setCustomerInfo((prev) => ({ ...prev, phone: text }))
            }
            placeholder="0123456789"
            placeholderTextColor={colors.gray400}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

          <Text style={styles.label}>Địa chỉ *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.address && styles.inputError,
            ]}
            value={customerInfo.address}
            onChangeText={(text) =>
              setCustomerInfo((prev) => ({ ...prev, address: text }))
            }
            placeholder="Nhập địa chỉ"
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={3}
          />
          {errors.address && <Text style={styles.error}>{errors.address}</Text>}
        </View>

        {/* Vehicle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin xe</Text>

          <TouchableOpacity
            style={[styles.selectButton, errors.vehicleId && styles.inputError]}
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
            <View style={styles.vehicleInfoCard}>
              <View style={styles.vehicleInfoRow}>
                <Text style={styles.vehicleInfoLabel}>Năm:</Text>
                <Text style={styles.vehicleInfoValue}>
                  {selectedVehicle.year}
                </Text>
              </View>
              <View style={styles.vehicleInfoRow}>
                <Text style={styles.vehicleInfoLabel}>Giá:</Text>
                <Text style={styles.vehicleInfoValue}>
                  {formatPrice(Number(selectedVehicle.retailPrice))}
                </Text>
              </View>
              <View style={styles.vehicleInfoRow}>
                <Text style={styles.vehicleInfoLabel}>Pin:</Text>
                <Text style={styles.vehicleInfoValue}>
                  {selectedVehicle.batteryCapacity}kWh
                </Text>
              </View>
              <View style={styles.vehicleInfoRow}>
                <Text style={styles.vehicleInfoLabel}>Tầm hoạt động:</Text>
                <Text style={styles.vehicleInfoValue}>
                  {selectedVehicle.range}km
                </Text>
              </View>
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

              <View style={styles.installmentSummaryCard}>
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
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tóm tắt hợp đồng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá xe:</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(formData.basePrice)}
            </Text>
          </View>
          {formData.discount && formData.discount > 0 && (
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
            <ActivityIndicator color={colors.white} />
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
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <View style={globalStyles.modalHeader}>
              <Text style={globalStyles.modalTitle}>Chọn xe</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={styles.vehicleOption}
                  onPress={() => handleSelectVehicle(vehicle)}
                >
                  <View style={styles.vehicleOptionContent}>
                    <Text style={styles.vehicleOptionName}>
                      {vehicle.manufacturer.name} {vehicle.model}
                    </Text>
                    <Text style={styles.vehicleOptionDetails}>
                      {vehicle.year} • {vehicle.batteryCapacity}kWh •{" "}
                      {vehicle.range}km
                    </Text>
                    <Text style={styles.vehicleOptionPrice}>
                      {formatPrice(Number(vehicle.retailPrice))}
                    </Text>
                  </View>
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
  // Container
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Section
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.gray800,
    marginBottom: spacing.lg,
  },

  // Row Layout
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },

  // Label
  label: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: spacing.xs,
  },

  // Input
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.gray800,
  },
  inputError: {
    borderColor: colors.danger,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Error Text
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },

  // Select Button
  selectButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectButtonText: {
    ...typography.body,
    color: colors.gray800,
    fontWeight: "500",
  },
  selectButtonPlaceholder: {
    ...typography.body,
    color: colors.gray400,
  },

  // Vehicle Info Card
  vehicleInfoCard: {
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  vehicleInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  vehicleInfoLabel: {
    ...typography.bodySmall,
    color: colors.gray600,
  },
  vehicleInfoValue: {
    ...typography.bodySmall,
    fontWeight: "500",
    color: colors.gray800,
  },

  // Payment Options
  paymentRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  paymentOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentOptionText: {
    ...typography.body,
    color: colors.gray600,
    fontWeight: "500",
  },
  paymentOptionTextActive: {
    color: colors.white,
  },

  // Installment Options
  installmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  installmentOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  installmentOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  installmentOptionText: {
    ...typography.bodySmall,
    color: colors.gray600,
    fontWeight: "500",
  },
  installmentOptionTextActive: {
    color: colors.white,
  },

  // Summary Cards
  installmentSummaryCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  summaryCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    ...typography.h4,
    color: colors.gray700,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.gray600,
  },
  summaryValue: {
    ...typography.bodySmall,
    fontWeight: "500",
    color: colors.gray800,
  },
  summaryTotal: {
    ...typography.h4,
    fontWeight: "bold",
    color: colors.success,
  },
  discountText: {
    color: colors.danger,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.gray800,
  },
  totalValue: {
    ...typography.h3,
    fontWeight: "bold",
    color: colors.success,
  },

  // Submit Button
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.lg,
    ...shadows.md,
  },
  submitButtonText: {
    ...typography.h4,
    fontWeight: "600",
    color: colors.white,
  },

  // Modal Styles
  modalScroll: {
    flex: 1,
  },
  vehicleOption: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  vehicleOptionContent: {
    flex: 1,
  },
  vehicleOptionName: {
    ...typography.body,
    fontWeight: "600",
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  vehicleOptionDetails: {
    ...typography.bodySmall,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  vehicleOptionPrice: {
    ...typography.body,
    fontWeight: "600",
    color: colors.success,
  },

  // Close Button
  closeButton: {
    fontSize: 24,
    color: colors.gray500,
    fontWeight: "bold",
  },
});
