// mobile/src/components/promotions/styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    // Container
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // List
    listContent: {
        padding: 12,
        paddingBottom: 24,
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280',
        fontSize: 14,
    },
    emptyText: {
        marginTop: 12,
        color: '#6b7280',
        fontSize: 16,
    },

    // Promotion Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeActive: {
        backgroundColor: '#d1fae5',
    },
    statusBadgeInactive: {
        backgroundColor: '#fee2e2',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextActive: {
        color: '#065f46',
    },
    statusTextInactive: {
        color: '#991b1b',
    },
    cardDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
        lineHeight: 20,
    },
    cardInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    infoText: {
        marginLeft: 6,
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    cardDates: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8,
    },
    dateItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
    },
    dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
},
    dateText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#6b7280',
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    toggleButton: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    editButton: {
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
    },
    deleteButton: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    actionButtonText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    toggleButtonText: {
        color: '#3b82f6',
    },
    editButtonText: {
        color: '#10b981',
    },
    deleteButtonText: {
        color: '#ef4444',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    scrollContent: {
        paddingBottom: 20,
    },

    // Form
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    requiredStar: {
        color: '#ef4444',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },

    // Modal Footer
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },

    // Delete Modal
    deleteModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '85%',
        padding: 20,
    },
    deleteModalIcon: {
        alignSelf: 'center',
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    deleteModalMessage: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    deleteModalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    deleteModalCancel: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    deleteModalConfirm: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#ef4444',
        alignItems: 'center',
    },
    deleteModalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    deleteModalConfirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },

    // Statistics
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },

    // Filters
    filterSection: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
    },
    filterChipActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    filterChipText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#fff',
    },

    // Alert Messages
    alertContainer: {
        margin: 12,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    alertSuccess: {
        backgroundColor: '#d1fae5',
    },
    alertError: {
        backgroundColor: '#fee2e2',
    },
    alertText: {
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    alertTextSuccess: {
        color: '#065f46',
    },
    alertTextError: {
        color: '#991b1b',
    },
    
});
