// mobile/src/components/promotions/PromotionFormModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { Promotion, CreatePromotionDTO, UpdatePromotionDTO } from '@/lib/types/promotion.types';
import { styles } from './styles';

interface PromotionFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreatePromotionDTO | UpdatePromotionDTO) => Promise<void>;
    promotion?: Promotion | null;
    dealerId?: string;
    dealers?: Array<{ id: string; name: string }>;
}

export const PromotionFormModal: React.FC<PromotionFormModalProps> = ({
    visible,
    onClose,
    onSubmit,
    promotion,
    dealerId,
    dealers = [],
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        dealerId: dealerId || '',
        name: '',
        description: '',
        discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
        discountValue: '',
        minPurchase: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true,
    });

    useEffect(() => {
        if (promotion) {
            setFormData({
                dealerId: promotion.dealerId,
                name: promotion.name,
                description: promotion.description || '',
                discountType: promotion.discountType,
                discountValue: String(promotion.discountValue),
                minPurchase: promotion.minPurchase ? String(promotion.minPurchase) : '',
                startDate: new Date(promotion.startDate).toISOString().split('T')[0],
                endDate: promotion.endDate
                    ? new Date(promotion.endDate).toISOString().split('T')[0]
                    : '',
                isActive: promotion.isActive,
            });
        } else {
            // Reset form for new promotion
            setFormData({
                dealerId: dealerId || '',
                name: '',
                description: '',
                discountType: 'PERCENTAGE',
                discountValue: '',
                minPurchase: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                isActive: true,
            });
        }
    }, [promotion, visible, dealerId]);

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert('Vui lòng nhập tên khuyến mãi');
            return;
        }

        const discountValue = parseFloat(formData.discountValue);
        if (!discountValue || discountValue <= 0) {
            alert('Giá trị giảm giá phải lớn hơn 0');
            return;
        }

        if (formData.discountType === 'PERCENTAGE' && discountValue > 100) {
            alert('Giá trị phần trăm không được vượt quá 100%');
            return;
        }

        try {
            setLoading(true);
            const submitData: any = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                discountType: formData.discountType,
                discountValue,
                minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
                startDate: formData.startDate,
                endDate: formData.endDate || undefined,
                isActive: formData.isActive,
            };

            // Only include dealerId if it's selected
            if (formData.dealerId) {
                submitData.dealerId = formData.dealerId;
            }

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error('Error submitting promotion:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {promotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView style={styles.modalBody} contentContainerStyle={styles.scrollContent}>
                        {/* Dealer Selection - Only show if dealers list is provided and not editing */}
                        {dealers.length > 0 && !promotion && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>
                                    Đại lý (Tùy chọn)
                                </Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={formData.dealerId}
                                        onValueChange={(value) => setFormData({ ...formData, dealerId: value })}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="-- Tất cả đại lý --" value="" />
                                        {dealers.map((dealer) => (
                                            <Picker.Item key={dealer.id} label={dealer.name} value={dealer.id} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        )}

                        {/* Name */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Tên khuyến mãi <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                placeholder="Nhập tên khuyến mãi"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mô tả</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.description}
                                onChangeText={(text) => setFormData({ ...formData, description: text })}
                                placeholder="Nhập mô tả"
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Discount Type */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Loại giảm giá <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.discountType}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, discountType: value as 'PERCENTAGE' | 'FIXED' })
                                    }
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Phần trăm (%)" value="PERCENTAGE" />
                                    <Picker.Item label="Số tiền cố định (VND)" value="FIXED" />
                                </Picker>
                            </View>
                        </View>

                        {/* Discount Value */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Giá trị giảm giá <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={formData.discountValue}
                                onChangeText={(text) => setFormData({ ...formData, discountValue: text })}
                                placeholder={
                                    formData.discountType === 'PERCENTAGE' ? 'Nhập % (0-100)' : 'Nhập số tiền'
                                }
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Min Purchase */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Giá trị đơn hàng tối thiểu (VND)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.minPurchase}
                                onChangeText={(text) => setFormData({ ...formData, minPurchase: text })}
                                placeholder="Nhập số tiền"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Start Date */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Ngày bắt đầu <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={formData.startDate}
                                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* End Date */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Ngày kết thúc</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.endDate}
                                onChangeText={(text) => setFormData({ ...formData, endDate: text })}
                                placeholder="YYYY-MM-DD (Tùy chọn)"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Active Status */}
                        <View style={styles.formGroup}>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Kích hoạt ngay</Text>
                                <Switch
                                    value={formData.isActive}
                                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                                    trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                                    thumbColor={formData.isActive ? '#3b82f6' : '#f3f4f6'}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {promotion ? 'Cập nhật' : 'Tạo mới'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
