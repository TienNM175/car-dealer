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
    Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
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
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [formData, setFormData] = useState({
        dealerId: dealerId || '',
        name: '',
        description: '',
        discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
        discountValue: '',
        minPurchase: '',
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
    });

    useEffect(() => {
        if (promotion) {
            const startDate = promotion.startDate ? new Date(promotion.startDate) : new Date();
            const endDate = promotion.endDate ? new Date(promotion.endDate) : new Date();
            setFormData({
                dealerId: promotion.dealerId,
                name: promotion.name,
                description: promotion.description || '',
                discountType: promotion.discountType,
                discountValue: String(promotion.discountValue),
                minPurchase: promotion.minPurchase ? String(promotion.minPurchase) : '',
                startDate,
                endDate,
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
                startDate: new Date(),
                endDate: new Date(),
                isActive: true,
            });
        }
    }, [promotion, visible, dealerId]);

    const formatDateForDisplay = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const formatVNDForDisplay = (value: string) => {
        const num = parseFloat(value.replace(/\./g, ''));
        if (isNaN(num)) return value;
        return num.toLocaleString('vi-VN');
    };

    const parseVNDInput = (value: string) => {
        return value.replace(/\./g, '');
    };

    const handleVNDCurrencyChange = (text: string, field: 'discountValue' | 'minPurchase') => {
        const cleaned = text.replace(/\./g, '');
        if (/^\d*$/.test(cleaned)) {
            if (cleaned === '') {
                setFormData({ ...formData, [field]: '' });
            } else {
                const num = parseInt(cleaned);
                const formatted = num.toLocaleString('vi-VN');
                setFormData({ ...formData, [field]: formatted });
            }
        }
    };

    const validateForm = () => {
        // Validate dealer
        if (!formData.dealerId) {
            Alert.alert('Lỗi', 'Phải chọn đại lý');
            return false;
        }

        // Validate name
        if (formData.name.trim().length < 5) {
            Alert.alert('Lỗi', 'Tên khuyến mãi phải có ít nhất 5 ký tự');
            return false;
        }

        // Validate description
        if (formData.description.trim().length < 5) {
            Alert.alert('Lỗi', 'Mô tả phải có ít nhất 5 ký tự');
            return false;
        }

        // Validate discount value
        const discountValueClean = formData.discountType === 'FIXED' ? parseVNDInput(formData.discountValue) : formData.discountValue;
        const discountValueNum = parseFloat(discountValueClean);
        if (!discountValueNum || discountValueNum <= 0) {
            Alert.alert('Lỗi', 'Giá trị giảm giá phải lớn hơn 0');
            return false;
        }

        if (formData.discountType === 'PERCENTAGE' && discountValueNum > 100) {
            Alert.alert('Lỗi', 'Giá trị phần trăm không được vượt quá 100%');
            return false;
        }

        // Validate minPurchase if FIXED
        if (formData.discountType === 'FIXED') {
            if (!formData.minPurchase?.trim()) {
                Alert.alert('Lỗi', 'Giá trị đơn hàng tối thiểu là bắt buộc khi chọn giảm giá cố định');
                return false;
            }
            const cleanMinPurchase = parseVNDInput(formData.minPurchase).trim();
            if (!/^\d+$/.test(cleanMinPurchase)) {
                Alert.alert('Lỗi', 'Giá trị đơn hàng tối thiểu phải là số hợp lệ.');
                return false;
            }
            const minPurchaseNum = parseInt(cleanMinPurchase);
            if (minPurchaseNum <= 0) {
                Alert.alert('Lỗi', 'Giá trị đơn hàng tối thiểu phải lớn hơn 0');
                return false;
            }
        }

        // Validate dates
        if (formData.startDate > formData.endDate) {
            Alert.alert('Lỗi', 'Ngày bắt đầu không được lớn hơn ngày kết thúc');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        const discountValueClean = formData.discountType === 'FIXED' ? parseVNDInput(formData.discountValue) : formData.discountValue;
        const discountValue = parseFloat(discountValueClean);  

        try {
            setLoading(true);
            const submitData: any = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                discountType: formData.discountType,
                discountValue,  
                minPurchase: formData.minPurchase 
                    ? parseFloat(parseVNDInput(formData.minPurchase)) 
                    : undefined,
                startDate: formData.startDate.toISOString(),
                endDate: formData.endDate.toISOString(), 
                isActive: formData.isActive,
                dealerId: formData.dealerId,
            };

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error('Error submitting promotion:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu khuyến mãi');
        } finally {
            setLoading(false);
        }
    };

    const handleStartDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || formData.startDate;
        setShowStartDatePicker(Platform.OS === 'ios');
        setFormData({ ...formData, startDate: currentDate });
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || formData.endDate;
        setShowEndDatePicker(Platform.OS === 'ios');
        setFormData({ ...formData, endDate: currentDate });
    };

    const handleDiscountTypeChange = (value: 'PERCENTAGE' | 'FIXED') => {
        setFormData((prev) => {
            let newDiscountValue = prev.discountValue;
            if (value === 'FIXED' && !prev.discountValue.includes('.')) {
                // Format plain number to VND
                const num = parseInt(prev.discountValue) || 0;
                newDiscountValue = num.toLocaleString('vi-VN');
            } else if (value === 'PERCENTAGE' && prev.discountValue.includes('.')) {
                // Unformat VND to plain
                newDiscountValue = prev.discountValue.replace(/\./g, '');
            }
            return { ...prev, discountType: value, discountValue: newDiscountValue };
        });
    };

    const handleMinPurchaseChange = (text: string) => {
        handleVNDCurrencyChange(text, 'minPurchase');
    };

    const handleDiscountValueChange = (text: string) => {
        handleVNDCurrencyChange(text, 'discountValue');
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
                        {dealers.length > 0 && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>
                                    Đại lý <Text style={styles.requiredStar}>*</Text>
                                </Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={formData.dealerId}
                                        onValueChange={(value) => setFormData({ ...formData, dealerId: value })}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="-- Chọn đại lý --" value="" />
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
                                placeholder="Nhập tên khuyến mãi (tối thiểu 5 ký tự)"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Mô tả <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.description}
                                onChangeText={(text) => setFormData({ ...formData, description: text })}
                                placeholder="Nhập mô tả (tối thiểu 5 ký tự)"
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
                                    onValueChange={handleDiscountTypeChange}
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
                                value={formData.discountType === 'FIXED' ? formatVNDForDisplay(formData.discountValue) : formData.discountValue}
                                onChangeText={formData.discountType === 'FIXED' ? handleDiscountValueChange : (text) => setFormData({ ...formData, discountValue: text })}
                                placeholder={
                                    formData.discountType === 'PERCENTAGE' ? 'Nhập % (0-100)' : 'Nhập số tiền (ví dụ: 1.000)'
                                }
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Min Purchase */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Giá trị đơn hàng tối thiểu (VND){formData.discountType === 'FIXED' && <Text style={styles.requiredStar}>*</Text>}
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={formData.discountType === 'FIXED' ? formatVNDForDisplay(formData.minPurchase) : formData.minPurchase}
                                onChangeText={formData.discountType === 'FIXED' ? handleMinPurchaseChange : (text) => setFormData({ ...formData, minPurchase: text })}
                                placeholder="Nhập số tiền (ví dụ: 1.000)"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Start Date */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Ngày bắt đầu <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={styles.dateInput}  
                                onPress={() => setShowStartDatePicker(true)}
                            >
                                <Text style={styles.dateText}>{formatDateForDisplay(formData.startDate)}</Text> 
                            </TouchableOpacity>
                            {showStartDatePicker && (
                                <DateTimePicker
                                    value={formData.startDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleStartDateChange}
                                />
                            )}
                        </View>

                        {/* End Date */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Ngày kết thúc</Text>
                            <TouchableOpacity
                                style={styles.dateInput}  
                                onPress={() => setShowEndDatePicker(true)}
                            >
                                <Text style={styles.dateText}>{formatDateForDisplay(formData.endDate)}</Text>  
                            </TouchableOpacity>
                            {showEndDatePicker && (
                                <DateTimePicker
                                    value={formData.endDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleEndDateChange}
                                />
                            )}
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