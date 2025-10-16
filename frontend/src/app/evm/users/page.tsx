"use client";

import React, { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Key,
  Building2,
  Shield,
  Eye,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { usersApi, ListUsersParams } from "@/lib/api/users";
import { User, UserRole } from "@/lib/types/user";
import { useAuth } from "@/contexts/AuthContext";
import CreateUserModal from "@/components/users/CreateUserModal";
import EditUserModal from "@/components/users/EditUserModal";
import ChangePasswordModal from "@/components/users/ChangePasswordModal";
import AssignDealerModal from "@/components/users/AssignDealerModal";
import UserDetailsModal from "@/components/users/UserDetailsModal";

// Confirmation Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning";
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "warning",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: "bg-red-100",
      icon: "text-red-600",
      button: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      bg: "bg-yellow-100",
      icon: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start space-x-4">
          <div
            className={`flex-shrink-0 w-12 h-12 ${colors[type].bg} rounded-full flex items-center justify-center`}
          >
            <AlertTriangle className={`w-6 h-6 ${colors[type].icon}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 ${colors[type].button} text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Success Toast Component
interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3">
        <CheckCircle className="w-5 h-5" />
        <span className="font-semibold">{message}</span>
        <button
          aria-label="Close"
          onClick={onClose}
          className="ml-2 hover:bg-green-700 rounded-lg p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning" as "danger" | "warning",
  });

  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
  });

  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    loadUsers();
  }, [page, selectedRole, selectedStatus]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: ListUsersParams = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        isActive:
          selectedStatus === "all" ? undefined : selectedStatus === "active",
      };

      const response = await usersApi.list(params);
      const usersData = response.data.users || [];
      const pagination = response.data.pagination || {};

      setUsers(usersData);
      setTotalPages(pagination.totalPages || 1);
      setTotal(pagination.total || usersData.length);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      setToast({
        isVisible: true,
        message: "Không thể tải danh sách users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const showToast = (message: string) => {
    setToast({ isVisible: true, message });
  };

  const handleToggleStatus = async (user: User) => {
    setConfirmModal({
      isOpen: true,
      title: user.isActive ? "Vô hiệu hóa User" : "Kích hoạt User",
      message: `Bạn có chắc muốn ${
        user.isActive ? "vô hiệu hóa" : "kích hoạt"
      } user ${user.email}?`,
      type: user.isActive ? "warning" : "warning",
      onConfirm: async () => {
        try {
          await usersApi.toggleStatus(user.id, !user.isActive);
          showToast(
            `User đã được ${!user.isActive ? "kích hoạt" : "vô hiệu hóa"}`
          );
          loadUsers();
        } catch (error: any) {
          showToast(error.response?.data?.message || "Có lỗi xảy ra");
        }
      },
    });
  };

  const handleDelete = async (user: User) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa User",
      message: `Bạn có chắc muốn xóa user ${user.email}? Hành động này không thể hoàn tác.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await usersApi.delete(user.id);
          showToast("User đã được xóa thành công");
          loadUsers();
        } catch (error: any) {
          showToast(error.response?.data?.message || "Có lỗi xảy ra");
        }
      },
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      ADMIN: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      EVM_STAFF: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
      DEALER_MANAGER:
        "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
      DEALER_STAFF: "bg-gradient-to-r from-gray-500 to-slate-500 text-white",
    };
    return colors[role];
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      ADMIN: "Admin",
      EVM_STAFF: "EVM Staff",
      DEALER_MANAGER: "Dealer Manager",
      DEALER_STAFF: "Dealer Staff",
    };
    return labels[role];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                Quản lý Users
              </h2>
              <p className="text-sm text-gray-500">
                Quản lý tài khoản người dùng trong hệ thống
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Tạo User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Tổng Users",
              value: total,
              icon: UsersIcon,
              color: "from-blue-500 to-blue-600",
              iconBg: "bg-blue-500",
            },
            {
              label: "Admin",
              value: users.filter((u) => u.role === "ADMIN").length,
              icon: Shield,
              color: "from-purple-500 to-purple-600",
              iconBg: "bg-purple-500",
            },
            {
              label: "Dealer Managers",
              value: users.filter((u) => u.role === "DEALER_MANAGER").length,
              icon: Building2,
              color: "from-green-500 to-green-600",
              iconBg: "bg-green-500",
            },
            {
              label: "Active Users",
              value: users.filter((u) => u.isActive).length,
              icon: UserCheck,
              color: "from-orange-500 to-orange-600",
              iconBg: "bg-orange-500",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">{stat.label}</h3>
                <stat.icon className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-75 mt-1">Người dùng</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Bộ lọc & Tìm kiếm
                </h3>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-white transition-colors"
              >
                {showFilters ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Filter className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div
            className={`p-6 space-y-4 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            {/* Search */}
            <div>
              <label
                htmlFor="user-search"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                <Search className="w-4 h-4 inline mr-1.5 text-blue-600" />
                Tìm kiếm nhanh
              </label>
              <input
                id="user-search"
                type="text"
                placeholder="Tìm theo email, tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Role Filter */}
              <div>
                <label
                  htmlFor="role-filter"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  <Filter className="w-3.5 h-3.5 inline mr-1 text-purple-600" />
                  Vai trò
                </label>
                <select
                  id="role-filter"
                  aria-label="Filter by Role"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value as UserRole | "");
                    setPage(1);
                  }}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                >
                  <option value="">Tất cả roles</option>
                  <option value="ADMIN"> Admin</option>
                  <option value="EVM_STAFF"> EVM Staff</option>
                  <option value="DEALER_MANAGER"> Dealer Manager</option>
                  <option value="DEALER_STAFF"> Dealer Staff</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label
                  htmlFor="status-filter"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  <CheckCircle className="w-3.5 h-3.5 inline mr-1 text-green-600" />
                  Trạng thái
                </label>
                <select
                  id="status-filter"
                  aria-label="Filter by Status"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(
                      e.target.value as "all" | "active" | "inactive"
                    );
                    setPage(1);
                  }}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active"> Active</option>
                  <option value="inactive"> Inactive</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-600 mt-4 font-medium">Đang tải...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Không tìm thấy user nào
              </p>
              <p className="text-sm text-gray-500">
                Thử thay đổi bộ lọc hoặc tạo user mới
              </p>
            </div>
          ) : (
            <>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-blue-600" />
                  Danh sách Users ({users.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dealer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user, index) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            <span>{getRoleLabel(user.role)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.dealer ? (
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900 flex items-center space-x-1">
                                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                                <span>{user.dealer.name}</span>
                              </div>
                              <div className="text-gray-500 text-xs mt-0.5">
                                {user.dealer.code}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {user.isActive ? (
                            <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block">
                            <button
                              aria-label="Actions"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === user.id ? null : user.id
                                )
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>

                            {openMenuId === user.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                ></div>
                                <div
                                  className={`absolute ${
                                    index >= users.length - 2
                                      ? "bottom-full mb-2"
                                      : "top-full mt-2"
                                  } right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20 animate-in fade-in zoom-in-95 duration-200`}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowDetailsModal(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium">
                                      Xem chi tiết
                                    </span>
                                  </button>

                                  {(isAdmin ||
                                    currentUser?.role === "DEALER_MANAGER") && (
                                    <button
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowEditModal(true);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                                    >
                                      <Edit className="w-4 h-4 text-orange-600" />
                                      <span className="font-medium">
                                        Chỉnh sửa
                                      </span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowPasswordModal(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                                  >
                                    <Key className="w-4 h-4 text-purple-600" />
                                    <span className="font-medium">
                                      Đổi mật khẩu
                                    </span>
                                  </button>

                                  {isAdmin &&
                                    user.role !== "ADMIN" &&
                                    user.role !== "EVM_STAFF" && (
                                      <button
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setShowDealerModal(true);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-green-50 transition-colors"
                                      >
                                        <Building2 className="w-4 h-4 text-green-600" />
                                        <span className="font-medium">
                                          Gán Dealer
                                        </span>
                                      </button>
                                    )}

                                  {isAdmin && (
                                    <>
                                      <div className="border-t border-gray-200 my-2"></div>

                                      <button
                                        onClick={() => {
                                          handleToggleStatus(user);
                                          setOpenMenuId(null);
                                        }}
                                        className={`w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                          user.isActive
                                            ? "text-gray-700 hover:bg-yellow-50"
                                            : "text-gray-700 hover:bg-blue-50"
                                        }`}
                                      >
                                        {user.isActive ? (
                                          <>
                                            <UserX className="w-4 h-4 text-yellow-600" />
                                            <span className="font-medium">
                                              Vô hiệu hóa
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium">
                                              Kích hoạt
                                            </span>
                                          </>
                                        )}
                                      </button>

                                      <div className="border-t border-gray-200 my-2"></div>

                                      <button
                                        onClick={() => {
                                          handleDelete(user);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="font-medium">Xóa</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700 font-medium">
                Trang <span className="font-bold text-blue-600">{page}</span> /{" "}
                {totalPages}
                <span className="text-gray-500 ml-2">
                  (Tổng: {total} users)
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={(message?: string) => {
              setShowCreateModal(false);
              loadUsers();
              if (message) showToast(message);
            }}
          />
        )}

        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSuccess={(message?: string) => {
              setShowEditModal(false);
              setSelectedUser(null);
              loadUsers();
              if (message) showToast(message);
            }}
          />
        )}

        {showPasswordModal && selectedUser && (
          <ChangePasswordModal
            user={selectedUser}
            onClose={() => {
              setShowPasswordModal(false);
              setSelectedUser(null);
            }}
            onSuccess={(message?: string) => {
              setShowPasswordModal(false);
              setSelectedUser(null);
              if (message) showToast(message);
            }}
          />
        )}

        {showDealerModal && selectedUser && (
          <AssignDealerModal
            user={selectedUser}
            onClose={() => {
              setShowDealerModal(false);
              setSelectedUser(null);
            }}
            onSuccess={(message?: string) => {
              setShowDealerModal(false);
              setSelectedUser(null);
              loadUsers();
              if (message) showToast(message);
            }}
          />
        )}

        {showDetailsModal && selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedUser(null);
            }}
          />
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
        />

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast({ ...toast, isVisible: false })}
        />
      </div>
    </div>
  );
}
