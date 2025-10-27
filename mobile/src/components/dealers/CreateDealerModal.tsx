// src/components/dealers/CreateDealerModal.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dealerApi } from '@/lib/api/dealerApi';
import type { Region, CreateDealerInput } from '@/lib/api/dealerApi';
import { styles } from './styles';

interface CreateDealerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (message?: string) => void;
  regions: Region[];
}

export default function CreateDealerModal({
  visible,
  onClose,
  onSuccess,
  regions,
}: CreateDealerModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDealerInput>({
    name: '',
    code: '',
    regionId: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateDealerInput, string>>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  const handleSelectRegion = (regionId: string) => {
    setFormData(prev => ({ ...prev, regionId }));
    setShowRegionDropdown(false);
    if (errors.regionId) {
      setErrors(prev => ({ ...prev, regionId: undefined }));
    }
  };

  const handleChange = (field: keyof CreateDealerInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateDealerInput, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên đại lý là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên đại lý phải có ít nhất 2 ký tự';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Mã đại lý là bắt buộc';
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Mã đại lý chỉ được chứa chữ in hoa, số và dấu gạch ngang';
    } else if (formData.code.trim().length < 3) {
      newErrors.code = 'Mã đại lý phải có ít nhất 3 ký tự';
    }

    if (!formData.regionId) {
      newErrors.regionId = 'Vùng miền là bắt buộc';
    }

    if (formData.phone && !/^(\+84|0)[3|5|7|8|9][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Creating dealer with data:', formData);
      
      const response = await dealerApi.createDealer(formData);
      
      console.log('✅ Create response:', response);
      
      if (response.success) {
        console.log('🎉 Create successful');
        // Reset form
        setFormData({
          name: '',
          code: '',
          regionId: '',
          address: '',
          city: '',
          phone: '',
          email: '',
        });
        setErrors({});
        setSubmitError('');
        onSuccess(response.message || 'Đại lý đã được tạo thành công');
      } else {
        console.log('❌ Create failed:', response.message);
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('💥 Create error:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra khi tạo đại lý';
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form khi đóng modal
    setFormData({
      name: '',
      code: '',
      regionId: '',
      address: '',
      city: '',
      phone: '',
      email: '',
    });
    setErrors({});
    setSubmitError('');
    setShowRegionDropdown(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.dealerIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="business" size={20} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.modalTitle}>Thêm Đại lý Mới</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                Tạo đại lý mới trong hệ thống
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Error Message */}
          {submitError && (
            <View style={{ 
              backgroundColor: '#fef2f2', 
              borderColor: '#fecaca',
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginBottom: 16 
            }}>
              <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '500' }}>
                {submitError}
              </Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên đại lý *</Text>
              <TextInput
                style={[styles.textInput, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                placeholder="Nhập tên đại lý"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mã đại lý *</Text>
              <TextInput
                style={[styles.textInput, errors.code && styles.inputError]}
                value={formData.code}
                onChangeText={(value) => handleChange('code', value.toUpperCase())}
                placeholder="VD: DL-HN-001"
              />
              {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
              <Text style={styles.helperText}>
                Chỉ sử dụng chữ in hoa, số và dấu gạch ngang
              </Text>
            </View>

            {/* Region - FIXED: Sử dụng Modal riêng cho dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vùng miền *</Text>
              <TouchableOpacity 
                style={[styles.pickerContainer, errors.regionId && styles.inputError]}
                onPress={() => setShowRegionDropdown(true)}
              >
                <Text style={[styles.pickerText, !formData.regionId && styles.placeholderText]}>
                  {formData.regionId ? regions.find(r => r.id === formData.regionId)?.name : 'Chọn vùng miền'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
              {errors.regionId && <Text style={styles.errorText}>{errors.regionId}</Text>}
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="location-outline" size={16} color="#6b7280" /> Thành phố
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.city}
                onChangeText={(value) => handleChange('city', value)}
                placeholder="Nhập thành phố"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
            
            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="call-outline" size={16} color="#6b7280" /> Số điện thoại
              </Text>
              <TextInput
                style={[styles.textInput, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="mail-outline" size={16} color="#6b7280" /> Email
              </Text>
              <TextInput
                style={[styles.textInput, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                placeholder="Nhập email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Địa chỉ</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => handleChange('address', value)}
                placeholder="Nhập địa chỉ chi tiết"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions - ĐÃ SỬA: Nút lớn hơn và cân đối */}
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              loading && styles.submitButtonDisabled,
              {
                height: 56, // Tăng chiều cao
                minWidth: '100%', // Chiếm toàn bộ chiều rộng
                alignSelf: 'stretch', // Căng ra toàn bộ
                justifyContent: 'center', // Căn giữa nội dung
                alignItems: 'center', // Căn giữa nội dung
                paddingVertical: 16, // Padding lớn hơn
              }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[
                styles.submitButtonText,
                {
                  fontSize: 18, // Font lớn hơn
                  fontWeight: '600', // Đậm hơn
                }
              ]}>
                Tạo Đại lý
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Region Selection Modal */}
        <Modal
          visible={showRegionDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRegionDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowRegionDropdown(false)}
          >
            <View style={styles.modalDropdown}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Chọn Vùng Miền</Text>
                <TouchableOpacity onPress={() => setShowRegionDropdown(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.dropdownScroll}>
                {regions.map(region => (
                  <TouchableOpacity
                    key={region.id}
                    style={[
                      styles.dropdownItem,
                      formData.regionId === region.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleSelectRegion(region.id)}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      formData.regionId === region.id && styles.dropdownItemTextSelected
                    ]}>
                      {region.name}
                    </Text>
                    {formData.regionId === region.id && (
                      <Ionicons name="checkmark" size={20} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
}