// app/(evm)/_layout.tsx
import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EVMLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  const userRole = user?.role?.toUpperCase() || 'EVM_STAFF';
  const isAdmin = userRole === 'ADMIN';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: { 
          backgroundColor: '#2563eb',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: { 
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      {/* Tab 1: Dashboard - Tổng quan */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tổng quan',
          headerTitle: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Products - Sản phẩm */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Sản phẩm',
          headerTitle: 'Quản lý Sản phẩm',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 3: Orders - Đơn hàng */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          headerTitle: 'Quản lý Đơn hàng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 4: Reports - Báo cáo (nếu là EVM_STAFF hoặc ADMIN) */}
      {(userRole === 'EVM_STAFF' || isAdmin) && (
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Báo cáo',
            headerTitle: 'Báo cáo & Phân tích',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Tab 5: More - Menu khác */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'Thêm',
          headerTitle: 'Menu',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden screens - không hiển thị trên tab bar */}
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="dealers" options={{ href: null }} />
      <Tabs.Screen name="users" options={{ href: null }} />
      <Tabs.Screen name="promotions" options={{ href: null }} />
      <Tabs.Screen name="pricing" options={{ href: null }} />
      <Tabs.Screen name="ai-insights" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});