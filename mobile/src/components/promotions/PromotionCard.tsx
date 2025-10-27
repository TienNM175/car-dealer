// mobile/src/components/promotions/PromotionCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Tag, Calendar, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { Promotion } from '@/lib/types/promotion.types';
import { styles } from './styles';

interface PromotionCardProps {
    promotion: Promotion;
    onToggle?: (id: string) => void;
    onEdit?: (promotion: Promotion) => void;
    onDelete?: (id: string) => void;
    readOnly?: boolean;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({
    promotion,
    onToggle,
    onEdit,
    onDelete,
    readOnly = false,
}) => {
    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const formatDiscount = () => {
        if (promotion.discountType === 'PERCENTAGE') {
            return `${promotion.discountValue}%`;
        }
        return formatCurrency(promotion.discountValue);
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{promotion.name}</Text>
                <View
                    style={[
                        styles.statusBadge,
                        promotion.isActive
                            ? styles.statusBadgeActive
                            : styles.statusBadgeInactive,
                    ]}
                >
                    <Text
                        style={[
                            styles.statusText,
                            promotion.isActive
                                ? styles.statusTextActive
                                : styles.statusTextInactive,
                        ]}
                    >
                        {promotion.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </Text>
                </View>
            </View>

            {/* Description */}
            {promotion.description && (
                <Text style={styles.cardDescription} numberOfLines={2}>
                    {promotion.description}
                </Text>
            )}

            {/* Info */}
            <View style={styles.cardInfo}>
                <View style={styles.infoItem}>
                    <Tag size={14} color="#3b82f6" />
                    <Text style={styles.infoText}>{formatDiscount()}</Text>
                </View>
                {promotion.minPurchase && (
                    <View style={styles.infoItem}>
                        <Text style={styles.infoText}>
                            Tối thiểu: {formatCurrency(promotion.minPurchase)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Dates */}
            <View style={styles.cardDates}>
                <View style={styles.dateItem}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.dateText} numberOfLines={1}>
                        Từ: {formatDate(promotion.startDate)}
                    </Text>
                </View>
                {promotion.endDate && (
                    <View style={styles.dateItem}>
                        <Calendar size={14} color="#6b7280" />
                        <Text style={styles.dateText} numberOfLines={1}>
                            Đến: {formatDate(promotion.endDate)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Actions */}
            {!readOnly && (
                <View style={styles.cardActions}>
                    {onToggle && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.toggleButton]}
                            onPress={() => onToggle(promotion.id)}
                        >
                            {promotion.isActive ? (
                                <ToggleRight size={16} color="#3b82f6" />
                            ) : (
                                <ToggleLeft size={16} color="#3b82f6" />
                            )}
                            <Text style={[styles.actionButtonText, styles.toggleButtonText]}>
                                {promotion.isActive ? 'Tắt' : 'Bật'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {onEdit && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.editButton]}
                            onPress={() => onEdit(promotion)}
                        >
                            <Edit size={16} color="#10b981" />
                            <Text style={[styles.actionButtonText, styles.editButtonText]}>
                                Sửa
                            </Text>
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => onDelete(promotion.id)}
                        >
                            <Trash2 size={16} color="#ef4444" />
                            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                                Xóa
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};
