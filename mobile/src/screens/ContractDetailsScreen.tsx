// mobile/src/screens/ContractDetailsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants/config';
import { contractLookupApi } from '../api/contractLookup';
import { formatPrice } from '../utils/formatters';

type ContractDetailsScreenNavigationProp = StackNavigationProp<any, 'ContractDetails'>;
type ContractDetailsScreenRouteProp = RouteProp<
  { ContractDetails: { contractData: any } },
  'ContractDetails'
>;

interface Props {
  navigation: ContractDetailsScreenNavigationProp;
  route: ContractDetailsScreenRouteProp;
}

export const ContractDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { contractData } = route.params;
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState<any>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const contract = contractData.contract;
  const customer = contractData.customer;
  const vehicle = contractData.vehicle;
  const dealer = contractData.dealer;
  const debt = contractData.debt;

  const loadPaymentSchedule = async () => {
    if (contract.paymentType !== 'INSTALLMENT') return;
    
    setLoadingSchedule(true);
    try {
      const result = await contractLookupApi.getPaymentSchedule(
        contract.contractCode,
        customer.email,
        customer.phone
      );
      setPaymentSchedule(result.data);
      setShowPaymentSchedule(true);
    } catch (error) {
      console.error('Failed to load payment schedule:', error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return COLORS.success;
      case 'SIGNED':
      case 'DELIVERING':
        return COLORS.primary;
      case 'CANCELLED':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: any = {
      DRAFT: 'Nháp',
      PENDING: 'Chờ ký',
      SIGNED: 'Đã ký',
      DELIVERING: 'Đang giao xe',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chi tiết hợp đồng</Text>
          <Text style={styles.headerSubtitle}>{contract.contractCode}</Text>
        </View>
      </View>

      {/* Status Badge */}
      <View style={styles.statusCard}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(contract.status) }]}>
            {getStatusText(contract.status)}
          </Text>
        </View>
      </View>

      {/* Vehicle Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin xe</Text>
        {vehicle.image && (
          <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
        )}
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleModel}>
            {vehicle.manufacturer.name} {vehicle.model}
          </Text>
          {vehicle.variant && (
            <Text style={styles.vehicleVariant}>{vehicle.variant}</Text>
          )}
          <View style={styles.vehicleDetails}>
            <DetailRow icon="calendar" label="Năm" value={vehicle.year} />
            {vehicle.vin && <DetailRow icon="barcode" label="Số khung" value={vehicle.vin} />}
            {vehicle.color && <DetailRow icon="color-palette" label="Màu" value={vehicle.color} />}
          </View>
        </View>
      </View>

      {/* Payment Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin thanh toán</Text>
        <View style={styles.paymentSummary}>
          <SummaryRow label="Giá gốc" value={formatPrice(contract.basePrice, 'VND')} />
          <SummaryRow label="Giảm giá" value={`-${formatPrice(contract.discount, 'VND')}`} isDiscount />
          <SummaryRow label="Thuế VAT (10%)" value={formatPrice(contract.tax, 'VND')} />
          <View style={styles.divider} />
          <SummaryRow
            label="Tổng tiền"
            value={formatPrice(contract.finalPrice, 'VND')}
            isTotal
          />
        </View>

        {contract.paymentType === 'INSTALLMENT' && (
          <View style={styles.installmentInfo}>
            <Ionicons name="card" size={24} color={COLORS.primary} />
            <View style={styles.installmentDetails}>
              <Text style={styles.installmentLabel}>Trả góp {contract.installmentMonths} tháng</Text>
              <Text style={styles.installmentAmount}>
                {formatPrice(contract.monthlyPayment, 'VND')}/tháng
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Debt Information */}
      <View style={[styles.card, debt.isOverdue && styles.overdueCard]}>
        <View style={styles.debtHeader}>
          <Text style={styles.cardTitle}>Thông tin công nợ</Text>
          {debt.isOverdue && (
            <View style={styles.overdueBadge}>
              <Ionicons name="warning" size={16} color={COLORS.error} />
              <Text style={styles.overdueText}>Quá hạn</Text>
            </View>
          )}
        </View>

        <View style={styles.debtSummary}>
          <DebtRow
            icon="cash"
            label="Đã thanh toán"
            value={formatPrice(debt.paidAmount, 'VND')}
            color={COLORS.success}
          />
          <DebtRow
            icon="wallet"
            label="Còn nợ"
            value={formatPrice(debt.remainingDebt, 'VND')}
            color={debt.isPaid ? COLORS.success : COLORS.error}
            isHighlight
          />

          {debt.paymentType === 'INSTALLMENT' && (
            <>
              <View style={styles.divider} />
              <DebtRow
                icon="calendar"
                label="Số tháng đã trả"
                value={`${debt.monthsPaid}/${debt.installmentMonths} tháng`}
              />
              <DebtRow
                icon="time"
                label="Số tháng còn lại"
                value={`${debt.remainingMonths} tháng`}
              />
              {debt.nextPaymentDate && !debt.isPaid && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.nextPayment}>
                    <Ionicons name="alarm" size={20} color={debt.isOverdue ? COLORS.error : COLORS.primary} />
                    <View style={styles.nextPaymentInfo}>
                      <Text style={styles.nextPaymentLabel}>Kỳ thanh toán tiếp theo</Text>
                      <Text style={[styles.nextPaymentDate, debt.isOverdue && styles.overdueText]}>
                        {new Date(debt.nextPaymentDate).toLocaleDateString('vi-VN')}
                      </Text>
                      <Text style={styles.nextPaymentAmount}>
                        {formatPrice(debt.nextPaymentAmount, 'VND')}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </>
          )}
        </View>

        {/* Payment Schedule Button */}
        {contract.paymentType === 'INSTALLMENT' && !debt.isPaid && (
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={loadPaymentSchedule}
            disabled={loadingSchedule}
          >
            {loadingSchedule ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="list" size={20} color={COLORS.primary} />
                <Text style={styles.scheduleButtonText}>Xem lịch thanh toán chi tiết</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Payment Schedule Modal */}
      {showPaymentSchedule && paymentSchedule && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lịch thanh toán chi tiết</Text>
          <View style={styles.scheduleSummary}>
            <Text style={styles.scheduleSummaryText}>
              Đã trả: {paymentSchedule.summary.paidMonths}/{paymentSchedule.paymentInfo.installmentMonths} tháng
            </Text>
            <Text style={styles.scheduleSummaryText}>
              Còn lại: {formatPrice(paymentSchedule.summary.remainingDebt, 'VND')}
            </Text>
          </View>
          
          {paymentSchedule.schedule.map((item: any, index: number) => (
            <View key={index} style={styles.scheduleItem}>
              <View style={styles.scheduleMonth}>
                <Text style={styles.scheduleMonthText}>Tháng {item.month}</Text>
                <View style={[
                  styles.scheduleStatus,
                  { backgroundColor: getScheduleStatusColor(item.status) + '20' }
                ]}>
                  <Text style={[
                    styles.scheduleStatusText,
                    { color: getScheduleStatusColor(item.status) }
                  ]}>
                    {getScheduleStatusText(item.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.scheduleDetails}>
                <Text style={styles.scheduleDate}>
                  Hạn: {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                </Text>
                <Text style={styles.scheduleAmount}>
                  {formatPrice(item.amount, 'VND')}
                </Text>
              </View>
              {item.paidDate && (
                <Text style={styles.paidDate}>
                  ✓ Đã thanh toán: {new Date(item.paidDate).toLocaleDateString('vi-VN')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Dealer Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin đại lý</Text>
        <View style={styles.dealerInfo}>
          <DetailRow icon="business" label="Tên đại lý" value={dealer.name} />
          <DetailRow icon="location" label="Địa chỉ" value={`${dealer.address}, ${dealer.city}`} />
          <DetailRow icon="call" label="Hotline" value={dealer.phone} />
          {dealer.email && <DetailRow icon="mail" label="Email" value={dealer.email} />}
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

// Helper Components
const DetailRow = ({ icon, label, value }: any) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={16} color={COLORS.textSecondary} />
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const SummaryRow = ({ label, value, isDiscount, isTotal }: any) => (
  <View style={styles.summaryRow}>
    <Text style={[styles.summaryLabel, isTotal && styles.totalLabel]}>{label}</Text>
    <Text style={[
      styles.summaryValue,
      isDiscount && styles.discountValue,
      isTotal && styles.totalValue
    ]}>
      {value}
    </Text>
  </View>
);

const DebtRow = ({ icon, label, value, color, isHighlight }: any) => (
  <View style={styles.debtRow}>
    <Ionicons name={icon} size={20} color={color || COLORS.text} />
    <View style={styles.debtRowContent}>
      <Text style={styles.debtLabel}>{label}</Text>
      <Text style={[
        styles.debtValue,
        color && { color },
        isHighlight && styles.highlightValue
      ]}>
        {value}
      </Text>
    </View>
  </View>
);

const getScheduleStatusColor = (status: string) => {
  switch (status) {
    case 'PAID': return COLORS.success;
    case 'OVERDUE': return COLORS.error;
    default: return COLORS.warning;
  }
};

const getScheduleStatusText = (status: string) => {
  switch (status) {
    case 'PAID': return 'Đã trả';
    case 'OVERDUE': return 'Quá hạn';
    default: return 'Chưa trả';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  statusCard: {
    padding: 16,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overdueCard: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  vehicleInfo: {
    gap: 8,
  },
  vehicleModel: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehicleVariant: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  vehicleDetails: {
    marginTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  paymentSummary: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  discountValue: {
    color: COLORS.success,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  installmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  installmentDetails: {
    flex: 1,
  },
  installmentLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  installmentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  debtSummary: {
    gap: 12,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debtRowContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  debtValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  nextPayment: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '10',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  nextPaymentInfo: {
    flex: 1,
  },
  nextPaymentLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  nextPaymentDate: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  nextPaymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scheduleSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scheduleSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  scheduleItem: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduleMonth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleMonthText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  scheduleStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scheduleStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  scheduleAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  paidDate: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
    fontStyle: 'italic',
  },
  dealerInfo: {
    gap: 12,
  },
  footer: {
    height: 32,
  },
});