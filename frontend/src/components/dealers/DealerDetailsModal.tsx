'use client';
import React from 'react';
import { X, Building2, MapPin, Phone, Mail, Calendar, Users, Package, ShoppingCart } from 'lucide-react';
import type { Dealer } from './types';

interface DealerDetailsModalProps {
  dealer: Dealer;
  onClose: () => void;
}

export default function DealerDetailsModal({ dealer, onClose }: DealerDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chi tiết Đại lý</h2>
                <p className="text-sm text-gray-500">Thông tin chi tiết đại lý</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tên đại lý</label>
                  <p className="text-base font-semibold text-gray-900">{dealer.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mã đại lý</label>
                  <p className="text-base font-semibold text-blue-600">{dealer.code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Trạng thái</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dealer.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dealer.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>
              <div className="space-y-3">
                {dealer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{dealer.phone}</span>
                  </div>
                )}
                {dealer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{dealer.email}</span>
                  </div>
                )}
                {dealer.city && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{dealer.city}</span>
                  </div>
                )}
                {dealer.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{dealer.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {dealer._count && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{dealer._count.users || 0}</div>
                  <div className="text-sm text-blue-700">Nhân viên</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{dealer._count.inventories || 0}</div>
                  <div className="text-sm text-green-700">Tồn kho</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <ShoppingCart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{dealer._count.dealerOrders || 0}</div>
                  <div className="text-sm text-purple-700">Đơn hàng</div>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin hệ thống</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Ngày tạo</div>
                  <div className="text-sm text-gray-900">{formatDate(dealer.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Cập nhật cuối</div>
                  <div className="text-sm text-gray-900">{formatDate(dealer.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}