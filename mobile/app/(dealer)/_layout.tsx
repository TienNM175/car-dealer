import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function DealerLayout() {
  const { user, isLoading, logout } = useAuth();

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Xe',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🚗</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Khách hàng',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Hợp đồng',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📄</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    marginRight: 16,
    padding: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});