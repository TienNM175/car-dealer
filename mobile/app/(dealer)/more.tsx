// app/(dealer)/more.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
  roles: string[];
  badge?: string;
  badgeColor?: string;
}

export default function DealerMoreScreen() {
  const { user, logout } = useAuth();
  const userRole = user?.role?.toUpperCase() || 'DEALER_STAFF';
  const isManager = userRole === 'DEALER_MANAGER';

  // Menu items cho dealer
  const menuItems: MenuItem[] = [
    {
      id: 'contracts',
      title: 'Hợp đồng',
      icon: 'document-text-outline',
      route: '/(dealer)/contracts',
      description: 'Quản lý hợp đồng bán xe',
      roles: ['DEALER_STAFF', 'DEALER_MANAGER'],
    },
    {
      id: 'appointments',
      title: 'Lịch hẹn',
      icon: 'calendar-outline',
      route: '/(dealer)/appointments',
      description: 'Lịch hẹn xem xe & lái thử',
      roles: ['DEALER_STAFF', 'DEALER_MANAGER'],
      badge: '3',
      badgeColor: '#ef4444',
    },
    {
      id: 'promotions',
      title: 'Mã khuyến mãi',
      icon: 'pricetag-outline',
      route: '/(dealer)/promotions',
      description: 'Chương trình ưu đãi hiện có',
      roles: ['DEALER_STAFF', 'DEALER_MANAGER'],
    },
    {
      id: 'inventory',
      title: 'Quản lý kho',
      icon: 'cube-outline',
      route: '/(dealer)/inventory',
      description: 'Tồn kho xe tại đại lý',
      roles: ['DEALER_STAFF', 'DEALER_MANAGER'],
    },
    {
      id: 'reports',
      title: 'Báo cáo',
      icon: 'bar-chart-outline',
      route: '/(dealer)/reports',
      description: 'Thống kê và báo cáo doanh số',
      roles: ['DEALER_MANAGER'],
    },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#2563eb" />
          </View>
          {isManager && (
            <View style={styles.managerBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userRole}>
            {userRole === 'DEALER_MANAGER' ? 'Quản lý đại lý' : 'Nhân viên đại lý'}
          </Text>
          {user?.dealer && (
            <View style={styles.dealerTag}>
              <Ionicons name="business" size={12} color="#2563eb" />
              <Text style={styles.dealerName}>{user.dealer.name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Stats - chỉ hiện cho Manager */}
      {isManager && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cart" size={20} color="#2563eb" />
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Đơn hàng</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={20} color="#10b981" />
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Lịch hẹn</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="car-sport" size={20} color="#f59e0b" />
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>Xe tồn</Text>
          </View>
        </View>
      )}

      {/* Business Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NGHIỆP VỤ</Text>
        {filteredItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handlePress(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon} size={24} color="#2563eb" />
            </View>
            
            <View style={styles.menuContent}>
              <View style={styles.menuTitleRow}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.badge && (
                  <View style={[
                    styles.badge, 
                    { backgroundColor: item.badgeColor || '#2563eb' }
                  ]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HỖ TRỢ</Text>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#6b7280" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Liên hệ hỗ trợ</Text>
            <Text style={styles.menuDescription}>Chat với bộ phận CSKH</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="book-outline" size={24} color="#6b7280" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Hướng dẫn sử dụng</Text>
            <Text style={styles.menuDescription}>Tài liệu và video hướng dẫn</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Thông tin</Text>
            <Text style={styles.menuDescription}>Về ứng dụng và điều khoản</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CÀI ĐẶT</Text>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="#6b7280" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Thông báo</Text>
            <Text style={styles.menuDescription}>Cấu hình nhận thông báo</Text>
          </View>
          <View style={styles.switchContainer}>
            <View style={styles.switchOn}>
              <View style={styles.switchThumb} />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#6b7280" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Bảo mật</Text>
            <Text style={styles.menuDescription}>Đổi mật khẩu & bảo mật</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.lastMenuItem]} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconContainer, styles.logoutIcon]}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, styles.logoutText]}>
              Đăng xuất
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Đại lý EVM Mobile v1.0.0</Text>
        <Text style={styles.footerText}>© 2025 All rights reserved</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  userCard: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2563eb',
  },
  managerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563eb',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  dealerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dealerName: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoutIcon: {
    backgroundColor: '#fee2e2',
  },
  menuContent: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  logoutText: {
    color: '#ef4444',
  },
  menuDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 3,
  },
  badge: {
    backgroundColor: '#2563eb',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  switchContainer: {
    marginLeft: 'auto',
  },
  switchOn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    paddingHorizontal: 2,
    alignItems: 'flex-end',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
});