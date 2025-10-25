import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function DealerDashboard() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const stats = [
    { title: 'Xe có sẵn', value: '23', icon: '🚗', color: '#3b82f6' },
    { title: 'Khách hàng', value: '156', icon: '👥', color: '#10b981' },
    { title: 'Doanh số tháng', value: '3.2 tỷ', icon: '💰', color: '#8b5cf6' },
    { title: 'Hợp đồng mới', value: '12', icon: '📄', color: '#f59e0b' },
  ];

  const activities = [
    { id: 1, title: 'Đơn hàng mới #1001', time: '1 giờ trước' },
    { id: 2, title: 'Đơn hàng mới #1002', time: '2 giờ trước' },
    { id: 3, title: 'Đơn hàng mới #1003', time: '3 giờ trước' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào,</Text>
        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.dealerName}>{user?.dealer?.name}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[styles.statCard, { backgroundColor: stat.color }]}
          >
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* Target Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mục tiêu tháng này</Text>
        <View style={styles.targetCard}>
          <View style={styles.targetInfo}>
            <Text style={styles.targetText}>Đã đạt 65% mục tiêu doanh số</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '65%' }]} />
            </View>
          </View>
          <View style={styles.targetStats}>
            <Text style={styles.targetNumber}>13/20</Text>
            <Text style={styles.targetLabel}>xe đã bán</Text>
          </View>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
        {activities.map((activity) => (
          <TouchableOpacity key={activity.id} style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Text>🚗</Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    color: '#bfdbfe',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dealerName: {
    color: '#bfdbfe',
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  targetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInfo: {
    flex: 1,
  },
  targetText: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  targetStats: {
    alignItems: 'center',
    marginLeft: 16,
  },
  targetNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  targetLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
});