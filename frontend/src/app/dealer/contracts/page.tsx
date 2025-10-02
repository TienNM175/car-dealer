'use client'
import React from 'react';
import { Plus, FileText, CheckCircle, Clock, XCircle, Download } from 'lucide-react';

export default function ContractsPage() {
  const mockContracts = [
    { id: 'CT001', customer: 'Nguyễn Văn A', vehicle: 'VF e34', price: 690000000, discount: 10000000, finalPrice: 680000000, status: 'SIGNED', paymentType: 'FULL', signedAt: '2024-10-01' },
    { id: 'CT002', customer: 'Trần Thị B', vehicle: 'VF 8', price: 1050000000, discount: 20000000, finalPrice: 1030000000, status: 'PENDING', paymentType: 'INSTALLMENT', installmentMonths: 60 },
    { id: 'CT003', customer: 'Lê Văn C', vehicle: 'VF 9', price: 1500000000, discount: 50000000, finalPrice: 1450000000, status: 'DRAFT', paymentType: 'INSTALLMENT', installmentMonths: 120 },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SIGNED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      DRAFT: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'SIGNED') return <CheckCircle className="w-4 h-4" aria-hidden="true" />;
    if (status === 'PENDING') return <Clock className="w-4 h-4" aria-hidden="true" />;
    if (status === 'CANCELLED') return <XCircle className="w-4 h-4" aria-hidden="true" />;
    return null;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SIGNED: 'Đã ký',
      PENDING: 'Chờ duyệt',
      DRAFT: 'Nháp',
      CANCELLED: 'Đã hủy',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý hợp đồng</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          aria-label="Tạo hợp đồng mới"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Tạo hợp đồng mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Tổng hợp đồng</p>
          <p className="text-2xl font-bold text-gray-900">128</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Đã ký</p>
          <p className="text-2xl font-bold text-green-600">85</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Chờ duyệt</p>
          <p className="text-2xl font-bold text-yellow-600">28</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Nháp</p>
          <p className="text-2xl font-bold text-gray-600">15</p>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-4 text-black">
          {mockContracts.map((contract) => (
            <div
              key={contract.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Hợp đồng #{contract.id}</h3>
                    <p className="text-sm text-gray-600">Khách hàng: {contract.customer}</p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(
                    contract.status
                  )}`}
                >
                  {getStatusIcon(contract.status)}
                  <span className="text-sm font-medium">{getStatusLabel(contract.status)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Xe</p>
                  <p className="font-semibold">{contract.vehicle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Giá gốc</p>
                  <p className="font-semibold">{(contract.price / 1000000).toFixed(0)}M VNĐ</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Chiết khấu</p>
                  <p className="font-semibold text-red-600">
                    -{(contract.discount / 1000000).toFixed(0)}M VNĐ
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tổng thanh toán</p>
                  <p className="font-bold text-blue-600">
                    {(contract.finalPrice / 1000000).toFixed(0)}M VNĐ
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full ${
                      contract.paymentType === 'FULL'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {contract.paymentType === 'FULL'
                      ? 'Trả thẳng'
                      : `Trả góp ${contract.installmentMonths} tháng`}
                  </span>
                  {contract.signedAt && (
                    <span className="text-gray-600">Ký ngày: {contract.signedAt}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                    aria-label={`Xem chi tiết hợp đồng ${contract.id}`}
                  >
                    Xem chi tiết
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    aria-label={`Tải hợp đồng ${contract.id}`}
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Tải xuống
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
