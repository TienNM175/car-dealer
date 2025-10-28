import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/shared/Header";

interface ReportItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
  roles: string[];
}

export default function EVMReportsScreen() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || "EVM_STAFF";
  const isAdmin = userRole === "ADMIN";

  const reportItems: ReportItem[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "bar-chart-outline",
      route: "/(evm)/dashboard",
      description: "Tổng quan hệ thống",
      roles: ["EVM_STAFF", "ADMIN"],
    },
    {
      id: "sales",
      title: "Báo cáo bán hàng",
      icon: "trending-up-outline",
      route: "/(evm)/sales-report",
      description: "Thống kê doanh số",
      roles: ["EVM_STAFF", "ADMIN"],
    },
    {
      id: "customers",
      title: "Phân tích khách hàng",
      icon: "people-outline",
      route: "/(evm)/customer-analysis",
      description: "Báo cáo khách hàng",
      roles: ["EVM_STAFF", "ADMIN"],
    },
    {
      id: "inventory",
      title: "Báo cáo tồn kho",
      icon: "cube-outline",
      route: "/(evm)/inventory-report",
      description: "Thống kê tồn kho",
      roles: ["EVM_STAFF", "ADMIN"],
    },
    {
      id: "executive-summary",
      title: "Tóm tắt điều hành",
      icon: "document-text-outline",
      route: "/(evm)/executive-summary",
      description: "Báo cáo cấp cao",
      roles: ["ADMIN"],
    },
    {
      id: "dealer-performance",
      title: "Hiệu suất đại lý",
      icon: "business-outline",
      route: "/(evm)/dealer-performance",
      description: "So sánh đại lý",
      roles: ["ADMIN"],
    },
    {
      id: "market-trends",
      title: "Xu hướng thị trường",
      icon: "analytics-outline",
      route: "/(evm)/market-trends",
      description: "Phân tích thị trường",
      roles: ["ADMIN"],
    },
  ];

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  const filteredItems = reportItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <ScrollView style={styles.container}>
      <Header title="Báo cáo & Thống kê" />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>BÁO CÁO</Text>

        {filteredItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.reportItem}
            onPress={() => handlePress(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.reportIconContainer}>
              <Ionicons name={item.icon} size={24} color="#2563eb" />
            </View>

            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>{item.title}</Text>
              <Text style={styles.reportDescription}>{item.description}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
});
