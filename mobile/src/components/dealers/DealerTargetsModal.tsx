// src/components/dealers/DealerTargetsModal.tsx
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
import type { Dealer, DealerTarget, CreateTargetInput } from '@/lib/api/dealerApi';
import { styles } from './styles';

interface DealerTargetsModalProps {
  visible: boolean;
  dealer: Dealer | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const getMonthName = (month: number) => {
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  return months[month - 1] || `Tháng ${month}`;
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return '#10b981';
  if (percentage >= 70) return '#3b82f6';
  if (percentage >= 50) return '#f59e0b';
  return '#ef4444';
};

export default function DealerTargetsModal({
  visible,
  dealer,
  onClose,
  onSuccess,
}: DealerTargetsModalProps) {
  const [targets, setTargets] = useState<DealerTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTarget, setShowCreateTarget] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadTargets = async () => {
    if (!dealer) return;
    
    setLoading(true);
    try {
      const response = await dealerApi.getDealerTargets(dealer.id);
      if (response.success) {
        setTargets(response.data || []);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Failed to load targets:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách chỉ tiêu');
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && dealer) {
      loadTargets();
    }
  }, [visible, dealer]);

  const handleCreateTarget = async (targetData: CreateTargetInput) => {
    if (!dealer) return;

    // VALIDATION: Kiểm tra đã có chỉ tiêu cho tháng này chưa
    const existingTarget = targets.find(
      target => target.month === targetData.month && target.year === targetData.year
    );
    
    if (existingTarget) {
      Alert.alert('Lỗi', `Đã có chỉ tiêu cho ${getMonthName(targetData.month)}/${targetData.year}. Vui lòng chọn tháng khác.`);
      return;
    }

    setCreating(true);
    try {
      const response = await dealerApi.createDealerTarget(dealer.id, targetData);
      if (response.success) {
        const newTarget = response.data;
        setTargets(prev => [...prev, newTarget]);
        setShowCreateTarget(false);
        onSuccess('Chỉ tiêu đã được tạo thành công');
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi tạo chỉ tiêu');
    } finally {
      setCreating(false);
    }
  };

  const getProgressPercentage = (target: DealerTarget) => {
    if (target.targetAmount === 0) return 0;
    return Math.min((target.achievedAmount / target.targetAmount) * 100, 100);
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
            <Text style={styles.modalTitle}>Chỉ tiêu - {dealer.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity 
                style={{ padding: 4 }}
                onPress={() => setShowCreateTarget(true)}
              >
                <Ionicons name="add" size={24} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Đang tải chỉ tiêu...</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalContent}>
              {targets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="flag-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyStateTitle}>Chưa có chỉ tiêu nào</Text>
                  <Text style={styles.emptyStateText}>
                    Thêm chỉ tiêu mới để theo dõi hiệu suất đại lý
                  </Text>
                  <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={() => setShowCreateTarget(true)}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Thêm chỉ tiêu mới</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.targetsList}>
                  <Text style={styles.sectionTitle}>Chỉ tiêu theo tháng</Text>
                  {targets.map(target => (
                    <View key={`target-${target.id}-${target.month}-${target.year}`} style={styles.targetCard}>
                      <View style={styles.targetHeader}>
                        <Text style={styles.targetPeriod}>
                          {getMonthName(target.month)}/{target.year}
                        </Text>
                        {/* ĐÃ LOẠI BỎ NÚT XÓA */}
                      </View>
                      
                      <View style={styles.targetAmounts}>
                        <View style={styles.amountItem}>
                          <Text style={styles.amountLabel}>Đã đạt</Text>
                          <Text style={styles.achievedAmount}>
                            {formatCurrency(target.achievedAmount)}
                          </Text>
                        </View>
                        <View style={styles.amountItem}>
                          <Text style={styles.amountLabel}>Mục tiêu</Text>
                          <Text style={styles.targetAmount}>
                            {formatCurrency(target.targetAmount)}
                          </Text>
                        </View>
                        <View style={styles.amountItem}>
                          <Text style={styles.amountLabel}>Tỷ lệ</Text>
                          <Text style={styles.progressPercentage}>
                            {getProgressPercentage(target).toFixed(1)}%
                          </Text>
                        </View>
                      </View>

                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill,
                            { 
                              width: `${getProgressPercentage(target)}%`,
                              backgroundColor: getProgressColor(getProgressPercentage(target))
                            }
                          ]}
                        />
                      </View>
                      
                      <Text style={styles.progressText}>
                        Đã đạt {formatCurrency(target.achievedAmount)} / {formatCurrency(target.targetAmount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {/* Create Target Modal */}
          <CreateTargetModal
            visible={showCreateTarget}
            onClose={() => setShowCreateTarget(false)}
            onCreate={handleCreateTarget}
            loading={creating}
            existingTargets={targets}
          />
        </View>
      </Modal>
    </>
  );
}

// Create Target Modal Component
interface CreateTargetModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (targetData: CreateTargetInput) => void;
  loading: boolean;
  existingTargets: DealerTarget[];
}

function CreateTargetModal({ visible, onClose, onCreate, loading, existingTargets }: CreateTargetModalProps) {
  const [formData, setFormData] = useState<CreateTargetInput>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    targetAmount: 0,
  });

  const [errors, setErrors] = useState<{ targetAmount?: string; month?: string }>({});

  // Kiểm tra xem đã có chỉ tiêu cho tháng/năm này chưa
  const isTargetExists = (month: number, year: number) => {
    return existingTargets.some(target => target.month === month && target.year === year);
  };

  const handleSubmit = () => {
    // Validation
    const newErrors: { targetAmount?: string; month?: string } = {};
    
    if (formData.targetAmount <= 0) {
      newErrors.targetAmount = 'Mục tiêu phải lớn hơn 0';
    }
    
    // Kiểm tra trùng tháng
    if (isTargetExists(formData.month, formData.year)) {
      newErrors.month = `Đã có chỉ tiêu cho ${getMonthName(formData.month)}/${formData.year}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onCreate(formData);
    // Reset form
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      targetAmount: 0,
    });
    setErrors({});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Thêm chỉ tiêu mới</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tháng *</Text>
                  <View style={[styles.pickerContainer, errors.month && styles.inputError]}>
                    <Text style={styles.pickerText}>
                      Tháng {formData.month}
                    </Text>
                  </View>
                  {errors.month && <Text style={styles.errorText}>{errors.month}</Text>}
                </View>
              </View>

              <View style={styles.formColumn}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Năm *</Text>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>
                      {formData.year}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mục tiêu doanh số (VND) *</Text>
              <TextInput
                style={[styles.textInput, errors.targetAmount && styles.inputError]}
                value={formData.targetAmount === 0 ? '' : formData.targetAmount.toString()}
                onChangeText={(value) => {
                  const numValue = parseInt(value.replace(/\D/g, '')) || 0;
                  setFormData(prev => ({ ...prev, targetAmount: numValue }));
                  if (errors.targetAmount) {
                    setErrors(prev => ({ ...prev, targetAmount: undefined }));
                  }
                }}
                placeholder="Nhập mục tiêu doanh số"
                keyboardType="numeric"
              />
              {errors.targetAmount && (
                <Text style={styles.errorText}>{errors.targetAmount}</Text>
              )}
              <Text style={styles.helperText}>
                Nhập số tiền mục tiêu (ví dụ: 100000000 cho 100 triệu)
              </Text>
            </View>

            {formData.targetAmount > 0 && (
              <View style={[styles.targetCard, { backgroundColor: '#f0f9ff' }]}>
                <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Xem trước</Text>
                <Text style={styles.detailText}>
                  {getMonthName(formData.month)}/{formData.year}
                </Text>
                <Text style={styles.targetAmount}>
                  Mục tiêu: {formatCurrency(formData.targetAmount)}
                </Text>
                {isTargetExists(formData.month, formData.year) && (
                  <Text style={[styles.errorText, { marginTop: 8 }]}>
                    ⚠️ Đã có chỉ tiêu cho tháng này
                  </Text>
                )}
              </View>
            )}
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
              <Text style={styles.submitButtonText}>Tạo chỉ tiêu</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}