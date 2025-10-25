// mobile/src/components/customers/FeedbackModal.tsx
import React from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '@/lib/api/customerApi';
import { styles } from './styles';

interface FeedbackModalProps {
  visible: boolean;
  customer: Customer | null;
  feedbacks: any[];
  onClose: () => void;
}

export default function FeedbackModal({
  visible,
  customer,
  feedbacks,
  onClose,
}: FeedbackModalProps) {
  const { height } = Dimensions.get('window');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.85 }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Phản hồi từ {customer?.firstName} {customer?.lastName}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalBody}>
            {feedbacks && feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <View key={fb.id} style={styles.feedbackItem}>
                  {/* Header */}
                  <View style={styles.feedbackHeader}>
                    <Text style={styles.feedbackCategory}>
                      {fb.category || 'N/A'}
                    </Text>
                    <Text style={styles.rating}>⭐ {fb.rating || 0}/5</Text>
                  </View>

                  {/* Comment */}
                  <Text style={styles.feedbackComment}>{fb.comment}</Text>

                  {/* Date */}
                  {fb.createdAt && (
                    <Text style={styles.feedbackDate}>
                      {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyMessage}>Không có phản hồi nào</Text>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}