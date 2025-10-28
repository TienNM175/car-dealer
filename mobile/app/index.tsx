import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/(auth)/login");
    } else {
      const role = user.role?.toUpperCase();

      // RouteGuard logic based on frontend
      if (role === "ADMIN" || role === "EVM_STAFF") {
        router.replace("/(evm)/products");
      } else if (role === "DEALER_MANAGER") {
        // DEALER_MANAGER can access both, default to dealer
        router.replace("/(dealer)/vehicles");
      } else if (role === "DEALER_STAFF") {
        router.replace("/(dealer)/vehicles");
      } else {
        // Fallback
        router.replace("/(dealer)/vehicles");
      }
    }
  }, [isLoading, user]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
