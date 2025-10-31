// ============================================
// 6. src/components/TestDriveForm.tsx
// ============================================
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/config";
import {
  validateEmail,
  validatePhone,
  validateName,
  validateDate,
} from "../utils/validation";
import { TestDriveRequest } from "../types/testDrive";

interface TestDriveFormProps {
  vehicleId: string;
  dealerId: string;
  onSubmit: (data: TestDriveRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export const TestDriveForm: React.FC<TestDriveFormProps> = ({
  vehicleId,
  dealerId,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
      setErrors((prev) => ({ ...prev, date: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateName(formData.firstName)) {
      newErrors.firstName = "Tên phải có ít nhất 2 ký tự";
    }

    if (!validateName(formData.lastName)) {
      newErrors.lastName = "Họ phải có ít nhất 2 ký tự";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!validateDate(selectedDate)) {
      newErrors.date = "Vui lòng chọn ngày trong tương lai";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin");
      return;
    }

    const testDriveData: TestDriveRequest = {
      ...formData,
      vehicleId,
      dealerId,
      scheduledDate: selectedDate.toISOString(),
    };

    try {
      await onSubmit(testDriveData);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể đặt lịch lái thử");
    }
  };

  const renderInput = (
    label: string,
    key: keyof typeof formData,
    placeholder: string,
    keyboardType: any = "default",
    icon: string = "person"
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          errors[key] ? styles.inputError : undefined,
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={COLORS.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={formData[key]}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, [key]: text }));
            setErrors((prev) => ({ ...prev, [key]: "" }));
          }}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  const handleDatePress = () => {
    if (Platform.OS === "android") {
      // Mở chọn ngày trước
      DateTimePickerAndroid.open({
        value: selectedDate,
        onChange: (event, date) => {
          if (date) {
            // Khi đã chọn ngày, mở chọn giờ
            DateTimePickerAndroid.open({
              value: date,
              onChange: (event2, time) => {
                if (time) {
                  const finalDate = new Date(date);
                  finalDate.setHours(time.getHours());
                  finalDate.setMinutes(time.getMinutes());
                  setSelectedDate(finalDate);
                }
              },
              mode: "time",
              is24Hour: true,
            });
          }
        },
        mode: "date",
        minimumDate: new Date(),
      });
    } else {
      setShowDatePicker(true); // iOS
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

        {renderInput("Họ", "lastName", "Nguyễn", "default", "person")}
        {renderInput("Tên", "firstName", "Văn A", "default", "person")}
        {renderInput(
          "Email",
          "email",
          "example@email.com",
          "email-address",
          "mail"
        )}
        {renderInput(
          "Số điện thoại",
          "phone",
          "0901234567",
          "phone-pad",
          "call"
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thời gian lái thử</Text>

        <TouchableOpacity
          style={[styles.dateButton, errors.date ? styles.inputError : null]}
          onPress={handleDatePress}
        >
          <Ionicons name="calendar" size={20} color={COLORS.primary} />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>

        {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

        {/* ✅ Chỉ hiển thị inline DatePicker cho iOS */}
        {Platform.OS === "ios" && showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="datetime"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
            is24Hour={true}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ghi chú (không bắt buộc)</Text>

        <TextInput
          style={styles.textArea}
          value={formData.notes}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, notes: text }))
          }
          placeholder="Nhập ghi chú của bạn..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Text style={styles.submitButtonText}>Đang xử lý...</Text>
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Xác nhận đặt lịch</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.disclaimer}>
        <Ionicons
          name="information-circle"
          size={16}
          color={COLORS.textSecondary}
        />
        <Text style={styles.disclaimerText}>
          Chúng tôi sẽ liên hệ với bạn để xác nhận lịch hẹn trong vòng 24 giờ
        </Text>
      </View>
    </ScrollView>
  );
};

const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    backgroundColor: COLORS.card,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.error,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 100,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 12,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 8,
  },
  disclaimerText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});

// Merge với styles chính
const styles = { ...formStyles };
