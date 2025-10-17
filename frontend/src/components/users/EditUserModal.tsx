'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Edit3,
  User,
  Phone,
  Shield,
  Building2,
  ChevronDown,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { usersApi } from '@/lib/api/users';
import { dealersApi } from '@/lib/api/dealer';
import { User as UserType, UpdateUserData, UserRole } from '@/lib/types/user';
import { useAuth } from '@/contexts/AuthContext';

interface EditUserModalProps {
  user: UserType;
  onClose: () => void;
  onSuccess: (message?: string) => void; // ✅ Cập nhật prop
}

export default function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dealers, setDealers] = useState<any[]>([]);

  const [formData, setFormData] = useState<UpdateUserData>({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    role: user.role,
    dealerId: user.dealerId || '',
    isActive: user.isActive,
  });

  const isAdmin = currentUser?.role === 'ADMIN';
  const isDealerManager = currentUser?.role === 'DEALER_MANAGER';

  useEffect(() => {
    if (isAdmin) {
      loadDealers();
    }
  }, [isAdmin]);

  const loadDealers = async () => {
    try {
      const response = await dealersApi.list({ page: 1, limit: 100 });
      setDealers(response.data);
    } catch (error) {
      console.error('Failed to load dealers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.firstName || !formData.lastName) {
        setError('Vui lòng điền đầy đủ họ tên');
        setLoading(false);
        return;
      }

      const dataToSubmit: UpdateUserData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      };

      if (isAdmin) {
        dataToSubmit.role = formData.role;
        dataToSubmit.isActive = formData.isActive;

        if (formData.role === 'DEALER_MANAGER' || formData.role === 'DEALER_STAFF') {
          if (!formData.dealerId) {
            setError('Dealer Manager và Dealer Staff phải được gán vào một dealer');
            setLoading(false);
            return;
          }
          dataToSubmit.dealerId = formData.dealerId;
        } else {
          dataToSubmit.dealerId = undefined;
        }
      }

      await usersApi.update(user.id, dataToSubmit);

      // ✅ Gọi toast message qua onSuccess
      onSuccess('User đã được cập nhật thành công!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật user');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles: { value: UserRole; label: string; color: string }[] = [
    { value: 'ADMIN', label: 'Admin', color: 'from-purple-500 to-pink-500' },
    { value: 'EVM_STAFF', label: 'EVM Staff', color: 'from-blue-500 to-cyan-500' },
    { value: 'DEALER_MANAGER', label: 'Dealer Manager', color: 'from-green-500 to-emerald-500' },
    { value: 'DEALER_STAFF', label: 'Dealer Staff', color: 'from-gray-500 to-slate-500' },
  ];

  const needsDealer = formData.role === 'DEALER_MANAGER' || formData.role === 'DEALER_STAFF';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 p-6 rounded-t-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="absolute right-4 top-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Chỉnh sửa User</h2>
              <p className="text-orange-100 text-sm mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 font-medium">{error}</div>
            </div>
          )}

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>
                  Họ và tên đệm <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                aria-label="Họ và tên đệm"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none font-medium text-gray-900"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                aria-label="Tên"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none font-medium text-gray-900"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>Số điện thoại</span>
            </label>
            <input
              aria-label="Số điện thoại"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none font-medium text-gray-900"
            />
          </div>

          {/* Role - only Admin */}
          {isAdmin && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span>
                  Vai trò <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableRoles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.value })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.role === role.value
                        ? `border-transparent bg-gradient-to-br ${role.color} text-white shadow-lg`
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <p
                        className={`font-semibold ${
                          formData.role === role.value ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {role.label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dealer select */}
          {isAdmin && needsDealer && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span>
                  Dealer <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="relative">
                <select
                  aria-label="Chọn dealer"
                  value={formData.dealerId}
                  onChange={(e) => setFormData({ ...formData, dealerId: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none font-medium text-gray-900 bg-white appearance-none"
                  required
                >
                  <option value="">Chọn dealer...</option>
                  {dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>
                      {dealer.name} ({dealer.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Active toggle */}
          {isAdmin && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Tài khoản đang hoạt động</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {formData.isActive
                      ? 'User có thể đăng nhập hệ thống'
                      : 'User không thể đăng nhập'}
                  </p>
                </div>
                {formData.isActive && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </label>
            </div>
          )}

          {isDealerManager && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Dealer Manager chỉ có thể chỉnh sửa họ tên và số điện thoại
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 transition-all font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 hover:from-orange-700 hover:via-orange-800 hover:to-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang lưu...</span>
                </span>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
