// app/(evm)/dealers.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { dealerApi } from '@/lib/api/dealerApi';
import type { Dealer, Region, DealerFilters } from '@/lib/api/dealerApi';
import CreateDealerModal from '@/components/dealers/CreateDealerModal';
import EditDealerModal from '@/components/dealers/EditDealerModal';
import DealerStaffModal from '@/components/dealers/DealerStaffModal';
import DealerTargetsModal from '@/components/dealers/DealerTargetsModal';

// Định nghĩa lại interface để tránh conflict
interface DealersListResponse {
  success: boolean;
  data: Dealer[];
  message?: string;
  meta?: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
type DealersListResponseType = {
  success: boolean;
  data: Dealer[];
  message?: string;
  meta?: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export default function DealersScreen() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [showFilters, setShowFilters] = useState(false);
  const [showDealerDetail, setShowDealerDetail] = useState(false);
  const [showCreateDealer, setShowCreateDealer] = useState(false);
  const [showEditDealer, setShowEditDealer] = useState(false);
  const [showDealerStaff, setShowDealerStaff] = useState(false);
  const [showDealerTargets, setShowDealerTargets] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load dealers với debounce search
  const loadDealers = useCallback(async (isRefresh = false, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else if (!isRefresh) {
      setLoading(true);
    }

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      
      const filters: DealerFilters = {
        search: searchTerm || undefined,
        regionId: selectedRegion || undefined,
        isActive: selectedStatus === 'all' ? undefined : selectedStatus === 'active',
      };

      const pagination = { 
        page: currentPage, 
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      const apiResponse: DealersListResponseType = await dealerApi.getAllDealers(filters, pagination);
      
      if (apiResponse.success) {
        const dealersData = apiResponse.data || [];
        const meta = apiResponse.meta?.pagination;

        if (isLoadMore) {
          setDealers(prev => [...prev, ...dealersData]);
          setPage(currentPage);
        } else {
          setDealers(dealersData);
          setPage(1);
        }

        setTotalPages(meta?.totalPages || 1);
        setHasMore(currentPage < (meta?.totalPages || 1));
      } else {
        throw new Error(apiResponse.message || 'Failed to load dealers');
      }
    } catch (error: any) {
      console.error('Failed to load dealers:', error);
      Alert.alert('Error', error.message || 'Không thể tải danh sách đại lý');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [searchTerm, selectedRegion, selectedStatus, page]);

  // Load regions
  const loadRegions = async () => {
    try {
      const regionsResponse = await dealerApi.getAllRegions();
      if (regionsResponse.success) {
        setRegions(regionsResponse.data || []);
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadDealers();
    loadRegions();
  }, []);

  // Search với debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        loadDealers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedRegion, selectedStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDealers(true);
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadDealers(false, true);
    }
  }, [loadingMore, hasMore]);

  const handleDealerPress = (dealer: Dealer) => {
    setSelectedDealer(dealer);
    setShowDealerDetail(true);
  };

  const handleCreateDealer = () => {
    setShowCreateDealer(true);
  };

  const handleCreateDealerSuccess = (message?: string) => {
    setShowCreateDealer(false);
    loadDealers(); // Reload danh sách
    Alert.alert('Thành công', message || 'Đại lý đã được tạo thành công');
  };

  const getRegionName = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    return region?.name || 'Không xác định';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#10b981' : '#ef4444';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Hoạt động' : 'Ngừng hoạt động';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Render dealer item
  const renderDealerItem = ({ item }: { item: Dealer }) => (
    <TouchableOpacity 
      style={styles.dealerCard}
      onPress={() => handleDealerPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dealerIcon}>
          <MaterialIcons name="business" size={24} color="#3b82f6" />
        </View>
        <View style={styles.dealerInfo}>
          <Text style={styles.dealerName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.dealerCode}>Mã: {item.code}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.isActive) + '20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.isActive) }
          ]}>
            {getStatusText(item.isActive)}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {getRegionName(item.regionId)} {item.city && `• ${item.city}`}
          </Text>
        </View>
        
        {item.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}

        {item.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item._count?.users || 0}</Text>
          <Text style={styles.statLabel}>Nhân viên</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item._count?.inventories || 0}</Text>
          <Text style={styles.statLabel}>Tồn kho</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item._count?.dealerOrders || 0}</Text>
          <Text style={styles.statLabel}>Đơn hàng</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render footer for loading more
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="business" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>Không có đại lý nào</Text>
      <Text style={styles.emptyStateText}>
        Thử thay đổi bộ lọc hoặc thêm đại lý mới
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateDealer}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Thêm đại lý mới</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Quản lý Đại lý',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleCreateDealer}
              style={{
                marginRight: 8,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên, mã, thành phố..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(selectedRegion || selectedStatus !== 'all') && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersText}>Bộ lọc:</Text>
          {selectedRegion && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                KV: {regions.find(r => r.id === selectedRegion)?.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedRegion('')}>
                <Ionicons name="close" size={14} color="#6b7280" />
              </TouchableOpacity>
            </View>
          )}
          {selectedStatus !== 'all' && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {selectedStatus === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedStatus('all')}>
                <Ionicons name="close" size={14} color="#6b7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Dealers List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tải danh sách đại lý...</Text>
        </View>
      ) : (
        <FlatList
          data={dealers}
          renderItem={renderDealerItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={dealers.length === 0 ? styles.emptyList : styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        regions={regions}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Dealer Detail Modal */}
      <DealerDetailModal
        visible={showDealerDetail}
        dealer={selectedDealer}
        onClose={() => {
          setShowDealerDetail(false);
          setSelectedDealer(null);
        }}
        getRegionName={getRegionName}
        formatDate={formatDate}
        onEdit={() => {
          setShowDealerDetail(false);
          setShowEditDealer(true);
        }}
        onStaff={() => {
          setShowDealerDetail(false);
          setShowDealerStaff(true);
        }}
        onTargets={() => {
          setShowDealerDetail(false);
          setShowDealerTargets(true);
        }}
      />

      {/* Create Dealer Modal - SỬ DỤNG COMPONENT RIÊNG */}
      <CreateDealerModal
        visible={showCreateDealer}
        onClose={() => setShowCreateDealer(false)}
        onSuccess={handleCreateDealerSuccess}
        regions={regions}
      />

      {/* Edit Dealer Modal */}
      <EditDealerModal
        visible={showEditDealer}
        dealer={selectedDealer}
        onClose={() => {
          setShowEditDealer(false);
          setSelectedDealer(null);
        }}
        onSuccess={() => {
          setShowEditDealer(false);
          setSelectedDealer(null);
          loadDealers();
          Alert.alert('Thành công', 'Đại lý đã được cập nhật thành công');
        }}
        regions={regions}
      />

      {/* Dealer Staff Modal */}
      <DealerStaffModal
        visible={showDealerStaff}
        dealer={selectedDealer}
        onClose={() => {
          setShowDealerStaff(false);
          setSelectedDealer(null);
        }}
      />

      {/* Dealer Targets Modal */}
      <DealerTargetsModal
        visible={showDealerTargets}
        dealer={selectedDealer}
        onClose={() => {
          setShowDealerTargets(false);
          setSelectedDealer(null);
        }}
        onSuccess={(message) => {
          if (message) Alert.alert('Thành công', message);
        }}
      />
    </View>
  );
}

// Filter Modal Component
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  regions: Region[];
  selectedRegion: string;
  onRegionChange: (regionId: string) => void;
  selectedStatus: 'all' | 'active' | 'inactive';
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
}

function FilterModal({
  visible,
  onClose,
  regions,
  selectedRegion,
  onRegionChange,
  selectedStatus,
  onStatusChange,
}: FilterModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Bộ lọc</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Khu vực</Text>
            <View style={styles.regionList}>
              <TouchableOpacity
                style={[
                  styles.regionItem,
                  !selectedRegion && styles.regionItemSelected,
                ]}
                onPress={() => onRegionChange('')}
              >
                <Text style={[
                  styles.regionText,
                  !selectedRegion && styles.regionTextSelected,
                ]}>
                  Tất cả khu vực
                </Text>
              </TouchableOpacity>
              {regions.map(region => (
                <TouchableOpacity
                  key={region.id}
                  style={[
                    styles.regionItem,
                    selectedRegion === region.id && styles.regionItemSelected,
                  ]}
                  onPress={() => onRegionChange(region.id)}
                >
                  <Text style={[
                    styles.regionText,
                    selectedRegion === region.id && styles.regionTextSelected,
                  ]}>
                    {region.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Trạng thái</Text>
            <View style={styles.statusList}>
              {[
                { value: 'all' as const, label: 'Tất cả trạng thái' },
                { value: 'active' as const, label: 'Đang hoạt động' },
                { value: 'inactive' as const, label: 'Ngừng hoạt động' },
              ].map(status => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusItem,
                    selectedStatus === status.value && styles.statusItemSelected,
                  ]}
                  onPress={() => onStatusChange(status.value)}
                >
                  <Text style={[
                    styles.filterStatusText,
                    selectedStatus === status.value && styles.filterStatusTextSelected,
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={onClose}
          >
            <Text style={styles.applyButtonText}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Dealer Detail Modal Component
interface DealerDetailModalProps {
  visible: boolean;
  dealer: Dealer | null;
  onClose: () => void;
  getRegionName: (regionId: string) => string;
  formatDate: (dateString: string) => string;
  onEdit: () => void;
  onStaff: () => void;
  onTargets: () => void;
}

function DealerDetailModal({
  visible,
  dealer,
  onClose,
  getRegionName,
  formatDate,
  onEdit,
  onStaff,
  onTargets,
}: DealerDetailModalProps) {
  const [showActionMenu, setShowActionMenu] = useState(false);

  if (!dealer) return null;

  const handleDeleteDealer = async (dealerToDelete: Dealer) => {
  Alert.alert(
    'Xóa Đại Lý',
    `Bạn có chắc chắn muốn xóa đại lý "${dealerToDelete.name}"? Hành động này không thể hoàn tác.`,
    [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await dealerApi.deleteDealer(dealerToDelete.id);
            if (response.success) {
              Alert.alert('Thành công', 'Đại lý đã được xóa thành công');
              onClose(); // Đóng modal
              // Cần reload danh sách dealers - bạn có thể thêm callback prop cho việc này
            } else {
              throw new Error(response.message);
            }
          } catch (error: any) {
            console.error('Delete dealer error:', error);
            Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi xóa đại lý');
          }
        },
      },
    ]
  );
};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Chi tiết Đại lý</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowActionMenu(!showActionMenu)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Menu */}
        {showActionMenu && (
          <View style={styles.actionMenu}>
            <TouchableOpacity 
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                onEdit();
              }}
            >
              <Ionicons name="create-outline" size={20} color="#374151" />
              <Text style={styles.actionMenuText}>Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                onStaff();
              }}
            >
              <Ionicons name="people-outline" size={20} color="#374151" />
              <Text style={styles.actionMenuText}>Nhân viên</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                onTargets();
              }}
            >
              <Ionicons name="flag-outline" size={20} color="#374151" />
              <Text style={styles.actionMenuText}>Chỉ tiêu</Text>
            </TouchableOpacity>
                <TouchableOpacity 
                style={[styles.actionMenuItem, styles.deleteAction]}
                onPress={() => {
                    setShowActionMenu(false);
                    handleDeleteDealer(dealer); // Thêm hàm xóa thực tế
                }}
                >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={[styles.actionMenuText, styles.deleteText]}>Xóa</Text>
                </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.modalContent}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tên đại lý</Text>
                <Text style={styles.detailValue}>{dealer.name}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Mã đại lý</Text>
                <Text style={[styles.detailValue, styles.codeText]}>{dealer.code}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Trạng thái</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: dealer.isActive ? '#10b98120' : '#ef444420' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: dealer.isActive ? '#10b981' : '#ef4444' }
                  ]}>
                    {dealer.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Khu vực</Text>
                <Text style={styles.detailValue}>{getRegionName(dealer.regionId)}</Text>
              </View>
            </View>
          </View>

          {(dealer.phone || dealer.email || dealer.city || dealer.address) && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
              <View style={styles.contactList}>
                {dealer.phone && (
                  <View style={styles.contactItem}>
                    <Ionicons name="call-outline" size={20} color="#6b7280" />
                    <Text style={styles.contactText}>{dealer.phone}</Text>
                  </View>
                )}
                {dealer.email && (
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={20} color="#6b7280" />
                    <Text style={styles.contactText}>{dealer.email}</Text>
                  </View>
                )}
                {dealer.city && (
                  <View style={styles.contactItem}>
                    <Ionicons name="location-outline" size={20} color="#6b7280" />
                    <Text style={styles.contactText}>{dealer.city}</Text>
                  </View>
                )}
                {dealer.address && (
                  <View style={styles.contactItem}>
                    <Ionicons name="business-outline" size={20} color="#6b7280" />
                    <Text style={styles.contactText}>{dealer.address}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {dealer._count && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Thống kê</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <FontAwesome name="users" size={24} color="#3b82f6" />
                  <Text style={styles.statNumber}>{dealer._count.users || 0}</Text>
                  <Text style={styles.statLabel}>Nhân viên</Text>
                </View>
                <View style={styles.statCard}>
                  <MaterialIcons name="inventory" size={24} color="#10b981" />
                  <Text style={styles.statNumber}>{dealer._count.inventories || 0}</Text>
                  <Text style={styles.statLabel}>Tồn kho</Text>
                </View>
                <View style={styles.statCard}>
                  <MaterialIcons name="shopping-cart" size={24} color="#8b5cf6" />
                  <Text style={styles.statNumber}>{dealer._count.dealerOrders || 0}</Text>
                  <Text style={styles.statLabel}>Đơn hàng</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Thông tin hệ thống</Text>
            <View style={styles.systemInfo}>
              <View style={styles.systemItem}>
                <Text style={styles.systemLabel}>Ngày tạo</Text>
                <Text style={styles.systemValue}>{formatDate(dealer.createdAt)}</Text>
              </View>
              <View style={styles.systemItem}>
                <Text style={styles.systemLabel}>Cập nhật cuối</Text>
                <Text style={styles.systemValue}>{formatDate(dealer.updatedAt)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// XÓA HOÀN TOÀN PHẦN CreateDealerModal CŨ Ở ĐÂY
// Chỉ sử dụng component import từ '@/components/dealers/CreateDealerModal'

const styles = StyleSheet.create({
  // ... giữ nguyên tất cả các styles hiện có ...
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#374151',
  },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f9ff',
    gap: 8,
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  filterChipText: {
    fontSize: 12,
    color: '#0369a1',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
  },
  dealerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dealerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dealerInfo: {
    flex: 1,
  },
  dealerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  dealerCode: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    flex: 1,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  // Action Menu Styles
  actionMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    minWidth: 160,
  },
  actionMenuText: {
    fontSize: 16,
    color: '#374151',
  },
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  deleteText: {
    color: '#ef4444',
  },
  // Filter Modal Styles
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  regionList: {
    gap: 8,
  },
  regionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  regionItemSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  regionText: {
    fontSize: 16,
    color: '#374151',
  },
  regionTextSelected: {
    color: '#1d4ed8',
    fontWeight: '500',
  },
  statusList: {
    gap: 8,
  },
  statusItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusItemSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  filterStatusText: {
    fontSize: 16,
    color: '#374151',
  },
  filterStatusTextSelected: {
    color: '#1d4ed8',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Detail Modal Styles
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  detailGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  codeText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#1f2937',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  systemInfo: {
    gap: 8,
  },
  systemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  systemLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  systemValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
});