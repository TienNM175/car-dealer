// app/(evm)/_layout.tsx
import { Tabs } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function EVMLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/(auth)/login");
      return;
    }

    // RouteGuard logic: Dealer users cannot access EVM routes (except DEALER_MANAGER)
    if (user?.role) {
      const role = user.role.toUpperCase();
      const isDealerStaff = role === "DEALER_STAFF";

      if (isDealerStaff) {
        router.replace("/(dealer)/vehicles");
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

  const userRole = user?.role?.toUpperCase() || "EVM_STAFF";
  const isAdmin = userRole === "ADMIN";
  const isEVMStaff = userRole === "EVM_STAFF";
  const isDealerManager = userRole === "DEALER_MANAGER";

  // 5 tabs cố định cho tất cả roles

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
      {/* Tab 1: Products - Sản phẩm */}
      <Tabs.Screen
        name="products"
        options={{
          title: "Sản phẩm",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Inventory - Kho */}
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

      {/* Tab 3: Orders - Đơn hàng */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Đơn hàng",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 4: Reports - Báo cáo */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "Báo cáo",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
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
      <Tabs.Screen name="users" options={{ href: null }} />
      <Tabs.Screen name="dealers" options={{ href: null }} />
      <Tabs.Screen name="promotions" options={{ href: null }} />
      <Tabs.Screen name="pricing" options={{ href: null }} />
      <Tabs.Screen name="ai-insights" options={{ href: null }} />
      <Tabs.Screen name="contracts" options={{ href: null }} />
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
