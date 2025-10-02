'use client'
import React, { useState } from 'react';
import { Search, Filter, Eye, X, Car } from 'lucide-react';

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  const mockVehicles = [
    { id: 1, vrn: 'VN-001', make: 'VinFast', model: 'VF e34', variant: 'Eco', year: 2024, price: 690000000, color: 'Trắng', status: 'LIVE', odo: 0, fuelType: 'ELECTRIC' },
    { id: 2, vrn: 'VN-002', make: 'VinFast', model: 'VF 8', variant: 'Plus', year: 2024, price: 1050000000, color: 'Đen', status: 'LIVE', odo: 0, fuelType: 'ELECTRIC' },
    { id: 3, vrn: 'VN-003', make: 'VinFast', model: 'VF 9', variant: 'Premium', year: 2024, price: 1500000000, color: 'Xanh', status: 'DRAFT', odo: 0, fuelType: 'ELECTRIC' },
    { id: 4, vrn: 'VN-004', make: 'VinFast', model: 'VF 5', variant: 'Base', year: 2024, price: 458000000, color: 'Đỏ', status: 'LIVE', odo: 0, fuelType: 'ELECTRIC' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Danh mục xe</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Filter className="w-4 h-4" aria-hidden="true" />
          Bộ lọc
        </button>
      </div>

      {/* Search + Grid */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Tìm kiếm xe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-black">
          {mockVehicles.map((vehicle) => (
            <div key={vehicle.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Car className="w-20 h-20 text-white opacity-50" aria-hidden="true" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{vehicle.make} {vehicle.model}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${vehicle.status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {vehicle.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{vehicle.variant} - {vehicle.year}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Màu sắc:</span>
                    <span className="font-medium">{vehicle.color}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VRN:</span>
                    <span className="font-medium">{vehicle.vrn}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-xl font-bold text-blue-600">
                    {(vehicle.price / 1000000).toFixed(0)}M VNĐ
                  </span>
                  <button
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                    Chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Chi tiết */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">Chi tiết xe</h3>
              <button onClick={() => setSelectedVehicle(null)} className="text-gray-500 hover:text-gray-700" aria-label="Đóng">
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6">
              <div className="h-64 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Car className="w-32 h-32 text-white opacity-50" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-black">
                <div>
                  <p className="text-sm text-gray-600">Hãng xe</p>
                  <p className="font-semibold">{selectedVehicle.make}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Model</p>
                  <p className="font-semibold">{selectedVehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phiên bản</p>
                  <p className="font-semibold">{selectedVehicle.variant}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Năm sản xuất</p>
                  <p className="font-semibold">{selectedVehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Màu sắc</p>
                  <p className="font-semibold">{selectedVehicle.color}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">VRN</p>
                  <p className="font-semibold">{selectedVehicle.vrn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loại nhiên liệu</p>
                  <p className="font-semibold">{selectedVehicle.fuelType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <p className="font-semibold">{selectedVehicle.status}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Giá bán</p>
                  <p className="text-2xl font-bold text-blue-600">{(selectedVehicle.price / 1000000).toFixed(0)} triệu VNĐ</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Tạo báo giá
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  Đặt xe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
