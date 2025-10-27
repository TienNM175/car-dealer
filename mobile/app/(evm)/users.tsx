// mobile/app/(evm)/users.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "react-native-toast-message";

import { UsersSearchFilterBar } from "@/components/users/UsersSearchFilterBar";
import UserCard from "@/components/users/UserCard";
import UserDetailModal from "@/components/users/UserDetailModal";
import CreateUserModal from "@/components/users/CreateUserModal";
import EditUserModal from "@/components/users/EditUserModal";
import ChangePasswordModal from "@/components/users/ChangePasswordModal";
import AssignDealerModal from "@/components/users/AssignDealerModal";
import { DeleteConfirmModal } from "@/components/users/UserModals";
import { User, UserRole } from "@/lib/types/user";
import { useUsersLogic } from "@/hooks/useUsersLogic";
import { styles } from "@/components/users/styles";

const ROLE_FILTERS: { label: string; value: UserRole | "" }[] = [
  { label: "Tất cả", value: "" },
  { label: "Admin", value: "ADMIN" },
  { label: "EVM Staff", value: "EVM_STAFF" },
  { label: "Dealer Manager", value: "DEALER_MANAGER" },
  { label: "Dealer Staff", value: "DEALER_STAFF" },
];

const STATUS_FILTERS: {
  label: string;
  value: "all" | "active" | "inactive";
}[] = [
  { label: "Tất cả", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function UsersScreen() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [page, setPage] = useState(1);

  const {
    users,
    total,
    totalPages,
    fetchUsers,
    selectedUser,
    setSelectedUser,
    userToDelete,
    setUserToDelete,
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
    formLoading,
    handleViewDetail,
    handleEditUser,
    handleDeleteUser,
    handleToggleStatus,
  } = useUsersLogic(searchTerm, selectedRole, selectedStatus, page);

  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    };
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers().then(() => setRefreshing(false));
  }, [fetchUsers]);

  const renderUserCard = ({ item }: { item: User }) => (
    <UserCard
      user={item}
      onViewDetail={() => {
        handleViewDetail(item);
        setShowDetailModal(true);
      }}
      onEdit={() => {
        handleEditUser(item);
        setShowEditModal(true);
      }}
      onChangePassword={() => {
        setSelectedUser(item);
        setShowPasswordModal(true);
      }}
      onAssignDealer={() => {
        setSelectedUser(item);
        setShowDealerModal(true);
      }}
      onToggleStatus={() => handleToggleStatus(item)}
      onDelete={() => {
        setUserToDelete(item);
        setShowDeleteModal(true);
      }}
      isAdmin={isAdmin}
    />
  );

  return (
    <View style={styles.container}>
      {/* Search + Filter gộp chuẩn 673 UI */}
      <UsersSearchFilterBar
        searchValue={searchTerm}
        onSearchChange={(text) => {
          setSearchTerm(text);
          setPage(1);
        }}
        selectedRole={selectedRole}
        onRoleChange={(role) => {
          setSelectedRole(role);
          setPage(1);
        }}
        roleFilters={ROLE_FILTERS}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không có user</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modals */}
      <UserDetailModal
        visible={showDetailModal}
        user={selectedUser}
        onClose={() => setShowDetailModal(false)}
      />

      <CreateUserModal
        visible={showCreateModal}
        loading={formLoading}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          setPage(1);
          fetchUsers();
          Toast.show({
            type: "success",
            text1: "Thành công",
            text2: "User đã được tạo",
          });
        }}
      />

      {selectedUser && (
        <EditUserModal
          visible={showEditModal}
          user={selectedUser}
          loading={formLoading}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
            Toast.show({
              type: "success",
              text1: "Thành công",
              text2: "User đã được cập nhật",
            });
          }}
        />
      )}

      {selectedUser && (
        <ChangePasswordModal
          visible={showPasswordModal}
          user={selectedUser}
          loading={formLoading}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
            Toast.show({
              type: "success",
              text1: "Thành công",
              text2: "Mật khẩu đã được đổi",
            });
          }}
        />
      )}

      {selectedUser && (
        <AssignDealerModal
          visible={showDealerModal}
          user={selectedUser}
          loading={formLoading}
          onClose={() => {
            setShowDealerModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowDealerModal(false);
            setSelectedUser(null);
            fetchUsers();
            Toast.show({
              type: "success",
              text1: "Thành công",
              text2: "User đã được gán dealer",
            });
          }}
        />
      )}

      <DeleteConfirmModal
        visible={showDeleteModal}
        user={userToDelete}
        loading={formLoading}
        onConfirm={() => {
          handleDeleteUser();
          setShowDeleteModal(false);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
}
