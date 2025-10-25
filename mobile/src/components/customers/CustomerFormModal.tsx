// mobile/src/components/customers/CustomerFormModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer, CreateCustomerInput } from '@/lib/api/customerApi';
import { STATUS_CONFIG } from '@/constants/customerStatus';
import { styles } from './styles';

interface CustomerFormModalProps {
  visible: boolean;
  customer: Customer | null;
  loading: boolean;
  onClose: () => void;
  onSave: (data: CreateCustomerInput) => Promise<void>;
}

export default function CustomerFormModal({
  visible,
  customer,
  loading,
  onClose,
  onSave,
}: CustomerFormModalProps) {
  const { height } = Dimensions.get('window');
  const [formData, setFormData] = useState<CreateCustomerInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    identityCard: '',
    status: 'INTERESTED',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        identityCard: customer.identityCard || '',
        status: customer.status || 'INTERESTED',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        identityCard: '',
        status: 'INTERESTED',
      });
    }
  }, [customer, visible]);

  const handleSave = async () => {
    await onSave(formData);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.9 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {customer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <FormField
              label="Họ *"
              value={formData.firstName || ''}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              placeholder="Nhập họ"
            />

            <FormField
              label="Tên *"
              value={formData.lastName || ''}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              placeholder="Nhập tên"
            />

            <FormField
              label="Email *"
              value={formData.email || ''}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="example@email.com"
              keyboardType="email-address"
            />

            <FormField
              label="Số điện thoại"
              value={formData.phone || ''}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="0123456789"
              keyboardType="phone-pad"
            />

            <FormField
              label="Địa chỉ"
              value={formData.address || ''}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Nhập địa chỉ"
            />

            <FormField
              label="Thành phố"
              value={formData.city || ''}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="Nhập thành phố"
            />

            <FormField
              label="CCCD/CMND"
              value={formData.identityCard || ''}
              onChangeText={(text) => setFormData({ ...formData, identityCard: text })}
              placeholder="123456789012"
              keyboardType="numeric"
            />

            {/* Status Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Trạng thái</Text>
              <View style={styles.statusSelect}>
                {Object.entries(STATUS_CONFIG).map(([key, value]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.statusOption,
                      formData.status === key && styles.statusOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, status: key as any })}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        formData.status === key && styles.statusOptionTextActive,
                      ]}
                    >
                      {value.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formBtn, styles.cancelBtn]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formBtn, styles.submitBtn]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {customer ? 'Cập nhật' : 'Thêm mới'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
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
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}
