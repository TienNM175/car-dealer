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
      return;
    }

    // RouteGuard logic: EVM users cannot access dealer routes
    if (user?.role) {
      const role = user.role.toUpperCase();
      const isEVMUser = role === "ADMIN" || role.startsWith("EVM");

      if (isEVMUser) {
        router.replace("/(evm)/products");
        return;
      }
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
  const isStaff = userRole === "DEALER_STAFF";

  // Role-based access control for dealer tabs
  const canAccessReports = isManager; // Only DEALER_MANAGER can see reports

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
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
      {/* Tab 1: Vehicles - Danh mục xe (DEALER_STAFF, DEALER_MANAGER) */}
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Xe",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Contracts - Hợp đồng (DEALER_STAFF, DEALER_MANAGER) */}
      <Tabs.Screen
        name="contracts"
        options={{
          title: "Hợp đồng",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 3: Customers - Khách hàng (DEALER_STAFF, DEALER_MANAGER) */}
      <Tabs.Screen
        name="customers"
        options={{
          title: "Khách hàng",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 4: Inventory - Kho (DEALER_STAFF, DEALER_MANAGER) */}
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Kho",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 5: More - Menu */}
      <Tabs.Screen
        name="more"
        options={{
          title: "Menu",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden screens - không hiển thị trên tab bar */}
      <Tabs.Screen name="contract-create" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen name="appointments" options={{ href: null }} />
      <Tabs.Screen name="promotion" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="test-drive" options={{ href: null }} />
      <Tabs.Screen name="quotations" options={{ href: null }} />
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
