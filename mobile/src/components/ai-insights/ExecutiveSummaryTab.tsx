// mobile/src/components/ai-insights/ExecutiveSummaryTab.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExecutiveSummaryResponse } from '@/hooks/useAIInsightsLogic';

// Xóa bỏ Type ExecutivePeriodType

interface ExecutiveSummaryTabProps {
  data: ExecutiveSummaryResponse | null;
  onRefresh: () => void;
  loading: boolean;
  // Xóa bỏ activePeriod và onPeriodChange
}

export default function ExecutiveSummaryTab({
  data,
  // Xóa bỏ activePeriod, onPeriodChange khỏi destructuring
  onRefresh, // Giữ lại onRefresh để có thể dùng pull-to-refresh
  loading,
}: ExecutiveSummaryTabProps) {

  // Chỉ hiển thị nội dung nếu có data
  if (!data) {
    return null;
  }

  const { aiAnalysis, rawData } = data;

  return (
    <View style={styles3.container}>
      {/* AI Summary Card */}
      <View style={styles3.summaryCard}>
        <View style={styles3.summaryHeader}>
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={styles3.summaryTitle}>AI Tóm tắt</Text>
        </View>
        <Text style={styles3.summaryText}>
          {aiAnalysis?.executiveSummary}
        </Text>
      </View>

      {/* Key Metrics */}
      <View style={styles3.section}>
        <Text style={styles3.sectionTitle}>Các chỉ số chính</Text>
        <View style={styles3.metricsGrid}>
          <MetricCard
            icon="people-outline"
            label="Khách hàng mới"
            value={rawData?.metrics?.newLeads || 0}
            detail={aiAnalysis?.keyMetrics?.leadGeneration}
          />
          <MetricCard
            icon="calendar-outline"
            label="Lái thử"
            value={rawData?.metrics?.testDrives?.total || 0}
            detail={`${rawData?.metrics?.testDrives?.completed || 0} hoàn thành`}
          />
          <MetricCard
            icon="target-outline"
            label="Hợp đồng"
            value={rawData?.metrics?.sales?.total || 0}
            detail={aiAnalysis?.keyMetrics?.conversionRate}
          />
          <MetricCard
            icon="cash-outline"
            label="Doanh thu (tỷ)"
            value={((rawData?.metrics?.sales?.revenue || 0) / 1000000000).toFixed(1)}
            detail={aiAnalysis?.keyMetrics?.revenuePerformance}
          />
        </View>
      </View>

      {/* Highlights */}
      <View style={styles3.section}>
        <View style={styles3.subsectionHeader}>
          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
          <Text style={styles3.subsectionTitle}>Điểm nổi bật</Text>
        </View>
        {(aiAnalysis?.highlights || []).map((item, idx) => (
          <View key={idx} style={styles3.listItem}>
            <Text style={styles3.bulletGreen}>✓</Text>
            <Text style={styles3.itemText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Concerns */}
      <View style={styles3.section}>
        <View style={styles3.subsectionHeader}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles3.subsectionTitle}>Vấn đề cần lưu ý</Text>
        </View>
        {(aiAnalysis?.concerns || []).map((item, idx) => (
          <View key={idx} style={styles3.listItem}>
            <Text style={styles3.bulletRed}>⚠</Text>
            <Text style={styles3.itemText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Action Items */}
      <View style={styles3.section}>
        <Text style={styles3.sectionTitle}>Hành động ưu tiên</Text>
        {(aiAnalysis?.actionItems || []).map((item, idx) => (
          <View
            key={idx}
            style={[
              styles3.actionCard,
              {
                borderLeftColor:
                  item.priority === 'CAO' || item.priority === 'HIGH'
                    ? '#ef4444'
                    : item.priority === 'TRUNG BÌNH' || item.priority === 'MEDIUM'
                    ? '#f59e0b'
                    : '#3b82f6',
              },
            ]}
          >
            <View style={styles3.actionHeader}>
              <View
                style={[
                  styles3.priorityBadge,
                  {
                    backgroundColor:
                      item.priority === 'CAO' || item.priority === 'HIGH'
                        ? '#ef4444'
                        : item.priority === 'TRUNG BÌNH' || item.priority === 'MEDIUM'
                        ? '#f59e0b'
                        : '#3b82f6',
                  },
                ]}
              >
                <Text style={styles3.priorityText}>{item.priority}</Text>
              </View>
              <Text style={styles3.actionTitle}>{item.action}</Text>
            </View>
            <Text style={styles3.actionReason}>{item.reason}</Text>
            <Text style={styles3.actionImpact}>💡 {item.expectedImpact}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Xóa bỏ Component PeriodButton

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: any;
  label: string;
  value: any;
  detail?: string;
}) {
  return (
    <View style={styles3.metricCard}>
      <View style={styles3.metricTop}>
        <Ionicons name={icon} size={20} color="#2563eb" />
        <Text style={styles3.metricValue}>{value}</Text>
      </View>
      <Text style={styles3.metricLabel}>{label}</Text>
      {detail && <Text style={styles3.metricDetail}>{detail}</Text>}
    </View>
  );
}

const styles3 = StyleSheet.create({
  container: {
    padding: 0, // Đã xóa padding 12 để căn chỉnh với container cha
    paddingBottom: 24,
    // Note: Toàn bộ nội dung báo cáo sẽ được hiển thị ngay dưới period selector (đã có margin)
  },
  refreshBtn: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 12, // Thêm margin horizontal để căn chỉnh
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  summaryText: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
    marginHorizontal: 12, // Thêm margin horizontal để căn chỉnh
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  metricDetail: {
    fontSize: 11,
    color: '#9ca3af',
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bulletGreen: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bulletRed: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemText: {
    flex: 1,
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 16,
  },
  actionCard: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  actionTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionReason: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  actionImpact: {
    fontSize: 11,
    color: '#2563eb',
    fontStyle: 'italic',
  },
});