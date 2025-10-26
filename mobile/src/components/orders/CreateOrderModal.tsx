import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { X, Save, Package, Search, ChevronDown, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { dealerOrderApi, CreateDealerOrderInput } from '@/lib/api/dealerOrderApi';
import { vehicleApi, Vehicle } from '@/lib/api/vehicleApi';
import { StyleSheet } from 'react-native';

interface CreateOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOrderModal({ visible, onClose, onSuccess }: CreateOrderModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchVehicle, setSearchVehicle] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleList, setShowVehicleList] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    quantity: 1,
    notes: ''
  });

useEffect(() => {
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleApi.getAllVehicles(
        { 
          status: 'ACTIVE',
          search: searchVehicle 
        },
        { 
          limit: 20,
          sortBy: 'model',
          sortOrder: 'asc'
        }
      );
      
      // Handle API response structure
      const responseData = response.data.data || response.data;
      const vehiclesData = Array.isArray(responseData) ? responseData : responseData.data || [];
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách xe');
    } finally {
      setLoading(false);
    }
  };

  if (visible) {
    fetchVehicles();
    setErrors({});
  }
}, [visible, searchVehicle]);

  const resetForm = () => {
    setFormData({ quantity: 1, notes: '' });
    setSelectedVehicle(null);
    setSearchVehicle('');
    setShowVehicleList(false);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedVehicle) {
      newErrors.vehicle = 'Vui lòng chọn xe';
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Số lượng phải lớn hơn 0';
    } else if (formData.quantity > 100) {
      newErrors.quantity = 'Số lượng tối đa là 100 xe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    if (!selectedVehicle || !user?.dealerId || !user?.id) {
      Alert.alert('Lỗi', 'Thông tin đại lý không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      
      const orderData: CreateDealerOrderInput = {
        dealerId: user.dealerId,
        staffId: user.id,
        vehicleId: selectedVehicle.id,
        quantity: formData.quantity,
        notes: formData.notes
      };

      await dealerOrderApi.createDealerOrder(orderData);
      
      Alert.alert('Thành công', 'Tạo đơn hàng thành công!');
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating order:', err);
      const errorMessage = err.response?.data?.message || 'Không thể tạo đơn hàng';
      
      if (errorMessage.includes('Insufficient')) {
        Alert.alert('Lỗi tồn kho', errorMessage);
      } else if (errorMessage.includes('not found')) {
        Alert.alert('Lỗi dữ liệu', errorMessage);
      } else {
        Alert.alert('Lỗi', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedVehicle) return 0;
    return Number(selectedVehicle.wholesalePrice) * formData.quantity;
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.model.toLowerCase().includes(searchVehicle.toLowerCase()) ||
    vehicle.manufacturer?.name.toLowerCase().includes(searchVehicle.toLowerCase())
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tạo Đơn Đặt Hàng Mới</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Dealer Info Card - Giống web */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Thông tin đại lý</Text>
              <Text style={styles.dealerName}>{user?.dealer?.name}</Text>              
            </View>

            {/* Staff Info Card - Giống web */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Người tạo đơn</Text>
              <Text style={styles.staffName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.staffEmail}>{user?.email}</Text>
            </View>

            {/* Vehicle Selection - Giống web dropdown */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>
                Chọn xe <Text style={styles.required}>*</Text>
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.vehicleSelector,
                  errors.vehicle && styles.inputError
                ]}
                onPress={() => setShowVehicleList(!showVehicleList)}
              >
                <Text style={selectedVehicle ? styles.vehicleSelectedText : styles.vehiclePlaceholder}>
                  {selectedVehicle 
                    ? `${selectedVehicle.manufacturer?.name} ${selectedVehicle.model} ${selectedVehicle.variant}`
                    : 'Chọn xe từ danh sách...'
                  }
                </Text>
                <ChevronDown size={20} color="#6b7280" />
              </TouchableOpacity>

              {errors.vehicle && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={14} color="#dc2626" />
                  <Text style={styles.errorText}>{errors.vehicle}</Text>
                </View>
              )}

              {showVehicleList && (
                <View style={styles.vehicleDropdown}>
                  {/* Search trong dropdown */}
                  <View style={styles.dropdownSearch}>
                    <Search size={16} color="#6b7280" />
                    <TextInput
                      style={styles.dropdownSearchInput}
                      placeholder="Tìm kiếm xe..."
                      value={searchVehicle}
                      onChangeText={setSearchVehicle}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  
                  {/* List vehicles */}
                  <ScrollView style={styles.vehicleList} nestedScrollEnabled>
                    {filteredVehicles.length === 0 ? (
                      <Text style={styles.noVehiclesText}>Không tìm thấy xe phù hợp</Text>
                    ) : (
                      filteredVehicles.map(vehicle => (
                        <TouchableOpacity
                          key={vehicle.id}
                          style={styles.vehicleOption}
                          onPress={() => {
                            setSelectedVehicle(vehicle);
                            setShowVehicleList(false);
                            setSearchVehicle('');
                            setErrors(prev => ({ ...prev, vehicle: '' }));
                          }}
                        >
                          <View style={styles.vehicleOptionInfo}>
                            <Text style={styles.vehicleOptionName}>
                              {vehicle.manufacturer?.name} {vehicle.model} {vehicle.variant}
                            </Text>
                            <Text style={styles.vehicleOptionDetails}>
                              {vehicle.year} • {vehicle.color}
                            </Text>
                          </View>
                          <Text style={styles.vehicleOptionPrice}>
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(Number(vehicle.wholesalePrice))}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Selected Vehicle Details Card - Giống web */}
            {selectedVehicle && (
              <View style={styles.vehicleDetailsCard}>
                <Text style={styles.cardTitle}>Thông tin xe đã chọn</Text>
                <View style={styles.vehicleDetailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Hãng xe</Text>
                    <Text style={styles.detailValue}>{selectedVehicle.manufacturer?.name}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Model</Text>
                    <Text style={styles.detailValue}>{selectedVehicle.model}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Phiên bản</Text>
                    <Text style={styles.detailValue}>{selectedVehicle.variant}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Năm sản xuất</Text>
                    <Text style={styles.detailValue}>{selectedVehicle.year}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Màu sắc</Text>
                    <Text style={styles.detailValue}>{selectedVehicle.color || 'Đa dạng'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Giá sỉ</Text>
                    <Text style={styles.detailValue}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(Number(selectedVehicle.wholesalePrice))}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Quantity Input - Giống web */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>
                Số lượng <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setFormData(prev => ({
                    ...prev,
                    quantity: Math.max(1, prev.quantity - 1)
                  }))}
                  disabled={formData.quantity <= 1}
                >
                  <Text style={[
                    styles.quantityButtonText,
                    formData.quantity <= 1 && styles.quantityButtonDisabled
                  ]}>-</Text>
                </TouchableOpacity>
                
                <TextInput
                  style={[
                    styles.quantityInput,
                    errors.quantity && styles.inputError
                  ]}
                  keyboardType="numeric"
                  value={formData.quantity.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 1;
                    setFormData(prev => ({ ...prev, quantity: value }));
                    if (value >= 1 && value <= 100) {
                      setErrors(prev => ({ ...prev, quantity: '' }));
                    }
                  }}
                />
                
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setFormData(prev => ({
                    ...prev,
                    quantity: Math.min(100, prev.quantity + 1)
                  }))}
                  disabled={formData.quantity >= 100}
                >
                  <Text style={[
                    styles.quantityButtonText,
                    formData.quantity >= 100 && styles.quantityButtonDisabled
                  ]}>+</Text>
                </TouchableOpacity>
              </View>
              {errors.quantity && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={14} color="#dc2626" />
                  <Text style={styles.errorText}>{errors.quantity}</Text>
                </View>
              )}
            </View>

            {/* Price Calculation Card - Giống web */}
            {selectedVehicle && (
              <View style={styles.calculationCard}>
                <Text style={styles.cardTitle}>Tính toán giá trị đơn hàng</Text>
                <View style={styles.calculationRows}>
                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>Đơn giá sỉ:</Text>
                    <Text style={styles.calculationValue}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(Number(selectedVehicle.wholesalePrice))}
                    </Text>
                  </View>
                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>Số lượng:</Text>
                    <Text style={styles.calculationValue}>{formData.quantity} xe</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={[styles.calculationRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Tổng giá trị đơn hàng:</Text>
                    <Text style={styles.totalValue}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(calculateTotal())}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Notes Input - Giống web */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Ghi chú đơn hàng</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                placeholder="Thêm ghi chú cho đơn hàng (tùy chọn)..."
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
              />
              <Text style={styles.notesHint}>
                {formData.notes.length}/1000 ký tự
              </Text>
            </View>
          </ScrollView>

          {/* Actions Footer - Giống web */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.createButton,
                (!selectedVehicle || loading) && styles.createButtonDisabled
              ]}
              onPress={handleCreateOrder}
              disabled={!selectedVehicle || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Save size={18} color="#fff" />
                  <Text style={styles.createButtonText}>Tạo Đơn Hàng</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  modalBody: {
    padding: 20,
    maxHeight: '80%',
  },
  modalFooter: {
    flexDirection: 'row' as const,
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  // Info Cards
  infoCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  dealerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  dealerAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  staffEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Form Sections
  formSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  
  // Vehicle Selector
  vehicleSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  vehiclePlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
  },
  vehicleSelectedText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500' as const,
  },
  
  // Vehicle Dropdown
  vehicleDropdown: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownSearch: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownSearchInput: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#111827',
  },
  vehicleList: {
    maxHeight: 150,
  },
  vehicleOption: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  vehicleOptionInfo: {
    flex: 1,
  },
  vehicleOptionName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#111827',
    marginBottom: 2,
  },
  vehicleOptionDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  vehicleOptionPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#059669',
  },
  noVehiclesText: {
    textAlign: 'center' as const,
    padding: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  
  // Vehicle Details Card
  vehicleDetailsCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  vehicleDetailsGrid: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  detailLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600' as const,
  },
  
  // Quantity Input
  quantityContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
  },
  quantityButtonDisabled: {
    color: '#9ca3af',
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'center' as const,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    backgroundColor: '#fff',
  },
  
  // Calculation Card
  calculationCard: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  calculationRows: {
    gap: 8,
  },
  calculationRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#374151',
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalRow: {
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#059669',
  },
  
  // Notes Input
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
    textAlignVertical: 'top' as const,
    minHeight: 100,
  },
  notesHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right' as const,
  },
  
  // Buttons
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  createButton: {
    flex: 2,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  
  // Error Styles
  inputError: {
    borderColor: '#dc2626',
  },
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
  },
});