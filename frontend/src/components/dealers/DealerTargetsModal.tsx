"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Target,
  TrendingUp,
  Calendar,
  Plus,
  Edit,
  Save,
  Banknote,
} from "lucide-react";
import { dealerApi } from "@/lib/api/dealerApi";
import type { Dealer, DealerTarget } from "./types";

interface DealerTargetsModalProps {
  dealer: Dealer;
  onClose: () => void;
  onSuccess?: (message?: string) => void;
}

// Modal thêm/chỉnh sửa chỉ tiêu (giữ nguyên nhưng bỏ xóa)
function TargetEditModal({
  isOpen,
  onClose,
  onSave,
  target,
  dealerName,
  existingTargets,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (year: number, month: number, targetAmount: number) => void;
  target?: {
    year: number;
    month: number;
    targetAmount: number;
    id?: string;
  } | null;
  dealerName: string;
  existingTargets: { year: number; month: number; id?: string }[];
}) {
  const [year, setYear] = useState(target?.year || new Date().getFullYear());
  const [month, setMonth] = useState(
    target?.month || new Date().getMonth() + 1
  );
  const [targetAmount, setTargetAmount] = useState(
    target?.targetAmount?.toString() || ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (target) {
      setYear(target.year);
      setMonth(target.month);
      setTargetAmount(target.targetAmount?.toString() || "");
    } else {
      const currentDate = new Date();
      setYear(currentDate.getFullYear());
      setMonth(currentDate.getMonth() + 1);
      setTargetAmount("");
    }
  }, [target, isOpen]);

  const handleSave = () => {
    if (
      !targetAmount ||
      isNaN(Number(targetAmount)) ||
      Number(targetAmount) <= 0
    ) {
      setError("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (year < 2000 || year > 2100) {
      setError("Năm không hợp lệ");
      return;
    }

    if (month < 1 || month > 12) {
      setError("Tháng không hợp lệ");
      return;
    }

    // Kiểm tra trùng lặp (chỉ khi thêm mới)
    if (!target?.id) {
      const isDuplicate = existingTargets.some(
        (t) => t.year === year && t.month === month && t.id !== target?.id
      );
      if (isDuplicate) {
        setError(
          "Đã có chỉ tiêu cho tháng này. Vui lòng chọn tháng khác hoặc chỉnh sửa chỉ tiêu hiện có."
        );
        return;
      }
    }

    setError("");
    onSave(year, month, Number(targetAmount));
  };

  if (!isOpen) return null;

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {target ? "Chỉnh sửa Chỉ tiêu" : "Thêm Chỉ tiêu Mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Đại lý: <span className="font-medium">{dealerName}</span>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Năm
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-700"
                min="2000"
                max="2100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tháng
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-700"
              >
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chỉ tiêu (VND)
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Nhập số tiền chỉ tiêu..."
                className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-700"
                min="0"
                step="100000"
              />
            </div>
            {targetAmount && (
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(Number(targetAmount))}
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl transition-all font-semibold shadow-md hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {target ? "Cập nhật" : "Thêm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hàm format currency
const formatCurrency = (amount: string | number) => {
  const numAmount = typeof amount === "string" ? Number(amount) : amount;

  if (typeof numAmount !== "number" || isNaN(numAmount)) {
    return "0 ₫";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

export default function DealerTargetsModal({
  dealer,
  onClose,
  onSuccess,
}: DealerTargetsModalProps) {
  const [targets, setTargets] = useState<DealerTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    target: DealerTarget | null;
  }>({ isOpen: false, target: null });

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
        throw new Error(response.message || "Failed to load targets");
      }
    } catch (error: any) {
      console.error("Failed to load targets:", error);
      setError(error.message || "Không thể tải chỉ tiêu kinh doanh");
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (year: number, month: number) => {
    const monthNames = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];
    return `${monthNames[month - 1]}/${year}`;
  };

  const getSortedTargets = () => {
    return [...targets].sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
  };

  const calculateProgress = (
    achieved: string | number = 0,
    target: string | number = 0
  ) => {
    const numAchieved =
      typeof achieved === "string" ? Number(achieved) : achieved;
    const numTarget = typeof target === "string" ? Number(target) : target;

    if (numTarget === 0) return 0;
    return Math.round((numAchieved / numTarget) * 100);
  };

  const calculateTotals = () => {
    let totalTarget = 0;
    let totalAchieved = 0;

    targets.forEach((target) => {
      const targetAmount = target.targetAmount || "0";
      const achievedAmount = target.achievedAmount || "0";

      totalTarget += Number(targetAmount) || 0;
      totalAchieved += Number(achievedAmount) || 0;
    });

    const overallProgress = calculateProgress(totalAchieved, totalTarget);

    return { totalTarget, totalAchieved, overallProgress };
  };

  const handleAddTarget = () => {
    setEditModal({ isOpen: true, target: null });
  };

  const handleEditTarget = (target: DealerTarget) => {
    setEditModal({ isOpen: true, target });
  };

  const handleSaveTarget = async (
    year: number,
    month: number,
    targetAmount: number
  ) => {
    try {
      const response = await dealerApi.setDealerTarget(
        dealer.id,
        year,
        month,
        targetAmount
      );
      if (response.success) {
        onSuccess?.(
          editModal.target
            ? "Đã cập nhật chỉ tiêu thành công"
            : "Đã thêm chỉ tiêu thành công"
        );
        loadTargets();
        setEditModal({ isOpen: false, target: null });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error("Failed to save target:", error);
      alert(error.message || "Có lỗi xảy ra khi lưu chỉ tiêu");
    }
  };

  const { totalTarget, totalAchieved, overallProgress } = calculateTotals();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">
              Đang tải chỉ tiêu kinh doanh...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Thay đổi chính: Thêm flex-col và loại bỏ overflow-y-auto từ container ngoài */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header - cố định */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Chỉ tiêu Kinh doanh
                  </h2>
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

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-blue-700">
                    Tổng chỉ tiêu
                  </h3>
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatCurrency(totalTarget)}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-green-700">
                    Đã đạt được
                  </h3>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(totalAchieved)}
                </p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-orange-700">
                    Tỷ lệ hoàn thành
                  </h3>
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

            {/* Targets List - BỎ NÚT XÓA */}
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
                getSortedTargets().map(
                  (target: DealerTarget, index: number) => {
                    const targetAmount = target.targetAmount || "0";
                    const achievedAmount = target.achievedAmount || "0";
                    const progress = calculateProgress(
                      achievedAmount,
                      targetAmount
                    );

                    return (
                      <div
                        key={target.id || index}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            {formatMonth(target.year, target.month)}
                            {target.productType && (
                              <span className="text-sm text-gray-500 ml-2">
                                ({target.productType})
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                progress >= 100
                                  ? "bg-green-100 text-green-700"
                                  : progress >= 80
                                  ? "bg-blue-100 text-blue-700"
                                  : progress >= 50
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {progress}%
                            </span>
                            {/* CHỈ CÒN NÚT EDIT, BỎ NÚT DELETE */}
                            <button
                              onClick={() => handleEditTarget(target)}
                              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>
                              Đã đạt: {formatCurrency(achievedAmount)}
                            </span>
                            <span>
                              Mục tiêu: {formatCurrency(targetAmount)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                progress >= 100
                                  ? "bg-green-600"
                                  : progress >= 80
                                  ? "bg-blue-600"
                                  : progress >= 50
                                  ? "bg-orange-600"
                                  : "bg-red-600"
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>
          <div className="w-full max-w-4xl p-3"></div>
        </div>
      </div>

      {/* Add/Edit Target Modal */}
      <TargetEditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, target: null })}
        onSave={handleSaveTarget}
        target={editModal.target}
        dealerName={dealer.name}
        existingTargets={targets}
      />
    </>
  );
}
