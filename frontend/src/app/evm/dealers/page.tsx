'use client'
import React from 'react';
import { Plus, Users, MapPin, Phone, Edit } from 'lucide-react';

export default function DealersPage() {
  const mockDealers = [
    { id: 1, name: 'Đại lý Hà Nội', region: 'Miền Bắc', address: 'Hà Nội', phone: '024 1234 5678', sales: 150, target: 200 },
    { id: 2, name: 'Đại lý TP.HCM', region: 'Miền Nam', address: 'TP.HCM', phone: '028 1234 5678', sales: 180, target: 200 },
    { id: 3, name: 'Đại lý Đà Nẵng', region: 'Miền Trung', address: 'Đà Nẵng', phone: '0236 1234 567', sales: 90, target: 150 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý đại lý</h2>
        <button
          aria-label="Thêm đại lý"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Thêm đại lý
        </button>
      </div>

      {/* Dealer cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-black">
        {mockDealers.map((dealer) => (
          <div key={dealer.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {dealer.region}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-2">{dealer.name}</h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {dealer.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" aria-hidden="true" />
                {dealer.phone}
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Doanh số</span>
                <span className="font-semibold">
                  {dealer.sales}/{dealer.target} xe
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${dealer.sales >= dealer.target ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${(dealer.sales / dealer.target) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                aria-label={`Xem chi tiết ${dealer.name}`}
                className="flex-1 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Xem chi tiết
              </button>
              <button
                aria-label={`Chỉnh sửa ${dealer.name}`}
                className="p-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
              >
                <Edit className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
