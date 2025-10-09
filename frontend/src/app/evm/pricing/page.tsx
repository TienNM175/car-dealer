"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Calculator, Tag, CreditCard, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { promotionApi } from "@/lib/api/promotionApi";
import {
  Promotion,
  CalculateDiscountResponse,
} from "@/lib/types/promotion.types";

export default function PricingPage() {
  const router = useRouter();

  // State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dealerId, setDealerId] = useState<string>("");
  const [basePrice, setBasePrice] = useState<number>(1200000000);
  const [selectedPromoId, setSelectedPromoId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [calculatedResult, setCalculatedResult] =
    useState<CalculateDiscountResponse | null>(null);

  // Fetch promotions on mount
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      // Try to get all promotions - dealer filter will be applied by backend based on role
      const response = await promotionApi.getAll({ isActive: true });
      setPromotions(response.data);

      // Auto-select first dealer if available
      if (response.data.length > 0 && !dealerId) {
        const firstDealerId = response.data[0].dealerId;
        setDealerId(firstDealerId);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(
          "Bạn cần đăng nhập để xem khuyến mãi. Vui lòng đăng nhập lại."
        );
      } else {
        setError(err.response?.data?.message || "Failed to fetch promotions");
      }
      console.error("Error fetching promotions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get promotions for selected dealer
  const dealerPromotions = useMemo(() => {
    if (!dealerId) return [];
    return promotions.filter((p) => p.dealerId === dealerId && p.isActive);
  }, [promotions, dealerId]);

  const selectedPromo = useMemo(
    () => dealerPromotions.find((p) => p.id === selectedPromoId) ?? null,
    [dealerPromotions, selectedPromoId]
  );

  // Calculate discount using API
  const handleCalculateDiscount = async () => {
    if (!dealerId) {
      setError("Please select a dealer first");
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      const result = await promotionApi.calculateDiscount({
        dealerId,
        purchaseAmount: basePrice * quantity,
        promotionId: selectedPromoId || undefined,
      });

      setCalculatedResult(result);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to calculate discount");
      console.error("Error calculating discount:", err);
    } finally {
      setCalculating(false);
    }
  };

  // Local calculation for preview (before hitting calculate button)
  const localFinalPrice = useMemo(() => {
    if (!selectedPromo) return basePrice * quantity;

    if (selectedPromo.discountType === "PERCENTAGE") {
      const discount = (Number(selectedPromo.discountValue) / 100) * basePrice;
      return Math.max(0, (basePrice - discount) * quantity);
    }

    // FIXED
    const discounted = Math.max(
      0,
      basePrice - Number(selectedPromo.discountValue)
    );
    return discounted * quantity;
  }, [basePrice, selectedPromo, quantity]);

  const formatVND = (v: number) =>
    v.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });

  // Get unique dealers from promotions
  const dealers = useMemo(() => {
    const uniqueDealers = new Map<string, { id: string; name: string }>();
    promotions.forEach((p) => {
      if (p.dealer && !uniqueDealers.has(p.dealerId)) {
        uniqueDealers.set(p.dealerId, { id: p.dealerId, name: p.dealer.name });
      }
    });
    return Array.from(uniqueDealers.values());
  }, [promotions]);

  // Display price (use calculated result if available, otherwise local estimate)
  const displayFinalPrice = calculatedResult?.finalAmount ?? localFinalPrice;
  const displayDiscount = calculatedResult
    ? calculatedResult.originalAmount - calculatedResult.finalAmount
    : basePrice * quantity - localFinalPrice;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 antialiased flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu khuyến mãi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              Quản lý giá & Khuyến mãi
            </h2>
            <p className="text-sm text-gray-500">
              Tính toán giá bán và áp dụng ưu đãi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPromotions}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
              title="Làm mới danh sách"
            >
              Làm mới
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <Tag className="w-5 h-5" />
              <span className="font-medium">Khuyến mãi</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="font-medium">{error}</p>
              {error.includes("đăng nhập") && (
                <button
                  onClick={() => router.push("/login")}
                  className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Chi tiết giá
            </h3>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="dealerSelect"
                  className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                >
                  Chọn đại lý
                </label>
                <select
                  id="dealerSelect"
                  name="dealerSelect"
                  value={dealerId}
                  onChange={(e) => {
                    setDealerId(e.target.value);
                    setSelectedPromoId(""); // Reset promotion when dealer changes
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                >
                  <option value="">-- Chọn đại lý --</option>
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="basePrice"
                  className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                >
                  Giá gốc (VND)
                </label>
                <input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value || 0))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                />
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                >
                  Số lượng
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value || 1)))
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                />
              </div>

              <div>
                <label
                  htmlFor="promoSelect"
                  className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                >
                  Chọn khuyến mãi
                </label>
                <select
                  id="promoSelect"
                  name="promoSelect"
                  value={selectedPromoId}
                  onChange={(e) => setSelectedPromoId(e.target.value)}
                  disabled={!dealerId}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Không áp dụng</option>
                  {dealerPromotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (
                      {p.discountType === "PERCENTAGE"
                        ? `${p.discountValue}%`
                        : formatVND(Number(p.discountValue))}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleCalculateDiscount}
                  disabled={!dealerId || calculating}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {calculating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Đang tính...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" />
                      Tính giá chính xác
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 border border-gray-200 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-6 text-gray-900">
              Kết quả tính toán
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-2">
                  Giá trước giảm
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatVND(basePrice * quantity)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-2">
                  Giảm giá
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {formatVND(displayDiscount)}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
              <p className="text-sm font-medium text-orange-700 mb-2">
                Khuyến mãi áp dụng
              </p>
              <p className="text-lg font-bold text-orange-900">
                {selectedPromo ? (
                  <>
                    {selectedPromo.name} —{" "}
                    {selectedPromo.discountType === "PERCENTAGE"
                      ? `${selectedPromo.discountValue}%`
                      : formatVND(Number(selectedPromo.discountValue))}
                  </>
                ) : (
                  "Không có"
                )}
              </p>
            </div>

            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">
                  Giá sau giảm
                </p>
                <p className="text-4xl font-bold text-green-700">
                  {formatVND(displayFinalPrice)}
                </p>
                {calculatedResult && (
                  <p className="text-xs text-gray-600 mt-1">
                    ✓ Đã tính toán chính xác từ server
                  </p>
                )}
                {!calculatedResult && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ước tính (nhấn "Tính giá chính xác" để xác nhận)
                  </p>
                )}
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Phương thức thanh toán
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-300">
                  <CreditCard className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">
                    Tiền mặt / Chuyển khoản
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="text-base font-bold mb-4 text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Danh sách khuyến mãi (
                {dealerId
                  ? `${dealerPromotions.length} khuyến mãi`
                  : "Chọn đại lý"}
                )
              </h4>
              {!dealerId && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Vui lòng chọn đại lý để xem khuyến mãi
                </p>
              )}
              {dealerId && dealerPromotions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Đại lý này chưa có khuyến mãi nào
                </p>
              )}
              {dealerId && dealerPromotions.length > 0 && (
                <div className="space-y-3">
                  {dealerPromotions.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md bg-white border-green-200 hover:border-green-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{p.name}</p>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Đang hoạt động
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 font-medium">
                          Giảm giá:{" "}
                          {p.discountType === "PERCENTAGE"
                            ? `${p.discountValue}%`
                            : formatVND(Number(p.discountValue))}
                        </p>
                        {p.minPurchase && (
                          <p className="text-xs text-gray-500 mt-1">
                            Đơn tối thiểu: {formatVND(Number(p.minPurchase))}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded">
                        {p.discountType}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
