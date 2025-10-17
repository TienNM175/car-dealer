'use client'
import React from 'react';
import { Plus, Calendar, Clock } from 'lucide-react';

export default function AppointmentsPage() {
  const appointments = [
    { id: 1, customer: 'Nguyễn Văn A', vehicle: 'VF e34', date: '2024-10-05', time: '09:00', type: 'Lái thử', status: 'confirmed' },
    { id: 2, customer: 'Trần Thị B', vehicle: 'VF 8', date: '2024-10-05', time: '14:00', type: 'Tư vấn', status: 'pending' },
    { id: 3, customer: 'Lê Văn C', vehicle: 'VF 9', date: '2024-10-06', time: '10:00', type: 'Lái thử', status: 'confirmed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Lịch hẹn</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo lịch hẹn
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">Lịch hẹn sắp tới</h3>
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{apt.customer}</p>
                      <p className="text-sm text-gray-600">{apt.vehicle}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {apt.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {apt.date} - {apt.time}
                  </span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{apt.type}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
                    Xem chi tiết
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Xác nhận
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">Lịch tháng 10</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
              <div key={day} className="font-semibold text-gray-600">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className={`p-2 rounded-lg cursor-pointer ${day === 5 ? 'bg-blue-600 text-white font-bold' : day === 6 ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
