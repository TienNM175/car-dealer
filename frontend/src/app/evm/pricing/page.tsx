'use client'
import React from 'react';
import { Plus } from 'lucide-react';

export default function PricingPage() {
    const mockVehicles = [
    { id: 1, vrn: 'VN-001', make: 'VinFast', model: 'VF e34', variant: 'Eco', year: 2024, price: 690000000, color: 'Trắng', status: 'LIVE', odo: 0, fuelType: 'ELECTRIC' },
    { id: 2, vrn: 'VN-002', make: 'VinFast', model: 'VF 8', variant: 'Plus', year: 2024, price: 1050000000, color: 'Đen', status: 'LIVE', odo: 0, fuelType: 'ELECTRIC' },
    { id: 3, vrn: 'VN-003', make: 'VinFast', model: 'VF 9', variant: 'Premium', year: 2024, price: 1500000000, color: 'Xanh', status: 'DRAFT', odo: 0, fuelType: 'ELECTRIC' },
    { id: 4, vrn: 'VN-004', make: 'VinFast', model: 'VF 5', variant: 'Base', year: 2024, price: 458000000, color: 'Đỏ', status: 'LIVE', odo: 0, fuelType: 'ELECTRIC' },
  ];
    
    const discounts = [
      { id: 1, name: 'Khuyến mãi tháng 10', discount: '5%', startDate: '2024-10-01', endDate: '2024-10-31', dealers: 'Tất cả' },
      { id: 2, name: 'Ưu đãi đại lý miền Bắc', discount: '10 triệu VNĐ', startDate: '2024-10-01', endDate: '2024-12-31', dealers: 'Miền Bắc' },
      { id: 3, name: 'Chiết khấu khối lượng', discount: '3%', startDate: '2024-10-15', endDate: '2024-11-15', dealers: 'Top 10' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Quản lý giá & Chiết khấu</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo chương trình mới
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-black">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-lg mb-4">Bảng giá sản phẩm</h3>
            <div className="space-y-3">
              {mockVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                  <div>
                    <p className="font-semibold">{vehicle.model}</p>
                    <p className="text-xs text-gray-600">{vehicle.variant}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{(vehicle.price / 1000000).toFixed(0)}M</p>
                    <button className="text-xs text-green-600 hover:underline">Chỉnh sửa</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-lg mb-4">Chương trình khuyến mãi</h3>
            <div className="space-y-3">
              {discounts.map((discount) => (
                <div key={discount.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{discount.name}</h4>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {discount.discount}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Thời gian: {discount.startDate} - {discount.endDate}</p>
                    <p>Áp dụng: {discount.dealers}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
                      Chi tiết
                    </button>
                    <button className="px-3 py-1 text-xs text-green-600 border border-green-600 rounded hover:bg-green-50">
                      Sửa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };