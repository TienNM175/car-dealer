// mobile/src/components/users/CreateUserModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import { Ionicons } from "@expo/vector-icons";
import { usersApi } from "@/lib/api/users";
import { dealersApi } from "@/lib/api/dealer";
import { CreateUserData, UserRole } from "@/lib/types/user";
import Toast from "react-native-toast-message";
import { styles } from "./styles";

interface CreateUserModalProps {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

export default function CreateUserModal({
  visible,
  loading,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const { height } = Dimensions.get("window");
  const [dealers, setDealers] = useState<any[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);

  const [formData, setFormData] = useState<CreateUserData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "DEALER_STAFF",
    dealerId: "",
  });

  useEffect(() => {
    if (visible) {
      loadDealers();
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "DEALER_STAFF",
        dealerId: "",
      });
    }
  }, [visible]);

  const loadDealers = async () => {
    setLoadingDealers(true);
    try {
      const response = await dealersApi.list({ page: 1, limit: 100 });
      setDealers(response.data);
    } catch (err) {
      console.error("Error loading dealers:", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách dealer",
      });
    } finally {
      setLoadingDealers(false);
    }
  };

  const handleSubmit = async () => {
    const { email, password, firstName, lastName, phone, role, dealerId } =
      formData;

    // 1. Kiểm tra các field bắt buộc
    if (!email || !password || !firstName || !lastName) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    // 2. Validate email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Email không hợp lệ",
      });
      return;
    }

    // 3. Validate password
    const passwordErrors: string[] = [];
    if (!/[A-Z]/.test(password)) passwordErrors.push("1 chữ hoa");
    if (!/[a-z]/.test(password)) passwordErrors.push("1 chữ thường");
    if (!/[0-9]/.test(password)) passwordErrors.push("1 số");
    if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push("1 ký tự đặc biệt");
    if (password.length < 8) passwordErrors.push("ít nhất 8 ký tự");

    if (passwordErrors.length > 0) {
      Toast.show({
        type: "error",
        text1: "Lỗi mật khẩu",
        text2: `Password phải có: ${passwordErrors.join(", ")}`,
      });
      return;
    }

    // 4. Nếu role là DEALER_STAFF hoặc DEALER_MANAGER, dealerId bắt buộc
    if ((role === "DEALER_STAFF" || role === "DEALER_MANAGER") && !dealerId) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Nhân viên đại lý phải được gán cho 1 dealer",
      });
      return;
    }

    // 5. Gửi dữ liệu lên API
    try {
      const dataToSubmit = { ...formData };

      // Admin/EVM_STAFF không cần dealerId
      if (role === "ADMIN" || role === "EVM_STAFF") {
        delete dataToSubmit.dealerId;
      }

      console.log("Creating user:", dataToSubmit);

      await usersApi.create(dataToSubmit);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "User đã được tạo",
      });

      onSuccess();
    } catch (err: any) {
      console.error("Create user error:", err.response?.data || err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: err.response?.data?.message || "Không thể tạo user",
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.9 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tạo User Mới</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <FormField
              label="Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="user@example.com"
              keyboardType="email-address"
            />

            <FormField
              label="Mật khẩu *"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              placeholder="••••••••"
              secureTextEntry
            />

            <FormField
              label="Họ *"
              value={formData.firstName}
              onChangeText={(text) =>
                setFormData({ ...formData, firstName: text })
              }
              placeholder="Nguyễn"
            />

            <FormField
              label="Tên *"
              value={formData.lastName}
              onChangeText={(text) =>
                setFormData({ ...formData, lastName: text })
              }
              placeholder="Văn A"
            />

            <FormField
              label="Điện thoại"
              value={formData.phone || ""}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="0901234567"
              keyboardType="phone-pad"
            />

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Vai trò</Text>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value: UserRole) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <Picker.Item label="Dealer Staff" value="DEALER_STAFF" />
                <Picker.Item label="Dealer Manager" value="DEALER_MANAGER" />
                <Picker.Item label="EVM Staff" value="EVM_STAFF" />
                <Picker.Item label="Admin" value="ADMIN" />
              </Picker>
            </View>

            {(formData.role === "DEALER_STAFF" ||
              formData.role === "DEALER_MANAGER") && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Chọn Dealer *</Text>
                {loadingDealers ? (
                  <ActivityIndicator />
                ) : (
                  <Picker
                    selectedValue={formData.dealerId}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, dealerId: value })
                    }
                  >
                    <Picker.Item label="-- Chọn dealer --" value="" />
                    {dealers.map((d) => (
                      <Picker.Item key={d.id} label={d.name} value={d.id} />
                    ))}
                  </Picker>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Tạo User</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
