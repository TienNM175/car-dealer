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
import { Package, Search, RefreshCw, Filter, Eye, Edit, Truck, X, AlertCircle, ChevronDown } from "lucide-react-native";
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(0);

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

    // Add state for dealers list
    const [dealers, setDealers] = useState<any[]>([]);
    const [showDealerPicker, setShowDealerPicker] = useState(false);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace("/(auth)/login");
        }
    }, [isAuthenticated, authLoading]);

    // Fetch dealers along with inventory
    const fetchInventory = async () => {
        try {
            setError(null);
            const [inventoryResponse, summaryResponse] = await Promise.all([
                inventoryApi.getEVMInventory(),
                inventoryApi.getInventorySummary()
            ]);
            setInventory(inventoryResponse.data.data);

            // Extract dealers from summary (excluding "Cà Mau")
            if (summaryResponse.data.data.byDealer) {
                const dealersList = summaryResponse.data.data.byDealer
                    .filter((d: any) => d.dealer.name !== "Cà Mau")
                    .map((d: any) => d.dealer);
                setDealers(dealersList);
            }
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

    // Reset to page 1 on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Update total pages when inventory or search changes
    useEffect(() => {
        const filtered = inventory.filter((item) =>
            item.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const pages = Math.ceil(filtered.length / itemsPerPage);
        setTotalPages(pages);
        if (currentPage > pages) {
            setCurrentPage(pages || 1);
        }
    }, [inventory, searchTerm, currentPage]);

    const handleRefresh = () => {
        setRefreshing(true);
        setCurrentPage(1);
        fetchInventory();
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const filteredInventory = inventory.filter((item) =>
        item.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedData = filteredInventory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const PaginationFooter = () => {
        if (totalPages <= 1) return null;

        return (
            <View style={styles.paginationContainer}>
                <TouchableOpacity
                    style={[
                        styles.paginationButton,
                        currentPage === 1 && styles.paginationButtonDisabled
                    ]}
                    onPress={handlePrevPage}
                    disabled={currentPage === 1}
                >
                    <Text style={[
                        styles.paginationButtonText,
                        currentPage === 1 && styles.paginationButtonTextDisabled
                    ]}>Trước</Text>
                </TouchableOpacity>

                <View style={styles.paginationInfo}>
                    <Text style={styles.paginationInfoText}>
                        Trang {currentPage} / {totalPages} ({filteredInventory.length} kết quả)
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.paginationButton,
                        currentPage === totalPages && styles.paginationButtonDisabled
                    ]}
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages}
                >
                    <Text style={[
                        styles.paginationButtonText,
                        currentPage === totalPages && styles.paginationButtonTextDisabled
                    ]}>Sau</Text>
                </TouchableOpacity>
            </View>
        );
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
            fromDealerId: "", // EVM doesn't have a dealer ID
            toDealerId: "",
            quantity: 1,
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
        // Validation
        if (!transferForm.toDealerId || transferForm.toDealerId === "") {
            Alert.alert("Lỗi", "Vui lòng chọn đại lý đích!");
            return;
        }
        if (transferForm.quantity <= 0) {
            Alert.alert("Lỗi", "Số lượng chuyển giao phải lớn hơn 0!");
            return;
        }
        // Kiểm tra số lượng khả dụng tại EVM
        const evmStock = selectedItem?.quantity || 0;
        if (transferForm.quantity > evmStock) {
            Alert.alert("Lỗi", `Số lượng chuyển giao vượt quá tồn kho EVM (${evmStock} xe)!`);
            return;
        }

        try {
            await inventoryApi.transferInventory(transferForm);
            setSuccess("Chuyển kho thành công!");
            setShowTransferModal(false);
            setTransferForm({
                vehicleId: "",
                fromDealerId: "",
                toDealerId: "",
                quantity: 0,
                notes: "",
            });
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

    const getSelectedDealerName = () => {
        if (!transferForm.toDealerId) return "Chọn đại lý";
        const dealer = dealers.find(d => d.id === transferForm.toDealerId);
        return dealer ? `${dealer.name} - ${dealer.city || ""}` : "Chọn đại lý";
    };

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
                <Text style={styles.headerSubtitle}>Tổng: {filteredInventory.length} xe</Text>
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
                    data={paginatedData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderInventoryCard}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3b82f6"]} />}
                    ListFooterComponent={<PaginationFooter />}
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
                            {/* From EVM Info */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Từ kho EVM</Text>
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoText}>
                                        EVM Inventory - {selectedItem?.quantity || 0} xe có sẵn
                                    </Text>
                                </View>
                            </View>

                            {/* To Dealer Select */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Đến đại lý</Text>
                                <TouchableOpacity
                                    style={styles.selectButton}
                                    onPress={() => setShowDealerPicker(true)}
                                >
                                    <Text style={[
                                        styles.selectButtonText,
                                        !transferForm.toDealerId && styles.selectButtonPlaceholder
                                    ]}>
                                        {getSelectedDealerName()}
                                    </Text>
                                    <ChevronDown size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            {/* Quantity Input */}
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
                                <Text style={styles.helperText}>
                                    Tối đa: {selectedItem?.quantity || 0} xe
                                </Text>
                            </View>

                            {/* Notes */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
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

            {/* Dealer Picker Modal */}
            <Modal visible={showDealerPicker} animationType="slide" transparent>
                <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Chọn đại lý</Text>
                            <TouchableOpacity onPress={() => setShowDealerPicker(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.pickerList}>
                            {dealers.map((dealer) => (
                                <TouchableOpacity
                                    key={dealer.id}
                                    style={[
                                        styles.pickerItem,
                                        transferForm.toDealerId === dealer.id && styles.pickerItemSelected
                                    ]}
                                    onPress={() => {
                                        setTransferForm({ ...transferForm, toDealerId: dealer.id });
                                        setShowDealerPicker(false);
                                    }}
                                >
                                    <View style={styles.pickerItemContent}>
                                        <Text style={[
                                            styles.pickerItemName,
                                            transferForm.toDealerId === dealer.id && styles.pickerItemTextSelected
                                        ]}>
                                            {dealer.name}
                                        </Text>
                                        <Text style={[
                                            styles.pickerItemCity,
                                            transferForm.toDealerId === dealer.id && styles.pickerItemTextSelected
                                        ]}>
                                            {dealer.city || "Không xác định"}
                                        </Text>
                                    </View>
                                    {transferForm.toDealerId === dealer.id && (
                                        <View style={styles.checkmark}>
                                            <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
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
    infoBox: {
        backgroundColor: "#f3f4f6",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 12,
    },
    infoText: {
        fontSize: 14,
        color: "#6b7280",
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        backgroundColor: "#fff",
        overflow: "hidden",
    },
    picker: {
        height: 50,
    },
    helperText: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 4,
    },
    // Select Button Styles
    selectButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: "#fff",
    },
    selectButtonText: {
        fontSize: 14,
        color: "#111827",
        flex: 1,
    },
    selectButtonPlaceholder: {
        color: "#9ca3af",
    },

    // Picker Modal Styles
    pickerModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    pickerModalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "70%",
    },
    pickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    pickerList: {
        paddingHorizontal: 20,
    },
    pickerItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    pickerItemSelected: {
        backgroundColor: "#eff6ff",
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    pickerItemContent: {
        flex: 1,
    },
    pickerItemName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111827",
        marginBottom: 4,
    },
    pickerItemCity: {
        fontSize: 14,
        color: "#6b7280",
    },
    pickerItemTextSelected: {
        color: "#3b82f6",
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#3b82f6",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 12,
    },
    checkmarkText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    // Detail Modal Styles
    detailSection: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    detailSectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#6b7280",
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "400",
        color: "#111827",
        flex: 2,
        textAlign: "right",
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    locationDetailText: {
        fontSize: 14,
        color: "#374151",
        flex: 1,
    },
    // Pagination Styles
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        marginTop: 12,
    },
    paginationButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: "#3b82f6",
    },
    paginationButtonDisabled: {
        backgroundColor: "#d1d5db",
    },
    paginationButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    paginationButtonTextDisabled: {
        color: "#9ca3af",
    },
    paginationInfo: {
        flex: 1,
        alignItems: "center",
    },
    paginationInfoText: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
    },
});