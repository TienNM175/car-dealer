// src/components/dealers/EditDealerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dealerApi } from '@/lib/api/dealerApi';
import type { Dealer, Region, UpdateDealerInput } from '@/lib/api/dealerApi';
import { styles } from './styles';

interface EditDealerModalProps {
  visible: boolean;
  dealer: Dealer | null;
  onClose: () => void;
  onSuccess: () => void;
  regions: Region[];
}

// Additional styles for region picker modal - ĐẶT NGOÀI COMPONENT
const pickerModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemSelected: {
    backgroundColor: '#f0f9ff',
  },
  itemText: {
    fontSize: 16,
    color: '#374151',
  },
  itemTextSelected: {
    color: '#0369a1',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default function EditDealerModal({
  visible,
  dealer,
  onClose,
  onSuccess,
  regions,
}: EditDealerModalProps) {
  const [formData, setFormData] = useState<UpdateDealerInput>({});
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false); // Thêm state cho xóa
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; code?: string; regionId?: string }>({});

  useEffect(() => {
    if (dealer) {
      setFormData({
        name: dealer.name,
        code: dealer.code, // THÊM CODE VÀO FORM DATA
        regionId: dealer.regionId,
        address: dealer.address || '',
        city: dealer.city || '',
        phone: dealer.phone || '',
        email: dealer.email || '',
        isActive: dealer.isActive,
      });
      setErrors({});
    }
  }, [dealer]);

  const handleSubmit = async () => {
    if (!dealer) return;

    // Validation - THÊM VALIDATION CHO CODE
    const newErrors: { name?: string; code?: string; regionId?: string } = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Tên đại lý là bắt buộc';
    }
    if (!formData.code?.trim()) {
      newErrors.code = 'Mã đại lý là bắt buộc';
    }
    if (!formData.regionId) {
      newErrors.regionId = 'Vùng miền là bắt buộc';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await dealerApi.updateDealer(dealer.id, formData);
      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi cập nhật đại lý');
    } finally {
      setLoading(false);
    }
  };

  // THÊM HÀM XÓA ĐẠI LÝ
  const handleDeleteDealer = async () => {
  if (!dealer) return;

  Alert.alert(
    'Xóa Đại Lý',
    `Bạn có chắc chắn muốn xóa đại lý "${dealer.name}"? Hành động này không thể hoàn tác.`,
    [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setDeleteLoading(true);
          try {
            const response = await dealerApi.deleteDealer(dealer.id);
            if (response.success) {
              Alert.alert('Thành công', 'Đại lý đã được xóa thành công');
              onSuccess(); // Refresh danh sách
              onClose(); // Đóng modal
            } else {
              throw new Error(response.message);
            }
          } catch (error: any) {
            console.error('Delete dealer error:', error);
            Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi xóa đại lý');
          } finally {
            setDeleteLoading(false);
          }
        },
      },
    ]
  );
};

  const handleChange = (field: keyof UpdateDealerInput, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegionSelect = (regionId: string) => {
    handleChange('regionId', regionId);
    setShowRegionPicker(false);
  };

  const getSelectedRegionName = () => {
    if (!formData.regionId) return 'Chọn vùng miền';
    const selectedRegion = regions.find(r => r.id === formData.regionId);
    return selectedRegion?.name || 'Chọn vùng miền';
  };

  if (!dealer) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chỉnh sửa Đại lý</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên đại lý *</Text>
                <TextInput
                  style={[styles.textInput, errors.name && styles.inputError]}
                  value={formData.name || ''}
                  onChangeText={(value) => handleChange('name', value)}
                  placeholder="Nhập tên đại lý"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mã đại lý *</Text>
                <TextInput
                  style={[styles.textInput, errors.code && styles.inputError]}
                  value={formData.code || ''}
                  onChangeText={(value) => handleChange('code', value.toUpperCase())} // TỰ ĐỘNG CHUYỂN THÀNH CHỮ HOA
                  placeholder="VD: DL-HN-001"
                />
                {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
                <Text style={styles.helperText}>
                  Mã đại lý nên viết hoa và không có dấu cách đặc biệt
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vùng miền *</Text>
                <TouchableOpacity
                  style={[styles.pickerContainer, errors.regionId && styles.inputError]}
                  onPress={() => setShowRegionPicker(true)}
                >
                  <Text style={[
                    styles.pickerText, 
                    !formData.regionId && styles.placeholderText
                  ]}>
                    {getSelectedRegionName()}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
                {errors.regionId && <Text style={styles.errorText}>{errors.regionId}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Thành phố</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.city || ''}
                  onChangeText={(value) => handleChange('city', value)}
                  placeholder="Nhập thành phố"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Trạng thái</Text>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleChange('isActive', !formData.isActive)}
                >
                  <View style={[
                    styles.checkbox, 
                    formData.isActive && styles.checkboxChecked
                  ]}>
                    {formData.isActive && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    {formData.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.phone || ''}
                  onChangeText={(value) => handleChange('phone', value)}
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email || ''}
                  onChangeText={(value) => handleChange('email', value)}
                  placeholder="Nhập email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.address || ''}
                  onChangeText={(value) => handleChange('address', value)}
                  placeholder="Nhập địa chỉ chi tiết"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

<View style={styles.formSection}>
  <Text style={styles.sectionTitle}>Vùng nguy hiểm</Text>
  <View style={[styles.inputGroup, { marginBottom: 0 }]}>
    <Text style={[styles.inputLabel, { color: '#dc2626' }]}>
      Xóa đại lý
    </Text>
    <Text style={[styles.helperText, { color: '#dc2626', marginBottom: 12 }]}>
      Hành động này sẽ xóa vĩnh viễn đại lý "{dealer.name}" và không thể hoàn tác.
    </Text>
    <TouchableOpacity
      style={[
        styles.deleteButton,
        deleteLoading && styles.deleteButtonDisabled
      ]}
      onPress={handleDeleteDealer}
      disabled={deleteLoading}
    >
      {deleteLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.deleteButtonText}>Xóa Đại Lý</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
</View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Cập nhật Đại lý</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Region Picker Modal */}
      <Modal
        visible={showRegionPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRegionPicker(false)}
      >
        <View style={pickerModalStyles.container}>
          <View style={pickerModalStyles.content}>
            <View style={pickerModalStyles.header}>
              <Text style={pickerModalStyles.title}>Chọn vùng miền</Text>
              <TouchableOpacity onPress={() => setShowRegionPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={regions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    pickerModalStyles.item,
                    formData.regionId === item.id && pickerModalStyles.itemSelected,
                  ]}
                  onPress={() => handleRegionSelect(item.id)}
                >
                  <Text style={[
                    pickerModalStyles.itemText,
                    formData.regionId === item.id && pickerModalStyles.itemTextSelected,
                  ]}>
                    {item.name}
                  </Text>
                  {formData.regionId === item.id && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={pickerModalStyles.emptyState}>
                  <Text style={pickerModalStyles.emptyText}>Không có vùng miền nào</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}