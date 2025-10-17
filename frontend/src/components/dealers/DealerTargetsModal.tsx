'use client';
import React, { useState, useEffect } from 'react';
import { X, Target, TrendingUp, Calendar, Plus } from 'lucide-react';
import { dealerApi } from '@/lib/api/dealerApi';
import type { Dealer, DealerTarget } from './types';

interface DealerTargetsModalProps {
  dealer: Dealer;
  onClose: () => void;
  onSuccess?: (message?: string) => void;
}

export default function DealerTargetsModal({ dealer, onClose, onSuccess }: DealerTargetsModalProps) {
  const [targets, setTargets] = useState<DealerTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTargets();
  }, [dealer.id]);

  const loadTargets = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      const response = await dealerApi.getDealerTargets(dealer.id, currentYear);
      
      if (response.success) {
        setTargets(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load targets');
      }
    } catch (error: any) {
      console.error('Failed to load targets:', error);
      setError(error.message || 'Không thể tải chỉ tiêu kinh doanh');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    // Chuyển đổi sang number nếu là string
    const numAmount = typeof amount === 'string' ? Number(amount) : amount;
    
    if (typeof numAmount !== 'number' || isNaN(numAmount)) {
      return '0 ₫';
    }
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatMonth = (year: number, month: number) => {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return `${monthNames[month - 1]}/${year}`;
  };

  const getSortedTargets = () => {
    return [...targets].sort((a, b) => {
      // Sắp xếp theo năm giảm dần (mới nhất trước)
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      // Nếu cùng năm, sắp xếp theo tháng giảm dần
      return b.month - a.month;
    });
  };

  const calculateProgress = (achieved: string | number = 0, target: string | number = 0) => {
    // Chuyển đổi sang number
    const numAchieved = typeof achieved === 'string' ? Number(achieved) : achieved;
    const numTarget = typeof target === 'string' ? Number(target) : target;
    
    if (numTarget === 0) return 0;
    return Math.round((numAchieved / numTarget) * 100);
  };

  const calculateTotals = () => {
    let totalTarget = 0;
    let totalAchieved = 0;
    
    targets.forEach(target => {
      const targetAmount = target.targetAmount || '0';
      const achievedAmount = target.achievedAmount || '0';

      // Chuyển đổi sang number
      totalTarget += Number(targetAmount) || 0;
      totalAchieved += Number(achievedAmount) || 0;
    });
    
    const overallProgress = calculateProgress(totalAchieved, totalTarget);
    
    return { totalTarget, totalAchieved, overallProgress };
  };

  const handleAddTarget = async () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const newTarget = {
      year: currentYear,
      month: currentMonth,
      targetAmount: 100000000,
    };

    try {
      const response = await dealerApi.setDealerTarget(dealer.id, newTarget.year, newTarget.month, newTarget.targetAmount);
      if (response.success) {
        onSuccess?.('Đã thêm chỉ tiêu thành công');
        loadTargets();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi thêm chỉ tiêu');
    }
  };

  const { totalTarget, totalAchieved, overallProgress } = calculateTotals();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">Đang tải chỉ tiêu kinh doanh...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chỉ tiêu Kinh doanh</h2>
                <p className="text-sm text-gray-500">Đại lý: {dealer.name}</p>
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
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-blue-700">Tổng chỉ tiêu</h3>
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(totalTarget)}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-green-700">Đã đạt được</h3>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(totalAchieved)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-orange-700">Tỷ lệ hoàn thành</h3>
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {overallProgress}%
              </p>
            </div>
          </div>

          {/* Add Target Button */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Chỉ tiêu theo tháng ({targets.length})
            </h3>
            <button 
              className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-colors"
              onClick={handleAddTarget}
            >
              <Plus className="w-4 h-4" />
              Thêm chỉ tiêu
            </button>
          </div>

          {/* Targets List */}
<div className="space-y-4">
  {targets.length === 0 ? (
    <div className="text-center py-8 text-gray-500">
      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>Chưa có chỉ tiêu nào</p>
      <button 
        onClick={handleAddTarget}
        className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
      >
        Thêm chỉ tiêu đầu tiên
      </button>
    </div>
  ) : (
    getSortedTargets().map((target: DealerTarget, index: number) => {
      const targetAmount = target.targetAmount || '0';
      const achievedAmount = target.achievedAmount || '0';
      const progress = calculateProgress(achievedAmount, targetAmount);
      
      return (
        <div key={target.id || index} className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">
              {formatMonth(target.year, target.month)}
              {target.productType && (
                <span className="text-sm text-gray-500 ml-2">({target.productType})</span>
              )}
            </h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              progress >= 100 
                ? 'bg-green-100 text-green-700'
                : progress >= 80
                ? 'bg-blue-100 text-blue-700'
                : progress >= 50
                ? 'bg-orange-100 text-orange-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {progress}%
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Đã đạt: {formatCurrency(achievedAmount)}</span>
              <span>Mục tiêu: {formatCurrency(targetAmount)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  progress >= 100 
                    ? 'bg-green-600'
                    : progress >= 80
                    ? 'bg-blue-600'
                    : progress >= 50
                    ? 'bg-orange-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      );
    })
  )}
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