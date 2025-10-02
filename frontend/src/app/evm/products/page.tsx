'use client'
import React from 'react';
import { Plus, Car, Edit, Eye, Trash2 } from 'lucide-react';

export default function ProductsPage() {
    const mockVehicles = [
    { id: 1, vrn: 'VN-001', make: 'VinFast', model: 'VF e34', variant: 'Eco', year: 2024, price: 690000000, color: 'Trắng', status: 'LIVE', odo: 0, fuelType: 'ELECTRIC' },
    { id: 2, vrn: 'VN-002', make: 'VinFast', model: 'VF 8', variant: 'Plus', year: 2024, price: 1050000000, color: 'Đen', status: 'LIVE', odo: 0, fuelType: 'ELECTRIC' },
    { id: 3, vrn: 'VN-003', make: 'VinFast', model: 'VF 9', variant: 'Premium', year: 2024, price: 1500000000, color: 'Xanh', status: 'DRAFT', odo: 0, fuelType: 'ELECTRIC' },
    { id: 4, vrn: 'VN-004', make: 'VinFast', model: 'VF 5', variant: 'Base', year: 2024, price: 458000000, color: 'Đỏ', status: 'LIVE', odo: 0, fuelType: 'ELECTRIC' },
  ];
 return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Tổng sản phẩm</p>
            <p className="text-2xl font-bold text-gray-900">156</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Đang kinh doanh</p>
            <p className="text-2xl font-bold text-green-600">142</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Ngừng kinh doanh</p>
            <p className="text-2xl font-bold text-red-600">14</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Model mới</p>
            <p className="text-2xl font-bold text-blue-600">8</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 text-black">
          <div className="space-y-4">
            {mockVehicles.map((vehicle) => (
              <div key={vehicle.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Car className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{vehicle.make} {vehicle.model}</h3>
                      <p className="text-sm text-gray-600">{vehicle.variant} - {vehicle.year}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-600">VRN: {vehicle.vrn}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${vehicle.status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {vehicle.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                        aria-label="Chỉnh sửa sản phẩm"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        aria-label="Xem chi tiết sản phẩm"
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        aria-label="Xóa sản phẩm"
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };