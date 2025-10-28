// app/(evm)/more.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/shared/Header";

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
  roles: string[];
  badge?: string;
}

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const userRole = user?.role?.toUpperCase() || "EVM_STAFF";
  const isAdmin = userRole === "ADMIN";

  // Menu items tương ứng với web sidebar
  const menuItems: MenuItem[] = [
    {
      id: "inventory",
      title: "Tồn kho",
      icon: "cube-outline",
      route: "/(evm)/inventory",
      description: "Quản lý hàng tồn kho",
      roles: ["EVM_STAFF", "ADMIN"],
    },
    {
      id: "orders",
      title: "Đơn hàng",
      icon: "cart-outline",
      route: "/(evm)/orders",
      description: "Quản lý đơn hàng từ các đại lý",
      roles: ["EVM_STAFF", "ADMIN"],
    },
    {
      id: "dealers",
      title: "Quản lý đại lý",
      icon: "business-outline",
      route: "/(evm)/dealers",
      description: "Danh sách và thông tin đại lý",
      roles: ["ADMIN"],
    },
    {
      id: "users",
      title: "Quản lý Users",
      icon: "people-outline",
      route: "/(evm)/users",
      description: "Tài khoản và phân quyền",
      roles: ["ADMIN"],
    },
    {
      id: "promotions",
      title: "Khuyến mãi",
      icon: "pricetag-outline",
      route: "/(evm)/promotions",
      description: "Quản lý chương trình khuyến mãi",
      roles: ["EVM_STAFF", "ADMIN"],
    },
    {
      id: "pricing",
      title: "Giá & Chiết khấu",
      icon: "cash-outline",
      route: "/(evm)/pricing",
      description: "Quản lý giá và chính sách chiết khấu",
      roles: ["ADMIN"],
    },
    {
      id: "ai-insights",
      title: "AI Insights",
      icon: "sparkles-outline",
      route: "/(evm)/ai-insights",
      description: "Phân tích và dự báo AI",
      roles: ["ADMIN"],
      badge: "New",
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Header title="Menu" />

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#2563eb" />
          </View>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userRole}>{user?.role}</Text>
          {user?.dealer && (
            <View style={styles.dealerTag}>
              <Ionicons name="business" size={12} color="#2563eb" />
              <Text style={styles.dealerName}>{user.dealer.name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QUẢN LÝ</Text>
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
                  <View style={styles.badge}>
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

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CÀI ĐẶT</Text>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="#6b7280" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Thông báo</Text>
            <Text style={styles.menuDescription}>Cấu hình thông báo</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="settings-outline" size={24} color="#6b7280" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Cài đặt</Text>
            <Text style={styles.menuDescription}>Tùy chỉnh ứng dụng</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Trợ giúp</Text>
            <Text style={styles.menuDescription}>Hướng dẫn sử dụng</Text>
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
            <Text style={[styles.menuTitle, styles.logoutText]}>Đăng xuất</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>EVM System Mobile v1.0.0</Text>
        <Text style={styles.footerText}>© 2025 All rights reserved</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  userCard: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2563eb",
  },
  adminBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#2563eb",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 6,
  },
  dealerTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  dealerName: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
    marginLeft: 4,
  },
  section: {
    backgroundColor: "#fff",
    marginBottom: 12,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  logoutIcon: {
    backgroundColor: "#fee2e2",
  },
  menuContent: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  logoutText: {
    color: "#ef4444",
  },
  menuDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 3,
  },
  badge: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  footer: {
    padding: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
});
