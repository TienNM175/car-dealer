'use client';
import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { dealerApi } from '@/lib/api/dealerApi';
import type { Region, CreateDealerInput } from './types';

interface CreateDealerModalProps {
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

export default function CreateDealerModal({ onClose, onSuccess }: CreateDealerModalProps) {
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [formData, setFormData] = useState<CreateDealerInput>({
    name: '',
    code: '',
    regionId: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    isActive: true, 
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateDealerInput, string>>>({});
  const [submitError, setSubmitError] = useState<string>('');

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

  const handleChange = (field: keyof CreateDealerInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateDealerInput, string>> = {};
  
    if (!formData.name.trim()) {
      newErrors.name = 'Tên đại lý là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên đại lý phải có ít nhất 2 ký tự';
    }
  
    if (!formData.code.trim()) {
      newErrors.code = 'Mã đại lý là bắt buộc';
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Mã đại lý chỉ được chứa chữ in hoa, số và dấu gạch ngang';
    } else if (formData.code.trim().length < 3) {
      newErrors.code = 'Mã đại lý phải có ít nhất 3 ký tự';
    }
  
    if (!formData.regionId) {
      newErrors.regionId = 'Vùng miền là bắt buộc';
    }
  
    if (formData.phone && !/^(\+84|0)[3|5|7|8|9][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
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
      console.log('🔄 Creating dealer with data:', formData);
      
      const response = await dealerApi.createDealer(formData);
      
      console.log('✅ Create response:', response);
      
      if (response.success) {
        console.log('🎉 Create successful');
        onSuccess(response.message || 'Đại lý đã được tạo thành công');
      } else {
        console.log('❌ Create failed:', response.message);
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('💥 Create error:', error);
      const errorMessage = error.message || 'Có lệ xảy ra khi tạo đại lý';
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Thay đổi chính: Thêm flex-col và max-h cho container ngoài */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header - cố định */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Thêm Đại lý Mới</h2>
                <p className="text-sm text-gray-500">Tạo đại lý mới trong hệ thống</p>
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

        {/* Form - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {submitError && (
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
                value={formData.name}
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

            {/* Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mã đại lý *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 ${
                  errors.code ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="VD: DL-HN-001"
              />
              {errors.code && (
                <p className="text-red-600 text-sm mt-1">{errors.code}</p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vùng miền *
              </label>
              <select
                value={formData.regionId}
                onChange={(e) => handleChange('regionId', e.target.value)}
                className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white ${
                  errors.regionId ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">Chọn vùng miền</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.regionId && (
                <p className="text-red-600 text-sm mt-1">{errors.regionId}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1.5 text-gray-500" />
                Thành phố
              </label>
              <input
                type="text"
                value={formData.city}
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
                value={formData.phone}
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
                value={formData.email}
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

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Địa chỉ
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 resize-none"
                placeholder="Nhập địa chỉ chi tiết"
              />
            </div>
          </div>
        </div>

        {/* Actions - cố định ở dưới */}
        <div className="flex-shrink-0 p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang tạo...' : 'Tạo Đại lý'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}