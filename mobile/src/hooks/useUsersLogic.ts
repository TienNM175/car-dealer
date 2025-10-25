// mobile/src/hooks/useUsersLogic.ts
import { useState, useCallback, useEffect } from 'react';
import { usersApi, ListUsersParams } from '@/lib/api/users';
import { User, UserRole } from '@/lib/types/user';
import Toast from 'react-native-toast-message';

export function useUsersLogic(
  searchTerm: string,
  selectedRole: UserRole | '',
  selectedStatus: 'all' | 'active' | 'inactive',
  page: number
) {
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Loading state
  const [formLoading, setFormLoading] = useState(false);

  // Fetch users with filters and pagination
  const fetchUsers = useCallback(async () => {
    try {
      const params: ListUsersParams = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        isActive: selectedStatus === 'all' ? undefined : selectedStatus === 'active',
      };

      const response = await usersApi.list(params);
      const usersData = response.data.users || [];
      const pagination = response.data.pagination || {};

      setUsers(usersData);
      setTotal(pagination.total || usersData.length);
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error('Error fetching users:', err);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách users',
      });
      setUsers([]);
    }
  }, [searchTerm, selectedRole, selectedStatus, page]);

  // Auto fetch when filters/page changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // View user detail
  const handleViewDetail = useCallback(async (user: User) => {
    try {
      const res = await usersApi.getById(user.id);
      const userData = res.data;
      setSelectedUser(userData);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error fetching user detail:', err);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải chi tiết user',
      });
    }
  }, []);

  // Prepare user for editing
  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  }, []);

  // Toggle user active/inactive status
  const handleToggleStatus = useCallback(async (user: User) => {
    setFormLoading(true);
    try {
      await usersApi.toggleStatus(user.id, !user.isActive);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: `User đã được ${!user.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`,
      });
      await fetchUsers();
    } catch (err: any) {
      console.error('Error toggling status:', err);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: err.response?.data?.message || 'Không thể thay đổi trạng thái',
      });
    } finally {
      setFormLoading(false);
    }
  }, [fetchUsers]);

  // Delete user
  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;

    setFormLoading(true);
    try {
      await usersApi.delete(userToDelete.id);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'User đã được xóa thành công',
      });
      setUserToDelete(null);
      setShowDeleteModal(false);
      await fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: err.response?.data?.message || 'Không thể xóa user',
      });
    } finally {
      setFormLoading(false);
    }
  }, [userToDelete, fetchUsers]);

  // Open change password modal
  const handleOpenChangePassword = useCallback((user: User) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  }, []);

  // Open assign dealer modal
  const handleOpenAssignDealer = useCallback((user: User) => {
    setSelectedUser(user);
    setShowDealerModal(true);
  }, []);

  // Open delete confirmation modal
  const handleOpenDelete = useCallback((user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setShowDetailModal(false);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowPasswordModal(false);
    setShowDealerModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
    setUserToDelete(null);
  }, []);

  return {
    // ========== Data States ==========
    users,
    total,
    totalPages,
    selectedUser,
    userToDelete,

    // ========== Data Setters ==========
    setSelectedUser,
    setUserToDelete,

    // ========== Modal States ==========
    showDetailModal,
    setShowDetailModal,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    showPasswordModal,
    setShowPasswordModal,
    showDealerModal,
    setShowDealerModal,
    showDeleteModal,
    setShowDeleteModal,

    // ========== Loading State ==========
    formLoading,

    // ========== API Methods ==========
    fetchUsers,
    handleViewDetail,
    handleEditUser,
    handleToggleStatus,
    handleDeleteUser,
    handleOpenChangePassword,
    handleOpenAssignDealer,
    handleOpenDelete,

    // ========== Utility Methods ==========
    closeAllModals,
  };
}