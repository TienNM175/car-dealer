// mobile/src/components/promotions/DeleteConfirmModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { styles } from './styles';

interface DeleteConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    promotionName: string;
    loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    visible,
    onClose,
    onConfirm,
    promotionName,
    loading = false,
}) => {
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.deleteModalContent}>
                    <View style={styles.deleteModalIcon}>
                        <AlertCircle size={48} color="#ef4444" />
                    </View>

                    <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>

                    <Text style={styles.deleteModalMessage}>
                        Bạn có chắc chắn muốn xóa khuyến mãi "{promotionName}"?
                        Hành động này không thể hoàn tác.
                    </Text>

                    <View style={styles.deleteModalActions}>
                        <TouchableOpacity
                            style={styles.deleteModalCancel}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.deleteModalCancelText}>Hủy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteModalConfirm}
                            onPress={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.deleteModalConfirmText}>Xóa</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
