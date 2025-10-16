'use client';

import React from 'react';
import { X, Mail, Phone, Building2, Shield, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { User } from '@/lib/types/user';

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
}

export default function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'from-purple-500 to-pink-500',
      EVM_STAFF: 'from-blue-500 to-cyan-500',
      DEALER_MANAGER: 'from-green-500 to-emerald-500',
      DEALER_STAFF: 'from-gray-500 to-slate-500',
    };
    return colors[role] || 'from-gray-500 to-slate-500';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      EVM_STAFF: 'EVM Staff',
      DEALER_MANAGER: 'Dealer Manager',
      DEALER_STAFF: 'Dealer Staff',
    };
    return labels[role] || role;
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      ADMIN: 'Toàn quyền quản trị hệ thống',
      EVM_STAFF: 'Quản lý sản phẩm, tồn kho, dealers',
      DEALER_MANAGER: 'Quản lý dealer và nhân viên',
      DEALER_STAFF: 'Nhân viên bán hàng tại dealer',
    };
    return descriptions[role] || role;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl flex-shrink-0">
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Avatar & Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              {user.isActive && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <div className="flex-1 text-white">
              <h2 className="text-3xl font-bold mb-1">
                {user.firstName} {user.lastName}
              </h2>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${getRoleBadgeColor(user.role)} text-white shadow-lg flex items-center space-x-1`}>
                  <span>{getRoleLabel(user.role)}</span>
                </span>
                {user.isActive ? (
                  <span className="flex items-center space-x-1 text-white/90 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-white/90 text-sm font-medium bg-red-500/30 px-3 py-1 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Inactive</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Contact Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Thông tin liên hệ</h3>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 space-y-4 border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-base font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Số điện thoại</p>
                    <p className="text-base font-medium text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dealer Information */}
          {user.dealer && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Thông tin Dealer</h3>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xl font-bold text-gray-900">{user.dealer.name}</p>
                    <p className="text-sm text-gray-600 mt-1 font-medium">Mã: {user.dealer.code}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Building2 className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                {user.dealer.city && (
                  <div className="flex items-center space-x-2 text-gray-700 bg-white/50 px-3 py-2 rounded-lg">
                    <span className="text-lg">📍</span>
                    <span className="font-medium">{user.dealer.city}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Role Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Vai trò</h3>
            </div>
            <div className={`bg-gradient-to-br ${getRoleBadgeColor(user.role)} rounded-xl p-5 text-white shadow-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="text-xl font-bold">{getRoleLabel(user.role)}</p>
                  </div>
                  <p className="text-white/90 text-sm">{getRoleDescription(user.role)}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Shield className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Thông tin tài khoản</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">Ngày tạo</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(user.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-2">Cập nhật lần cuối</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(user.updatedAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(user.updatedAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gradient-to-br from-gray-50 to-white rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-indigo-500/30"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
