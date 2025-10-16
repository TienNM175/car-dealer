'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Building2, ChevronDown, Check } from 'lucide-react';
import { usersApi } from '@/lib/api/users';
import { dealersApi } from '@/lib/api/dealers';
import { User } from '@/lib/types/user';

interface AssignDealerModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (message?: string) => void; 
}

export default function AssignDealerModal({ user, onClose, onSuccess }: AssignDealerModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingDealers, setLoadingDealers] = useState(true);
  const [error, setError] = useState('');
  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState(user.dealerId || '');

  useEffect(() => {
    loadDealers();
  }, []);

  const loadDealers = async () => {
    try {
      const response = await dealersApi.list({ page: 1, limit: 100 });
      setDealers(response.data);
    } catch (error: any) {
      setError('Không thể tải danh sách dealers');
    } finally {
      setLoadingDealers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDealerId) {
      setError('Vui lòng chọn dealer');
      return;
    }

    setLoading(true);

    try {
      await usersApi.assignToDealer(user.id, selectedDealerId);
      onSuccess('User đã được gán vào dealer thành công!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const selectedDealer = dealers.find(d => d.id === selectedDealerId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header - Fixed */}
        <div className="flex-shrink-0 relative bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 p-6 rounded-t-2xl">
          <button
            aria-label="Đóng cửa sổ"
            onClick={onClose}
            className="absolute right-4 top-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Gán Dealer</h2>
              <p className="text-green-100 text-sm mt-1">
                {user.firstName} {user.lastName}
              </p>
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

          {/* Current Dealer Info */}
          {user.dealer && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">
                Dealer hiện tại
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.dealer.name}</p>
                    <p className="text-sm text-gray-600">{user.dealer.code}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Select Dealer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Chọn Dealer mới <span className="text-red-500">*</span>
            </label>
            {loadingDealers ? (
              <div className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-500 text-sm flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tải dealers...</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  aria-label="Chọn Dealer"
                  value={selectedDealerId}
                  onChange={(e) => setSelectedDealerId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none font-medium text-gray-900 bg-white appearance-none cursor-pointer hover:border-gray-300"
                  required
                >
                  <option value="">-- Chọn dealer --</option>
                  {dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>
                      {dealer.name} ({dealer.code}) - {dealer.city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            )}

            {/* Selected Dealer Preview */}
            {selectedDealer && selectedDealer.id !== user.dealerId && (
              <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-xl flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  Sẽ gán vào: {selectedDealer.name}
                </span>
              </div>
            )}
          </div>

          {/* User Role Info */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <span className="text-xl">💡</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Role: <span className="text-blue-600">{user.role}</span>
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Chỉ Dealer Manager và Dealer Staff mới có thể được gán vào dealer
                </p>
              </div>
            </div>
          </div>
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
              disabled={loading || loadingDealers || !selectedDealerId}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 hover:from-green-700 hover:via-green-800 hover:to-emerald-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang gán...</span>
                </span>
              ) : (
                'Gán Dealer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}