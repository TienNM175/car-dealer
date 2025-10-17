'use client';
import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail, CheckCircle } from 'lucide-react';
import { dealerApi } from '@/lib/api/dealerApi';
import type { Region, UpdateDealerInput, Dealer } from './types';

interface EditDealerModalProps {
  dealer: Dealer;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

export default function EditDealerModal({ dealer, onClose, onSuccess }: EditDealerModalProps) {
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [formData, setFormData] = useState<UpdateDealerInput>({
    name: dealer.name,
    regionId: dealer.regionId,
    address: dealer.address || '',
    city: dealer.city || '',
    phone: dealer.phone || '',
    email: dealer.email || '',
    isActive: dealer.isActive,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UpdateDealerInput, string>>>({});
  const [submitError, setSubmitError] = useState<string>(''); // Thay thế errors.submit

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const response = await dealerApi.getAllRegions();
      if (response.success) {
        setRegions(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  };

  const handleChange = (field: keyof UpdateDealerInput, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateDealerInput, string>> = {};

    if (formData.name && !formData.name.trim()) {
      newErrors.name = 'Tên đại lý là bắt buộc';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    setLoading(true);
    try {
      // Chuẩn bị data - đảm bảo không gửi field undefined
      const submitData: UpdateDealerInput = {};
      
      // Chỉ gửi các field thực sự thay đổi
      if (formData.name !== dealer.name) submitData.name = formData.name;
      if (formData.regionId !== dealer.regionId) submitData.regionId = formData.regionId;
      if (formData.isActive !== dealer.isActive) submitData.isActive = formData.isActive;
      if (formData.address !== dealer.address) submitData.address = formData.address;
      if (formData.city !== dealer.city) submitData.city = formData.city;
      if (formData.phone !== dealer.phone) submitData.phone = formData.phone;
      if (formData.email !== dealer.email) submitData.email = formData.email;
  
      console.log('🔄 Updating dealer with changed data:', submitData);
      
      // Kiểm tra nếu không có gì thay đổi
      if (Object.keys(submitData).length === 0) {
        setSubmitError('Không có thông tin nào thay đổi');
        setLoading(false);
        return;
      }
      
      const response = await dealerApi.updateDealer(dealer.id, submitData);
      
      console.log('✅ Update response:', response);
      
      if (response.success) {
        onSuccess(response.message || 'Đại lý đã được cập nhật thành công');
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('💥 Update error details:', error);
      
      // Lấy chi tiết lỗi từ response
      let errorMessage = 'Có lỗi xảy ra khi cập nhật đại lý';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Hiển thị lỗi chi tiết từ backend nếu có
      if (error.response?.data?.details) {
        errorMessage += `: ${error.response.data.details}`;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
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
                <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa Đại lý</h2>
                <p className="text-sm text-gray-500">Cập nhật thông tin đại lý</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitError && ( // Hiển thị submitError
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm font-medium">{submitError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên đại lý *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 ${
                  errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Nhập tên đại lý"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vùng miền
              </label>
              <select
                value={formData.regionId || ''}
                onChange={(e) => handleChange('regionId', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
              >
                <option value="">Chọn vùng miền</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1.5 text-gray-500" />
                Thành phố
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
                placeholder="Nhập thành phố"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1.5 text-gray-500" />
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 ${
                  errors.phone ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Nhập số điện thoại"
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1.5 text-gray-500" />
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 ${
                  errors.email ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Nhập email"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700">Đại lý đang hoạt động</span>
                </div>
              </label>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Địa chỉ
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 resize-none"
                placeholder="Nhập địa chỉ chi tiết"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật Đại lý'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}