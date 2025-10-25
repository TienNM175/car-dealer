import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  RefreshCw,
  Filter,
  Search as SearchIcon,
  AlertCircle,
  CheckCircle,
  LogIn,
  X,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { promotionApi } from "@/lib/api/promotionApi";
import { Promotion, UpdatePromotionDTO } from "@/lib/types/promotion.types";
import { StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get("window");

export default function PromotionsScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Auth guard: Redirect nếu chưa login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, authLoading]);

  // Nếu auth loading, show spinner
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang kiểm tra xác thực...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null; // Empty view, vì useEffect sẽ redirect
  }

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
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPromotionId, setDeletingPromotionId] = useState<string | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<{
    dealerId: string;
    name: string;
    description: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minPurchase: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>({
    dealerId: "",
    name: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minPurchase: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    isActive: true,
  });

  // Hàm format số thành VND (1.000.000) cho input
  const formatVNDInput = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    return Number(numbers).toLocaleString("vi-VN");
  };

  // Hàm unformat để lấy number từ string VND
  const unformatVND = (value: string): number => {
    return Number(value.replace(/\./g, "")) || 0;
  };

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
        setError("Bạn cần đăng nhập để quản lý khuyến mãi. Vui lòng đăng nhập lại.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch promotions");
      }
      console.error("Error fetching promotions:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreate = async () => {
    try {
      setError(null);
      const submitData = {
        ...formData,
        minPurchase: unformatVND(formData.minPurchase),
      };
      await promotionApi.create(submitData);
      setSuccess("Promotion created successfully!");
      setShowModal(false);
      resetForm();
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create promotion");
    }
  };

  const handleUpdate = async () => {
    if (!editingPromotion) return;

    try {
      setError(null);
      const updateData: UpdatePromotionDTO = {
        ...formData,
        minPurchase: unformatVND(formData.minPurchase),
      };
      await promotionApi.update(editingPromotion.id, updateData);
      setSuccess("Promotion updated successfully!");
      setShowModal(false);
      resetForm();
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update promotion");
    }
  };

  const openDeleteModal = (id: string) => {
    setDeletingPromotionId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingPromotionId) return;

    try {
      setError(null);
      await promotionApi.delete(deletingPromotionId);
      setSuccess("Khuyến mãi đã được xóa thành công!");
      setShowDeleteModal(false);
      setDeletingPromotionId(null);
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete promotion");
      setShowDeleteModal(false);
      setDeletingPromotionId(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setError(null);
      await promotionApi.toggleStatus(id);
      setSuccess("Promotion status updated!");
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to toggle status");
    }
  };

 const openCreateModal = () => {
  console.log("Mở modal tạo khuyến mãi");
  resetForm();
  setEditingPromotion(null);
  setShowModal(true);
};

  const openEditModal = (promotion: Promotion) => {
    const startDateStr =
      typeof promotion.startDate === "string"
        ? promotion.startDate.split("T")[0]
        : new Date(promotion.startDate).toISOString().split("T")[0];

    let endDateStr: string;
    if (!promotion.endDate) {
      endDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    } else if (typeof promotion.endDate === "string") {
      endDateStr = promotion.endDate.split("T")[0];
    } else {
      endDateStr = new Date(promotion.endDate).toISOString().split("T")[0];
    }

    setEditingPromotion(promotion);
    setFormData({
      dealerId: promotion.dealerId,
      name: promotion.name,
      description: promotion.description || "",
      discountType: promotion.discountType,
      discountValue: Number(promotion.discountValue),
      minPurchase: promotion.minPurchase ? Number(promotion.minPurchase).toLocaleString("vi-VN") : "",
      startDate: startDateStr,
      endDate: endDateStr,
      isActive: promotion.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      dealerId: "",
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      minPurchase: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isActive: true,
    });
    setEditingPromotion(null);
  };

  const formatVND = (v: number) =>
    v.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "N/A";
    const dateString = typeof dateValue === "string" ? dateValue : dateValue.toISOString();
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return styles.gold;
    if (index === 1) return styles.silver;
    if (index === 2) return styles.bronze;
    return styles.blueBadge;
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

  const filteredPromotions = promotions;

  if (loading && promotions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Helper: Render tab buttons (tránh duplicate)
  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      {renderTabButton("list", "Danh sách khuyến mãi", <Tag size={20} color={activeTab === "list" ? "white" : "#6B7280"} />)}
      {renderTabButton("statistics", "Thống kê", <Tag size={20} color={activeTab === "statistics" ? "white" : "#6B7280"} />)}
    </View>
  );

  const renderTabButton = (tab: "list" | "statistics", label: string, icon: React.ReactNode) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton,
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <View style={styles.tabIconContainer}>{icon}</View>
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPromotionRow = ({ item }: { item: Promotion }) => (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Text style={styles.boldText}>{item.name || "N/A"}</Text>
        <Text style={styles.grayText}>{item.description || ""}</Text>
        {item.dealer && (
          <Text style={styles.blueText}>Đại lý: {item.dealer?.name || "N/A"}</Text>
        )}
      </View>
      <View style={styles.cell}>
        <View
          style={[
            styles.badge,
            item.discountType === "PERCENTAGE" ? styles.purpleBadge : styles.greenBadge,
          ]}
        >
          <Text 
            style={[
              styles.badgeText, 
              item.discountType === "PERCENTAGE" ? {color: "#7C3AED"} : {color: "#059669"}
            ]}
          >
            {item.discountType}
          </Text>
        </View>
        <Text style={styles.boldText}>
          {item.discountType === "PERCENTAGE"
            ? `${item.discountValue}%`
            : formatVND(Number(item.discountValue))}
        </Text>
        {item.minPurchase && (
          <Text style={styles.grayText}>Min: {formatVND(Number(item.minPurchase))}</Text>
        )}
      </View>
      <View style={styles.cell}>
        <View style={styles.dateRow}>
          <Calendar size={12} color="#374151" />
          <Text style={styles.grayText}>{formatDate(item.startDate)}</Text>
        </View>
        <Text style={styles.grayText}>đến {formatDate(item.endDate)}</Text>
      </View>
      <View style={styles.cell}>
        <TouchableOpacity onPress={() => handleToggleStatus(item.id)} style={styles.statusButton}>
          {item.isActive ? (
            <View style={styles.activeStatus}>
              <ToggleRight size={16} color="#059669" />
              <Text style={styles.activeStatusText}>Hoạt động</Text>
            </View>
          ) : (
            <View style={styles.inactiveStatus}>
              <ToggleLeft size={16} color="#6B7280" />
              <Text style={styles.inactiveStatusText}>Tạm dừng</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.actionCell}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={styles.actionButton}
        >
          <Edit size={16} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openDeleteModal(item.id)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Trash2 size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Quản lý Khuyến mãi</Text>
        <Text style={styles.headerSubtitle}>Tạo và quản lý các chương trình khuyến mãi</Text>
      </View>
      <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
        <Plus size={20} color="white" />
        <Text style={styles.createButtonText}>Tạo khuyến mãi mới</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filtersHeader}>
        <Filter size={20} color="#3B82F6" />
        <Text style={styles.filtersTitle}>Bộ lọc & Tìm kiếm</Text>
      </View>
      <View style={styles.filterSection}>
        <View style={styles.labelRow}>
          <SearchIcon size={16} color="#3B82F6" />
          <Text style={styles.label}>Tìm kiếm nhanh</Text>
        </View>
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Nhập tên hoặc mô tả khuyến mãi..."
        />
      </View>
      {/* Dealer Filter */}
      <View style={styles.filterRow}>
        <View style={styles.labelRowSmall}>
          <Filter size={14} color="#A855F7" />
          <Text style={styles.labelSmall}>Đại lý</Text>
        </View>
        <View style={styles.selectContainer}>
          <TouchableOpacity style={styles.selectInput} onPress={() => {/* Implement Picker modal */}}>
            <Text style={styles.selectInputText}>
              {filterDealerId ? dealers.find(d => d.id === filterDealerId)?.name || "Tất cả đại lý" : "Tất cả đại lý"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Status Filter */}
      <View style={styles.filterRow}>
        <View style={styles.labelRowSmall}>
          <ToggleRight size={14} color="#059669" />
          <Text style={styles.labelSmall}>Trạng thái</Text>
        </View>
        <View style={styles.selectContainer}>
          <TouchableOpacity style={styles.selectInput} onPress={() => {/* Implement Picker */}}>
            <Text style={styles.selectInputText}>
              {filterActive === undefined ? "Tất cả" : filterActive ? "Đang hoạt động" : "Đã tạm dừng"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Start Date */}
      <View style={styles.filterRow}>
        <View style={styles.labelRowSmall}>
          <Calendar size={14} color="#3B82F6" />
          <Text style={styles.labelSmall}>Từ ngày</Text>
        </View>
        <TouchableOpacity style={styles.dateInput} onPress={() => {/* Implement Date Picker */}}>
          <Text style={styles.dateInputText}>{startDate || "Chọn ngày"}</Text>
        </TouchableOpacity>
      </View>
      {/* End Date */}
      <View style={styles.filterRow}>
        <View style={styles.labelRowSmall}>
          <Calendar size={14} color="#3B82F6" />
          <Text style={styles.labelSmall}>Đến ngày</Text>
        </View>
        <TouchableOpacity style={styles.dateInput} onPress={() => {/* Implement Date Picker */}}>
          <Text style={styles.dateInputText}>{endDate || "Chọn ngày"}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sortRow}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Sắp xếp theo</Text>
        </View>
        <View style={styles.sortContainer}>
          <TouchableOpacity style={styles.sortInput} onPress={() => {/* Picker */}}>
            <Text style={styles.sortInputText}>{sortBy || "Mặc định"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortDirectionButton,
              sortOrder === "asc" ? styles.ascButton : styles.descButton,
            ]}
            onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <Text style={styles.sortArrow}>{sortOrder === "asc" ? "↑" : "↓"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchPromotions}>
          <RefreshCw size={16} color="#3B82F6" />
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setSearchTerm("");
            setFilterDealerId("");
            setFilterActive(undefined);
            setStartDate("");
            setEndDate("");
            setSortBy("");
            setSortOrder("asc");
          }}
        >
          <X size={16} color="#6B7280" />
          <Text style={styles.clearText}>Xóa lọc</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ✅ Updated: Remove inner ScrollView, return only content (for outer ScrollView in statistics tab)
  const renderStatisticsContent = () => (
    <>
      {loadingStats ? (
        <View style={styles.loadingStatsContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải thống kê...</Text>
        </View>
      ) : statistics ? (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryCards}>
            <View style={styles.summaryCardBlue}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>Tổng số</Text>
                <Tag size={20} color="rgba(255,255,255,0.75)" />
              </View>
              <Text style={styles.summaryValue}>{statistics.total || 0}</Text>
              <Text style={styles.summarySubtext}>Khuyến mãi</Text>
            </View>

            <View style={styles.summaryCardGreen}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>Đang hoạt động</Text>
                <ToggleRight size={20} color="rgba(255,255,255,0.75)" />
              </View>
              <Text style={styles.summaryValue}>{statistics.active || 0}</Text>
              <Text style={styles.summarySubtext}>Chương trình</Text>
            </View>

            <View style={styles.summaryCardYellow}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>Sắp hết hạn</Text>
                <AlertCircle size={20} color="rgba(255,255,255,0.75)" />
              </View>
              <Text style={styles.summaryValue}>
                {Array.isArray(statistics.expiringSoon) ? statistics.expiringSoon.length : 0}
              </Text>
              <Text style={styles.summarySubtext}>Trong 7 ngày</Text>
            </View>

            <View style={styles.summaryCardGray}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>Đã hết hạn</Text>
                <ToggleLeft size={20} color="rgba(255,255,255,0.75)" />
              </View>
              <Text style={styles.summaryValue}>{statistics.expired || 0}</Text>
              <Text style={styles.summarySubtext}>Chương trình</Text>
            </View>
          </View>

          {/* Discount Type Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>Phân loại giảm giá</Text>
            <View style={styles.breakdownRow}>
              <View style={styles.purpleBreakdown}>
                <Text style={styles.purpleLabel}>Phần trăm (%)</Text>
                <Text style={styles.purpleValue}>{statistics.byType?.PERCENTAGE?.count || 0}</Text>
              </View>

              <View style={styles.greenBreakdown}>
                <Text style={styles.greenLabel}>Số tiền cố định</Text>
                <Text style={styles.greenValue}>{statistics.byType?.FIXED?.count || 0}</Text>
              </View>
            </View>
          </View>

          {/* Top Dealers */}
          {statistics.topDealers && statistics.topDealers.length > 0 && (
            <View style={styles.topDealersCard}>
              <Text style={styles.sectionTitle}>Top đại lý có nhiều khuyến mãi</Text>
              <View style={styles.dealersList}>
                {statistics.topDealers.slice(0, 5).map((dealer: any, index: number) => (
                  <View key={dealer.dealerId} style={styles.dealerRow}>
                    <View style={styles.rankContainer}>
                      <View style={[styles.rankBadge, getRankBadgeColor(index)]}>
                        <Text style={styles.rankText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.dealerName}>{dealer.dealerName || "N/A"}</Text>
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

  const renderCreateEditModal = () => (
    <Modal visible={showModal} animationType="fade" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined} 
          style={styles.modalContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView 
            style={styles.modalScroll} 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Tag size={24} color="white" />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  {editingPromotion ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi mới"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingPromotion
                    ? "Cập nhật thông tin chương trình khuyến mãi"
                    : "Thêm chương trình khuyến mãi cho đại lý"}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={styles.modalCloseButton}
              >
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {/* Basic Information Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLineBlue} />
                  <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
                </View>

                <TextInput
                  style={styles.formInput}
                  placeholder="VD: Giảm giá cuối năm, Ưu đãi mùa hè..."
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />

                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  placeholder="Nhập mô tả chi tiết về chương trình khuyến mãi..."
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                />
              </View>

              {/* Discount Details Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLinePurple} />
                  <Text style={styles.sectionTitle}>Chi tiết giảm giá</Text>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <View style={styles.labelRow}>
                      <Text style={styles.formLabel}>Loại giảm giá *</Text>
                    </View>
                    <TouchableOpacity style={styles.selectInput} onPress={() => {/* Picker */}}>
                      <Text style={styles.selectInputText}>
                        {formData.discountType === "PERCENTAGE" ? "Phần trăm (%)" : "Số tiền cố định (VND)"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formField}>
                    <View style={styles.labelRow}>
                      <Text style={styles.formLabel}>Giá trị giảm *</Text>
                    </View>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={formData.discountValue.toString()}
                      onChangeText={(text) => setFormData({ ...formData, discountValue: Number(text) || 0 })}
                      placeholder={formData.discountType === "PERCENTAGE" ? "VD: 10" : "VD: 5000000"}
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <View style={styles.labelRow}>
                    <Text style={styles.formLabel}>Đơn hàng tối thiểu (VND)</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={formData.minPurchase}
                    onChangeText={(text) => {
                      const formatted = formatVNDInput(text);
                      setFormData({ ...formData, minPurchase: formatted });
                    }}
                    placeholder="VD: 100.000.000"
                  />
                  <Text style={styles.formHelperText}>
                    Giá trị đơn hàng tối thiểu để áp dụng khuyến mãi (định dạng VND)
                  </Text>
                </View>
              </View>

              {/* Dealer & Period Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLineGreen} />
                  <Text style={styles.sectionTitle}>Đại lý & Thời gian</Text>
                </View>

                <View style={styles.formField}>
                  <View style={styles.labelRow}>
                    <Text style={styles.formLabel}>Chọn đại lý *</Text>
                  </View>
                  <TouchableOpacity style={styles.selectInput} onPress={() => {/* Picker */}}>
                    <Text style={styles.selectInputText}>
                      {dealers.find(d => d.id === formData.dealerId)?.name || "-- Chọn đại lý --"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <View style={styles.labelRow}>
                      <Text style={styles.formLabel}>Ngày bắt đầu *</Text>
                    </View>
                    <TouchableOpacity style={styles.dateInput} onPress={() => {/* Date Picker */}}>
                      <Text style={styles.dateInputText}>{formData.startDate}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formField}>
                    <View style={styles.labelRow}>
                      <Text style={styles.formLabel}>Ngày kết thúc *</Text>
                    </View>
                    <TouchableOpacity style={styles.dateInput} onPress={() => {/* Date Picker */}}>
                      <Text style={styles.dateInputText}>{formData.endDate}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Status Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLineAmber} />
                  <Text style={styles.sectionTitle}>Trạng thái</Text>
                </View>

                <View style={styles.switchContainer}>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                    trackColor={{ false: "#F3F4F6", true: "#DBEAFE" }}
                    thumbColor={formData.isActive ? "#3B82F6" : "#F3F4F6"}
                  />
                  <View>
                    <Text style={styles.switchLabel}>Kích hoạt ngay</Text>
                    <Text style={styles.switchHelper}>Khuyến mãi sẽ có hiệu lực ngay sau khi tạo</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={editingPromotion ? handleUpdate : handleCreate}
              >
                <Text style={styles.submitText}>{editingPromotion ? "Cập nhật" : "Tạo mới"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  const renderDeleteModal = () => (
    <Modal visible={showDeleteModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModalContainer}>
          {/* Modal Header */}
          <View style={styles.deleteModalHeader}>
            <View style={styles.modalIconContainerRed}>
              <AlertCircle size={24} color="white" />
            </View>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitleRed}>Xác nhận xóa</Text>
              <Text style={styles.modalSubtitleRed}>Hành động này không thể hoàn tác</Text>
            </View>
          </View>

          {/* Modal Body */}
          <View style={styles.deleteWarning}>
            <Text style={styles.warningText}>Bạn có chắc chắn muốn xóa khuyến mãi này không?</Text>
            <Text style={styles.warningSubtext}>Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowDeleteModal(false);
                setDeletingPromotionId(null);
              }}
            >
              <Text style={styles.cancelText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButtonModal} onPress={handleDelete}>
              <Text style={styles.deleteText}>Xóa ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ✅ Messages helper (tránh duplicate)
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
            {error.includes("đăng nhập") && (
              <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/(auth)/login")}>
                <LogIn size={16} color="white" />
                <Text style={styles.loginText}>Đăng nhập</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {activeTab === "list" ? (
        // ✅ Tab "list": Use FlatList with ListHeaderComponent (no nesting)
        <FlatList
          data={filteredPromotions}
          renderItem={renderPromotionRow}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={[styles.flatList, { flex: 1 }]} // Ensure flex:1
          ListHeaderComponent={
            <View>
              {renderHeader()}
              {renderTabButtons()}
              {renderMessages()}
              {renderFilters()}
              <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                  <View style={styles.listHeaderLeft}>
                    <Tag size={20} color="#3B82F6" />
                    <Text style={styles.listTitle}>Danh sách khuyến mãi ({filteredPromotions.length})</Text>
                  </View>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { marginTop: 20 }]}>
              <Text style={styles.emptyText}>Không có khuyến mãi nào</Text>
            </View>
          }
        />
      ) : (
        // ✅ Tab "statistics": Use ScrollView (no inner ScrollView)
        <ScrollView style={[styles.scrollView, { flex: 1 }]} showsVerticalScrollIndicator={false}>
          {renderHeader()}
          {renderTabButtons()}
          {renderMessages()}
          {renderStatisticsContent()}
        </ScrollView>
      )}
      {renderCreateEditModal()}
      {renderDeleteModal()}
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
    paddingVertical: 16,
    gap: 8,
    backgroundColor: "transparent",
  },
  activeTabButton: {
    backgroundColor: "#2563EB",
  },
  tabIconContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
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
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    color: "#DC2626",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  loginText: {
    color: "white",
    fontWeight: "500",
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
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
  labelRowSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 80,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  selectContainer: {
    flex: 1,
  },
  selectInput: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  selectInputText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  dateInput: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
    flex: 1,
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  sortRow: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sortContainer: {
    flexDirection: "row",
    gap: 8,
  },
  sortInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
    justifyContent: "center",
  },
  sortInputText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  sortDirectionButton: {
    borderWidth: 2,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  ascButton: {
    borderColor: "#BFDBFE",
    backgroundColor: "#DBEAFE",
  },
  descButton: {
    borderColor: "#E9D5FF",
    backgroundColor: "#F3E8FF",
  },
  sortArrow: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6B7280",
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
  listContainer: {
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
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  listHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
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
  flatList: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cell: {
    flex: 1,
    justifyContent: "center",
  },
  boldText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  grayText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  blueText: {
    fontSize: 12,
    color: "#2563EB",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  purpleBadge: {
    backgroundColor: "#F3E8FF",
  },
  greenBadge: {
    backgroundColor: "#D1FAE5",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  statusButton: {
    padding: 4,
  },
  activeStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: "#D1FAE5",
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  inactiveStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: "#F3F4F6",
  },
  inactiveStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  actionCell: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
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
  summaryCardYellow: {
    backgroundColor: "#F59E0B",
    padding: 20,
    borderRadius: 12,
    flexBasis: "48%",
    alignItems: "center",
  },
  summaryCardGray: {
    backgroundColor: "#6B7280",
    padding: 20,
    borderRadius: 12,
    flexBasis: "48%",
    alignItems: "center",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  summarySubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  breakdownCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
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
  breakdownRow: {
    flexDirection: "row",
    gap: 16,
  },
  purpleBreakdown: {
    backgroundColor: "#FAF5FF",
    borderWidth: 2,
    borderColor: "#E9D5FF",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    alignItems: "center",
  },
  purpleLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7C3AED",
  },
  purpleValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#581C87",
    marginTop: 4,
  },
  greenBreakdown: {
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    alignItems: "center",
  },
  greenLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#047857",
  },
  greenValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#065F46",
    marginTop: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    maxHeight: "90%",
  },
  modalScroll: {
    flex: 1,
  },
  modalHeader: {
    backgroundColor: "#2563EB",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    flex: 1,
  },
  formSection: {
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionLineBlue: {
    width: 4,
    height: 20,
    backgroundColor: "#2563EB",
    borderRadius: 2,
  },
  sectionLinePurple: {
    width: 4,
    height: 20,
    backgroundColor: "#7C3AED",
    borderRadius: 2,
  },
  sectionLineGreen: {
    width: 4,
    height: 20,
    backgroundColor: "#10B981",
    borderRadius: 2,
  },
  sectionLineAmber: {
    width: 4,
    height: 20,
    backgroundColor: "#F59E0B",
    borderRadius: 2,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
  },
  formField: {
    flex: 1,
    gap: 4,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    backgroundColor: "white",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  formHelperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  switchHelper: {
    fontSize: 14,
    color: "#6B7280",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: "#F3F4F6",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  deleteModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 300,
  },
  deleteModalHeader: {
    backgroundColor: "#DC2626",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIconContainerRed: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitleRed: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  modalSubtitleRed: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  deleteWarning: {
    backgroundColor: "#FEF2F2",
    borderWidth: 2,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: "center",
  },
  warningText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    textAlign: "center",
  },
  warningSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  deleteButtonModal: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
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
});