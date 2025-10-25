import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { Search, RefreshCw, Filter } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { promotionApi } from "@/lib/api/promotionApi";
import { Promotion } from "@/lib/types/promotion.types";
import { PromotionCard } from "@/components/promotions";
import { styles } from "@/components/promotions";

export default function DealerPromotionsScreen() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filterActive, setFilterActive] = useState<boolean | undefined>(true); // Default: only active

    // Auth guard
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !user?.dealerId)) {
            router.replace("/(auth)/login");
        }
    }, [isAuthenticated, authLoading, user]);

    // Fetch promotions
    const fetchPromotions = async () => {
        if (!user?.dealerId) return;

        try {
            setError(null);
            const params: any = {
                dealerId: user.dealerId,
                isActive: filterActive,
                search: searchTerm,
            };

            const response = await promotionApi.getAll(params);
            const promotionsData = Array.isArray(response.data) ? response.data : [];
            setPromotions(promotionsData);
        } catch (err: any) {
            setError(err.response?.data?.message || "Không thể tải danh sách khuyến mãi");
            console.error("Error fetching promotions:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.dealerId) {
            fetchPromotions();
        }
    }, [user?.dealerId, filterActive, searchTerm]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPromotions();
    };

    if (authLoading || !user?.dealerId) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={{ backgroundColor: "#fff", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 12 }}>
                    Khuyến mãi
                </Text>

                {/* Search */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderRadius: 8, paddingHorizontal: 12 }}>
                        <Search size={18} color="#6b7280" />
                        <TextInput
                            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14 }}
                            placeholder="Tìm kiếm khuyến mãi..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFilters(!showFilters)}
                        style={{ backgroundColor: "#3b82f6", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" }}
                    >
                        <Filter size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Filters */}
                {showFilters && (
                    <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => setFilterActive(undefined)}
                            style={[
                                styles.filterChip,
                                filterActive === undefined && styles.filterChipActive,
                            ]}
                        >
                            <Text style={[styles.filterChipText, filterActive === undefined && styles.filterChipTextActive]}>
                                Tất cả
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setFilterActive(true)}
                            style={[
                                styles.filterChip,
                                filterActive === true && styles.filterChipActive,
                            ]}
                        >
                            <Text style={[styles.filterChipText, filterActive === true && styles.filterChipTextActive]}>
                                Đang hoạt động
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setFilterActive(false)}
                            style={[
                                styles.filterChip,
                                filterActive === false && styles.filterChipActive,
                            ]}
                        >
                            <Text style={[styles.filterChipText, filterActive === false && styles.filterChipTextActive]}>
                                Không hoạt động
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Error */}
            {error && (
                <View style={[styles.alertContainer, styles.alertError]}>
                    <Text style={[styles.alertText, styles.alertTextError]}>{error}</Text>
                </View>
            )}

            {/* List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : (
                <FlatList
                    data={promotions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <PromotionCard promotion={item} readOnly />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3b82f6"]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>Không có khuyến mãi nào</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
