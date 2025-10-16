'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, AlertCircle, UserPlus, Mail, Lock, User, Phone, Shield, Building2, ChevronDown, Info 
} from 'lucide-react';
import { usersApi } from '@/lib/api/users';
import { dealersApi } from '@/lib/api/dealers';
import { CreateUserData, UserRole } from '@/lib/types/user';
import { useAuth } from '@/contexts/AuthContext';

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: (message?: string) => void; 
}

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dealers, setDealers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'DEALER_STAFF',
    dealerId: '',
  });

  const isAdmin = currentUser?.role === 'ADMIN';
  const isDealerManager = currentUser?.role === 'DEALER_MANAGER';

  useEffect(() => {
    if (isAdmin) loadDealers();
    if (isDealerManager && currentUser?.dealerId) {
      setFormData(prev => ({
        ...prev,
        dealerId: currentUser.dealerId!,
        role: 'DEALER_STAFF',
      }));
    }
  }, [isAdmin, isDealerManager, currentUser]);

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
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        setLoading(false);
        return;
      }

      if ((formData.role === 'DEALER_MANAGER' || formData.role === 'DEALER_STAFF') && !formData.dealerId) {
        setError('Dealer Manager và Dealer Staff phải được gán vào một dealer');
        setLoading(false);
        return;
      }

      const dataToSubmit = { ...formData };
      if (formData.role === 'ADMIN' || formData.role === 'EVM_STAFF') {
        delete dataToSubmit.dealerId;
      }

      await usersApi.create(dataToSubmit);
      onSuccess('User đã được tạo thành công!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo user');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles: { value: UserRole; label: string; color: string }[] = isAdmin
    ? [
        { value: 'ADMIN', label: 'Admin', color: 'from-purple-500 to-pink-500' },
        { value: 'EVM_STAFF', label: 'EVM Staff', color: 'from-blue-500 to-cyan-500' },
        { value: 'DEALER_MANAGER', label: 'Dealer Manager', color: 'from-green-500 to-emerald-500' },
        { value: 'DEALER_STAFF', label: 'Dealer Staff', color: 'from-gray-500 to-slate-500' },
      ]
    : [{ value: 'DEALER_STAFF', label: 'Dealer Staff', color: 'from-gray-500 to-slate-500' }];

  const needsDealer = formData.role === 'DEALER_MANAGER' || formData.role === 'DEALER_STAFF';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header - Fixed */}
        <div className="flex-shrink-0 relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 p-6 rounded-t-2xl">
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
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Tạo User Mới</h2>
              <p className="text-blue-100 text-sm mt-1">Thêm người dùng vào hệ thống</p>
            </div>
          </div>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 font-medium">{error}</div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>Email <span className="text-red-500">*</span></span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
              placeholder="user@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span>Mật khẩu <span className="text-red-500">*</span></span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
              placeholder="Tối thiểu 8 ký tự"
              required
            />
            <p className="text-xs text-gray-500 mt-2 flex items-start space-x-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</span>
            </p>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Họ và tên đệm <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
                placeholder="Nguyễn Văn"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
                placeholder="A"
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
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
              placeholder="0901234567"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span>Vai trò <span className="text-red-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableRoles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  aria-label={`Chọn vai trò ${role.label}`}
                  onClick={() => setFormData({ ...formData, role: role.value })}
                  disabled={isDealerManager}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.role === role.value
                      ? `border-transparent bg-gradient-to-br ${role.color} text-white shadow-lg`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  } ${isDealerManager ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center space-x-3">
                    <p className={`font-semibold ${formData.role === role.value ? 'text-white' : 'text-gray-900'}`}>
                      {role.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {isDealerManager && (
              <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                <Info className="w-3 h-3" />
                <span>Dealer Manager chỉ có thể tạo Dealer Staff</span>
              </p>
            )}
          </div>

          {/* Dealer */}
          {needsDealer && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span>Dealer <span className="text-red-500">*</span></span>
              </label>
              {isAdmin ? (
                <div className="relative">
                  <select
                    aria-label="Chọn dealer"
                    value={formData.dealerId}
                    onChange={(e) => setFormData({ ...formData, dealerId: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white appearance-none"
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
              ) : (
                <div className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <p className="text-gray-900 font-medium">{currentUser?.dealer?.name || 'Loading...'}</p>
                  <p className="text-xs text-gray-500 mt-1">{currentUser?.dealer?.code}</p>
                </div>
              )}
            </div>
          )}

          {/* Info message for Admin/EVM roles */}
          {!needsDealer && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                {formData.role === 'ADMIN' ? 'Admin' : 'EVM Staff'} không được gán vào dealer nào
              </p>
            </div>
          )}
        </form>

        {/* Footer - Fixed */}
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang tạo...</span>
                </span>
              ) : (
                'Tạo User'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}