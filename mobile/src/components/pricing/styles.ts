import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#fff',
  },
  vehicleDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  
  // Promotion List Styles
  promotionList: {
    maxHeight: 500,
  },
  promotionItem: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  promotionItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  promotionItemDisabled: {
    opacity: 0.5,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  promotionInfo: {
    flex: 1,
    marginRight: 12,
  },
  promotionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  promotionDiscount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 4,
  },
  promotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  promotionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  promotionMinPurchase: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  promotionType: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Result Card Styles
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  discountCard: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  promotionCard: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  finalPriceCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#86efac',
    padding: 20,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  discountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7c3aed',
  },
  promotionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ea580c',
  },
  finalPriceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#065f46',
    marginBottom: 4,
  },
  finalPriceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 8,
  },
  confirmedText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  estimateText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  
  // Summary Row Styles
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  discountsSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  discountsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  discountName: {
    fontSize: 13,
    color: '#6b7280',
  },
  discountAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#dc2626',
  },
  totalRow: {
    marginTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  totalDiscount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
  
  // Button Styles
  calculateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  calculateButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Payment Method
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});