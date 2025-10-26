// app/(dealer)/_layout.tsx
import { Tabs } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DealerLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  const userRole = user?.role?.toUpperCase() || "DEALER_STAFF";
  const isManager = userRole === "DEALER_MANAGER";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: "#2563eb",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
      }}
    >
      {/* Tab 1: Dashboard - Tổng quan */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Tổng quan",
          headerTitle: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Vehicles - Danh mục xe */}
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Danh mục",
          headerTitle: "Danh mục xe",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 3: Contracts - Hợp đồng */}
      <Tabs.Screen
        name="contracts"
        options={{
          title: "Hợp đồng",
          headerTitle: "Danh sách hợp đồng",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 4: Customers - Khách hàng */}
      <Tabs.Screen
        name="customers"
        options={{
          title: "Khách hàng",
          headerTitle: "Danh sách khách hàng",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 5: More - Menu khác */}
      <Tabs.Screen
        name="more"
        options={{
          title: "Thêm",
          headerTitle: "Menu",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden screens - không hiển thị trên tab bar */}
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen name="appointments" options={{ href: null }} />
      <Tabs.Screen name="promotion" options={{ href: null }} />
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="test-drive" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
