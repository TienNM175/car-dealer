// app/(evm)/promotions.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
} from "react-native";
import {
    Tag,
    Plus,
    RefreshCw,
    Filter,
    AlertCircle,
    CheckCircle,
    X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { promotionApi } from "@/lib/api/promotionApi";
import { Promotion, CreatePromotionDTO, UpdatePromotionDTO } from "@/lib/types/promotion.types";
import { PromotionCard, PromotionFormModal, DeleteConfirmModal } from "@/components/promotions";
import { Picker } from '@react-native-picker/picker';

export default function PromotionsScreen() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // All state hooks MUST be at the top before any conditional returns
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
    const [filterDealerId, setFilterDealerId] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Tab state
    const [activeTab, setActiveTab] = useState<"list" | "statistics">("list");
    const [statistics, setStatistics] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);


    const fetchPromotions = async () => {
        try {
            setLoading(true);
            setError(null);

            const params: any = {};
            if (filterActive !== undefined) params.isActive = filterActive;
            if (searchTerm) params.search = searchTerm;
            if (filterDealerId) params.dealerId = filterDealerId;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (sortBy) params.sortBy = sortBy;
            if (sortOrder) params.sortOrder = sortOrder;

            const response = await promotionApi.getAll(params);
            const promotionsData = Array.isArray(response.data) ? response.data : [];
            setPromotions(promotionsData);
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            } else {
                setError(err.response?.data?.message || "Không thể tải danh sách khuyến mãi");
            }
            console.error("Error fetching promotions:", err);
        } finally {
            setLoading(false);
        }
    };

   const fetchStatistics = async () => {
        try {
            setLoadingStats(true);
            const data = await promotionApi.getStatistics();
            setStatistics(data);
        } catch (err: any) {
            console.error("Error fetching statistics:", err);
            setError("Failed to load statistics");
        } finally {
            setLoadingStats(false);
        }
    };

    // Auth guard
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, authLoading]);


    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPromotions();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filterActive, searchTerm, filterDealerId, startDate, endDate, sortBy, sortOrder]);

    useEffect(() => {
        if (activeTab === "statistics") {
            fetchStatistics();
        }
    }, [activeTab]);

 

    const handleCreateOrUpdate = async (data: CreatePromotionDTO | UpdatePromotionDTO) => {
        try {
            setError(null);
            if (editingPromotion) {
                await promotionApi.update(editingPromotion.id, data as UpdatePromotionDTO);
                setSuccess("Cập nhật khuyến mãi thành công!");
            } else {
                await promotionApi.create(data as CreatePromotionDTO);
                setSuccess("Tạo khuyến mãi thành công!");
            }
            setShowFormModal(false);
            setEditingPromotion(null);
            fetchPromotions();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingPromotion) return;

        try {
            setError(null);
            await promotionApi.delete(deletingPromotion.id);
            setSuccess("Xóa khuyến mãi thành công!");
            setShowDeleteModal(false);
            setDeletingPromotion(null);
            fetchPromotions();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Không thể xóa khuyến mãi");
            setShowDeleteModal(false);
            setDeletingPromotion(null);
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            setError(null);
            await promotionApi.toggleStatus(id);
            setSuccess("Cập nhật trạng thái thành công!");
            fetchPromotions();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Không thể thay đổi trạng thái");
        }
    };

    const openCreateModal = () => {
        setEditingPromotion(null);
        setShowFormModal(true);
    };

    const openEditModal = (promotion: Promotion) => {
        setEditingPromotion(promotion);
        setShowFormModal(true);
    };

    const openDeleteModal = (promotion: Promotion) => {
        setDeletingPromotion(promotion);
        setShowDeleteModal(true);
    };

    const dealers = useMemo(() => {
        const uniqueDealers = new Map<string, { id: string; name: string }>();
        promotions.forEach((p) => {
            if (p.dealer && !uniqueDealers.has(p.dealerId)) {
                uniqueDealers.set(p.dealerId, { id: p.dealerId, name: p.dealer.name });
            }
        });
        return Array.from(uniqueDealers.values());
    }, [promotions]);

    const formatVND = (v: number) =>
        v.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        });

    const getRankBadgeColor = (index: number) => {
        if (index === 0) return styles.gold;
        if (index === 1) return styles.silver;
        if (index === 2) return styles.bronze;
        return styles.blueBadge;
    };



    if (loading && promotions.length === 0 || authLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>Quản lý Khuyến mãi</Text>
                <Text style={styles.headerSubtitle}>Tạo và quản lý các chương trình khuyến mãi</Text>
            </View>
            <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
                <Plus size={20} color="white" />
                <Text style={styles.createButtonText}>Tạo mới</Text>
            </TouchableOpacity>
        </View>
    );

    const renderTabButtons = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === "list" && styles.activeTabButton]}
                onPress={() => setActiveTab("list")}
            >
                <Tag size={20} color={activeTab === "list" ? "white" : "#6B7280"} />
                <Text style={[styles.tabText, activeTab === "list" && styles.activeTabText]}>
                    Danh sách khuyến mãi
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === "statistics" && styles.activeTabButton]}
                onPress={() => setActiveTab("statistics")}
            >
                <Tag size={20} color={activeTab === "statistics" ? "white" : "#6B7280"} />
                <Text style={[styles.tabText, activeTab === "statistics" && styles.activeTabText]}>
                    Thống kê
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderMessages = () => (
        <>
            {success && (
                <View style={styles.successMessage}>
                    <CheckCircle size={20} color="#059669" />
                    <Text style={styles.successText}>{success}</Text>
                </View>
            )}
            {error && (
                <View style={styles.errorMessage}>
                    <View style={styles.errorContent}>
                        <AlertCircle size={20} color="#DC2626" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => setError(null)}>
                            <X size={20} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </>
    );

    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            <View style={styles.filtersHeader}>
                <Filter size={20} color="#3B82F6" />
                <Text style={styles.filtersTitle}>Bộ lọc & Tìm kiếm</Text>
            </View>

            <View style={styles.filterSection}>
                <TextInput
                    style={styles.input}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholder="Nhập tên hoặc mô tả khuyến mãi..."
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            <View style={styles.filterRow}>
                <Text style={styles.labelSmall}>Đại lý:</Text>
                <View style={styles.selectContainer}>
                    <Picker
                        selectedValue={filterDealerId}
                        onValueChange={(value) => setFilterDealerId(value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Tất cả đại lý" value="" />
                        {dealers.map((d) => (
                            <Picker.Item key={d.id} label={d.name} value={d.id} />
                        ))}
                    </Picker>
                </View>
            </View>

            <View style={styles.filterRow}>
                <Text style={styles.labelSmall}>Trạng thái:</Text>
                <View style={styles.selectContainer}>
                    <Picker
                        selectedValue={filterActive === undefined ? "all" : filterActive ? "active" : "inactive"}
                        onValueChange={(value) => {
                            if (value === "all") setFilterActive(undefined);
                            else setFilterActive(value === "active");
                        }}
                        style={styles.picker}
                    >
                        <Picker.Item label="Tất cả" value="all" />
                        <Picker.Item label="Đang hoạt động" value="active" />
                        <Picker.Item label="Không hoạt động" value="inactive" />
                    </Picker>
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.refreshButton} onPress={fetchPromotions}>
                    <RefreshCw size={16} color="white" />
                    <Text style={styles.refreshText}>Làm mới</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                        setSearchTerm("");
                        setFilterActive(undefined);
                        setFilterDealerId("");
                        setStartDate("");
                        setEndDate("");
                        setSortBy("");
                        setSortOrder("asc");
                    }}
                >
                    <X size={16} color="#6B7280" />
                    <Text style={styles.clearText}>Xóa bộ lọc</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStatisticsContent = () => (
        <>
            {loadingStats ? (
                <View style={styles.loadingStatsContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải thống kê...</Text>
                </View>
            ) : statistics ? (
                <>
                    <View style={styles.summaryCards}>
                        <View style={styles.summaryCardBlue}>
                            <View style={styles.summaryHeader}>
                                <Text style={styles.summaryLabel}>Tổng khuyến mãi</Text>
                            </View>
                            <Text style={styles.summaryValue}>{statistics.total || 0}</Text>
                        </View>
                        <View style={styles.summaryCardGreen}>
                            <View style={styles.summaryHeader}>
                                <Text style={styles.summaryLabel}>Đang hoạt động</Text>
                            </View>
                            <Text style={styles.summaryValue}>{statistics.active || 0}</Text>
                        </View>
                    </View>

                    {statistics.topDealers && statistics.topDealers.length > 0 && (
                        <View style={styles.topDealersCard}>
                            <Text style={styles.sectionTitle}>Top đại lý</Text>
                            <View style={styles.dealersList}>
                                {statistics.topDealers.map((dealer: any, index: number) => (
                                    <View key={dealer.dealerId} style={styles.dealerRow}>
                                        <View style={styles.rankContainer}>
                                            <View style={[styles.rankBadge, getRankBadgeColor(index)]}>
                                                <Text style={styles.rankText}>{index + 1}</Text>
                                            </View>
                                            <Text style={styles.dealerName}>{dealer.dealerName}</Text>
                                        </View>
                                        <Text style={styles.dealerCount}>{dealer.count} khuyến mãi</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.noDataContainer}>
                    <AlertCircle size={48} color="#9CA3AF" />
                    <Text style={styles.noDataText}>Không có dữ liệu thống kê</Text>
                </View>
            )}
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            {activeTab === "list" ? (
                <FlatList
                    data={promotions}
                    renderItem={({ item }) => (
                        <PromotionCard
                            promotion={item}
                            onToggle={handleToggleStatus}
                            onEdit={openEditModal}
                            onDelete={()=> openDeleteModal(item)}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    style={styles.flatList}
                    contentContainerStyle={styles.flatListContent}
                    ListHeaderComponent={
                        <View>
                            {renderHeader()}
                            {renderTabButtons()}
                            {renderMessages()}
                            {renderFilters()}
                            <View style={styles.listHeader}>
                                <Tag size={20} color="#3B82F6" />
                                <Text style={styles.listTitle}>Danh sách khuyến mãi ({promotions.length})</Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không có khuyến mãi nào</Text>
                        </View>
                    }
                />
            ) : (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {renderHeader()}
                    {renderTabButtons()}
                    {renderMessages()}
                    <View style={styles.statisticsScroll}>
                        {renderStatisticsContent()}
                    </View>
                </ScrollView>
            )}

            <PromotionFormModal
                visible={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingPromotion(null);
                }}
                onSubmit={handleCreateOrUpdate}
                promotion={editingPromotion}
                dealers={dealers}
            />

            <DeleteConfirmModal
                visible={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeletingPromotion(null);
                }}
                onConfirm={handleDeleteConfirm}
                promotionName={deletingPromotion?.name || ""}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollView: {
        flex: 1,
    },
    flatList: {
        flex: 1,
    },
    flatListContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#6B7280",
    },
    header: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12,
        margin: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6B7280",
    },
    createButton: {
        backgroundColor: "#2563EB",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    createButtonText: {
        color: "white",
        fontWeight: "600",
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "white",
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        gap: 8,
        backgroundColor: "transparent",
    },
    activeTabButton: {
        backgroundColor: "#2563EB",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    activeTabText: {
        color: "white",
    },
    successMessage: {
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginHorizontal: 16,
        borderRadius: 8,
        gap: 8,
        marginBottom: 16,
    },
    successText: {
        color: "#166534",
        fontWeight: "500",
    },
    errorMessage: {
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        padding: 12,
        marginHorizontal: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    errorText: {
        color: "#DC2626",
        fontWeight: "500",
        flex: 1,
    },
    filtersContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    filtersHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        backgroundColor: "#EFF6FF",
        gap: 8,
    },
    filtersTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    filterSection: {
        padding: 20,
    },
    input: {
        borderWidth: 2,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight: "500",
        color: "#111827",
        backgroundColor: "white",
    },
    filterRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        gap: 12,
    },
    labelSmall: {
        fontSize: 12,
        fontWeight: "600",
        color: "#374151",
        minWidth: 80,
    },
    selectContainer: {
        flex: 1,
    },
    picker: {
        borderWidth: 2,
        borderColor: "#E5E7EB",
        borderRadius: 8,
    },
    actionRow: {
        flexDirection: "row",
        gap: 8,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    refreshButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#2563EB",
        paddingVertical: 12,
        borderRadius: 8,
    },
    refreshText: {
        color: "white",
        fontWeight: "600",
    },
    clearButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#F9FAFB",
        borderWidth: 2,
        borderColor: "#E5E7EB",
        paddingVertical: 12,
        borderRadius: 8,
    },
    clearText: {
        color: "#6B7280",
        fontWeight: "600",
    },
    listHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        backgroundColor: "white",
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        gap: 8,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: "center",
    },
    emptyText: {
        color: "#6B7280",
        fontSize: 16,
    },
    statisticsScroll: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    loadingStatsContainer: {
        alignItems: "center",
        paddingVertical: 48,
    },
    summaryCards: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 20,
    },
    summaryCardBlue: {
        backgroundColor: "#3B82F6",
        padding: 20,
        borderRadius: 12,
        flexBasis: "48%",
        alignItems: "center",
    },
    summaryCardGreen: {
        backgroundColor: "#10B981",
        padding: 20,
        borderRadius: 12,
        flexBasis: "48%",
        alignItems: "center",
    },
    summaryHeader: {
        width: "100%",
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: "rgba(255,255,255,0.9)",
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        marginVertical: 4,
    },
    topDealersCard: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 16,
    },
    dealersList: {
        gap: 8,
    },
    dealerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
    },
    rankContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    gold: {
        backgroundColor: "#F59E0B",
    },
    silver: {
        backgroundColor: "#9CA3AF",
    },
    bronze: {
        backgroundColor: "#EA580C",
    },
    blueBadge: {
        backgroundColor: "#3B82F6",
    },
    rankText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
    dealerName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    dealerCount: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#2563EB",
    },
    noDataContainer: {
        alignItems: "center",
        paddingVertical: 48,
    },
    noDataText: {
        color: "#6B7280",
        fontSize: 16,
        marginTop: 8,
    },
});
