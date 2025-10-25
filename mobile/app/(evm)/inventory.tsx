// app/(evm)/inventory.tsx
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
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { Package, Search, RefreshCw, Filter, Eye, Edit, Truck, X, AlertCircle } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import inventoryApi, { EVMInventory, UpdateEVMInventoryInput, TransferInventoryInput } from "@/lib/api/inventoryApi";
import { StyleSheet } from "react-native";

export default function EVMInventoryScreen() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [inventory, setInventory] = useState<EVMInventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<EVMInventory | null>(null);

    // Forms
    const [editForm, setEditForm] = useState<UpdateEVMInventoryInput>({});
    const [transferForm, setTransferForm] = useState<TransferInventoryInput>({
        vehicleId: "",
        fromDealerId: "",
        toDealerId: "",
        quantity: 0,
        notes: "",
    });

    // Auth guard
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace("/(auth)/login");
        }
    }, [isAuthenticated, authLoading]);

    // Fetch inventory
    const fetchInventory = async () => {
        try {
            setError(null);
            const response = await inventoryApi.getEVMInventory();
            setInventory(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu tồn kho");
            console.error("Error fetching inventory:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchInventory();
        }
    }, [isAuthenticated]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchInventory();
    };

    const handleView = (item: EVMInventory) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    const handleEdit = (item: EVMInventory) => {
        setSelectedItem(item);
        setEditForm({
            quantity: item.quantity,
            reserved: item.reserved,
            location: item.location,
        });
        setShowEditModal(true);
    };

    const handleTransfer = (item: EVMInventory) => {
        setSelectedItem(item);
        setTransferForm({
            vehicleId: item.vehicleId,
            fromDealerId: "",
            toDealerId: "",
            quantity: 0,
            notes: "",
        });
        setShowTransferModal(true);
    };

    const submitEdit = async () => {
        if (!selectedItem) return;

        try {
            await inventoryApi.updateEVMInventory(selectedItem.vehicleId, editForm);
            setSuccess("Cập nhật tồn kho thành công!");
            setShowEditModal(false);
            fetchInventory();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            Alert.alert("Lỗi", err.response?.data?.message || "Không thể cập nhật tồn kho");
        }
    };

    const submitTransfer = async () => {
        if (!transferForm.fromDealerId || !transferForm.toDealerId || transferForm.quantity <= 0) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin chuyển kho");
            return;
        }

        try {
            await inventoryApi.transferInventory(transferForm);
            setSuccess("Chuyển kho thành công!");
            setShowTransferModal(false);
            fetchInventory();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            Alert.alert("Lỗi", err.response?.data?.message || "Không thể chuyển kho");
        }
    };

    const getStockStatus = (available: number) => {
        if (available > 100) return { label: "Dư thừa", color: "#10b981" };
        if (available > 50) return { label: "Bình thường", color: "#f59e0b" };
        return { label: "Thấp", color: "#ef4444" };
    };

    const filteredInventory = inventory.filter((item) =>
        item.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderInventoryCard = ({ item }: { item: EVMInventory }) => {
        const status = getStockStatus(item.available);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.vehicle.model}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Tổng</Text>
                        <Text style={styles.statValue}>{item.quantity}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Đã đặt</Text>
                        <Text style={styles.statValue}>{item.reserved}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Khả dụng</Text>
                        <Text style={styles.statValue}>{item.available}</Text>
                    </View>
                </View>

                {item.location && (
                    <Text style={styles.locationText}>📍 {item.location}</Text>
                )}

                <View style={styles.cardActions}>
                    <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => handleView(item)}>
                        <Eye size={16} color="#3b82f6" />
                        <Text style={[styles.actionButtonText, { color: "#3b82f6" }]}>Xem</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(item)}>
                        <Edit size={16} color="#10b981" />
                        <Text style={[styles.actionButtonText, { color: "#10b981" }]}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.transferButton]} onPress={() => handleTransfer(item)}>
                        <Truck size={16} color="#f59e0b" />
                        <Text style={[styles.actionButtonText, { color: "#f59e0b" }]}>Chuyển</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý Tồn kho EVM</Text>
                <Text style={styles.headerSubtitle}>Tổng: {inventory.length} xe</Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#6b7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm xe..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
                <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
                    <Filter size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Success/Error Messages */}
            {success && (
                <View style={styles.successMessage}>
                    <Text style={styles.successText}>{success}</Text>
                </View>
            )}
            {error && (
                <View style={styles.errorMessage}>
                    <Text style={styles.errorText}>{error}</Text>
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
                    data={filteredInventory}
                    keyExtractor={(item) => item.id}
                    renderItem={renderInventoryCard}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3b82f6"]} />}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>Không có dữ liệu tồn kho</Text>
                        </View>
                    }
                />
            )}

   {/* Detail Modal */}
            <Modal visible={showDetailModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chi tiết tồn kho</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {selectedItem && (
                                <>
                                    {/* Vehicle Info */}
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailSectionTitle}>Thông tin xe</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Model:</Text>
                                            <Text style={styles.detailValue}>{selectedItem.vehicle.model}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Nhà sản xuất:</Text>
                                            <Text style={styles.detailValue}>{selectedItem.vehicle.manufacturer.name}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Mã NSX:</Text>
                                            <Text style={styles.detailValue}>{selectedItem.vehicle.manufacturer.code}</Text>
                                        </View>
                                    </View>

                                    {/* Inventory Stats */}
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailSectionTitle}>Thống kê tồn kho</Text>
                                        <View style={styles.statsGrid}>
                                            <View style={[styles.statItem, { backgroundColor: "#3b82f620" }]}>
                                                <Text style={styles.statLabel}>Tổng số lượng</Text>
                                                <Text style={[styles.statValue, { color: "#3b82f6" }]}>{selectedItem.quantity}</Text>
                                            </View>
                                            <View style={[styles.statItem, { backgroundColor: "#f59e0b20" }]}>
                                                <Text style={styles.statLabel}>Đã đặt trước</Text>
                                                <Text style={[styles.statValue, { color: "#f59e0b" }]}>{selectedItem.reserved}</Text>
                                            </View>
                                            <View style={[styles.statItem, { backgroundColor: "#10b98120" }]}>
                                                <Text style={styles.statLabel}>Khả dụng</Text>
                                                <Text style={[styles.statValue, { color: "#10b981" }]}>{selectedItem.available}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Location */}
                                    {selectedItem.location && (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailSectionTitle}>Vị trí kho</Text>
                                            <View style={styles.locationContainer}>
                                                <Package size={20} color="#6b7280" />
                                                <Text style={styles.locationDetailText}>{selectedItem.location}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* Timestamps */}
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailSectionTitle}>Thông tin khác</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>ID:</Text>
                                            <Text style={[styles.detailValue, { fontSize: 12 }]}>{selectedItem.id}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Vehicle ID:</Text>
                                            <Text style={[styles.detailValue, { fontSize: 12 }]}>{selectedItem.vehicleId}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Ngày tạo:</Text>
                                            <Text style={styles.detailValue}>
                                                {new Date(selectedItem.createdAt).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Cập nhật:</Text>
                                            <Text style={styles.detailValue}>
                                                {new Date(selectedItem.updatedAt).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Vehicle Images */}
                                    {selectedItem.vehicle.images && selectedItem.vehicle.images.length > 0 && (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailSectionTitle}>Hình ảnh</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedItem.vehicle.images.length} ảnh
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.submitButton} onPress={() => setShowDetailModal(false)}>
                                <Text style={styles.submitButtonText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chỉnh sửa tồn kho</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Số lượng</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={editForm.quantity?.toString() || ""}
                                    onChangeText={(text) => setEditForm({ ...editForm, quantity: parseInt(text) || 0 })}
                                    placeholder="Nhập số lượng"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Đã đặt trước</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={editForm.reserved?.toString() || ""}
                                    onChangeText={(text) => setEditForm({ ...editForm, reserved: parseInt(text) || 0 })}
                                    placeholder="Nhập số lượng đã đặt"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Vị trí</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.location || ""}
                                    onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                                    placeholder="Nhập vị trí kho"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitButton} onPress={submitEdit}>
                                <Text style={styles.submitButtonText}>Cập nhật</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Transfer Modal */}
            <Modal visible={showTransferModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chuyển kho</Text>
                            <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>ID Đại lý nguồn</Text>
                                <TextInput
                                    style={styles.input}
                                    value={transferForm.fromDealerId}
                                    onChangeText={(text) => setTransferForm({ ...transferForm, fromDealerId: text })}
                                    placeholder="Nhập ID đại lý nguồn"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>ID Đại lý đích</Text>
                                <TextInput
                                    style={styles.input}
                                    value={transferForm.toDealerId}
                                    onChangeText={(text) => setTransferForm({ ...transferForm, toDealerId: text })}
                                    placeholder="Nhập ID đại lý đích"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Số lượng</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={transferForm.quantity.toString()}
                                    onChangeText={(text) => setTransferForm({ ...transferForm, quantity: parseInt(text) || 0 })}
                                    placeholder="Nhập số lượng"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Ghi chú</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    multiline
                                    numberOfLines={3}
                                    value={transferForm.notes}
                                    onChangeText={(text) => setTransferForm({ ...transferForm, notes: text })}
                                    placeholder="Nhập ghi chú"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowTransferModal(false)}>
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitButton} onPress={submitTransfer}>
                                <Text style={styles.submitButtonText}>Chuyển kho</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

          
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        backgroundColor: "#fff",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: "row",
        padding: 12,
        gap: 8,
        backgroundColor: "#fff",
    },
    searchBar: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    filterButton: {
        backgroundColor: "#3b82f6",
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: "center",
    },
    listContent: {
        padding: 12,
        paddingBottom: 24,
    },
    loadingText: {
        marginTop: 12,
        color: "#6b7280",
        fontSize: 14,
    },
    emptyText: {
        marginTop: 12,
        color: "#6b7280",
        fontSize: 16,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    cardTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        minWidth: "30%",
        backgroundColor: "#f9fafb",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    statLabel: {
        fontSize: 11,
        color: "#6b7280",
        marginBottom: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    locationText: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 12,
    },
    cardActions: {
        flexDirection: "row",
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    viewButton: {
        borderColor: "#3b82f6",
        backgroundColor: "#eff6ff",
    },
    editButton: {
        borderColor: "#10b981",
        backgroundColor: "#f0fdf4",
    },
    transferButton: {
        borderColor: "#f59e0b",
        backgroundColor: "#fffbeb",
    },
    actionButtonText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: "600",
    },
    successMessage: {
        backgroundColor: "#d1fae5",
        padding: 12,
        margin: 12,
        borderRadius: 8,
    },
    successText: {
        color: "#065f46",
        fontSize: 14,
    },
    errorMessage: {
        backgroundColor: "#fee2e2",
        padding: 12,
        margin: 12,
        borderRadius: 8,
    },
    errorText: {
        color: "#991b1b",
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 16,
        width: "90%",
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    modalBody: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: "#111827",
        backgroundColor: "#fff",
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    modalFooter: {
        flexDirection: "row",
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        backgroundColor: "#fff",
        alignItems: "center",
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6b7280",
    },
    submitButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#3b82f6",
        alignItems: "center",
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});
