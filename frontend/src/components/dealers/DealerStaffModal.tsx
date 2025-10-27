'use client';
import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Phone } from 'lucide-react';
import { dealerApi } from '@/lib/api/dealerApi';
import type { Dealer } from './types';

interface DealerStaff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface DealerStaffModalProps {
  dealer: Dealer;
  onClose: () => void;
}

export default function DealerStaffModal({ dealer, onClose }: DealerStaffModalProps) {
  const [staffMembers, setStaffMembers] = useState<DealerStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStaffMembers();
  }, [dealer.id]);

  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      const response = await dealerApi.getDealerStaff(dealer.id);
      
      if (response.success) {
        setStaffMembers(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load staff members');
      }
    } catch (error: any) {
      console.error('Failed to load staff:', error);
      setError(error.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">Đang tải danh sách nhân viên...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Thay đổi chính: Thêm flex-col và loại bỏ overflow-y-auto từ container ngoài */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header - cố định */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Quản lý Nhân viên</h2>
                <p className="text-sm text-gray-500">
                  Đại lý: {dealer.name} • {staffMembers.length} nhân viên
                </p>
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

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Staff List Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách nhân viên ({staffMembers.length})
            </h3>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            {staffMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có nhân viên nào</p>
                <p className="text-sm text-gray-400 mt-2">Danh sách nhân viên sẽ hiển thị ở đây khi có dữ liệu</p>
              </div>
            ) : (
              staffMembers.map((staff) => (
                <div key={staff.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {staff.lastName} {staff.firstName}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {staff.email}
                        </div>
                        {staff.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {staff.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      staff.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {staff.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {staff.role === 'DEALER_MANAGER' ? 'Quản lý' : 'Nhân viên'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="w-full max-w-4xl p-2"></div>
      </div>
    </div>
  );
}