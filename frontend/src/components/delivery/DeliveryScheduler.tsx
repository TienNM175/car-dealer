'use client';
import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  FileText,
  User
} from 'lucide-react';

interface DeliverySchedule {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  vehicleInfo: {
    model: string;
    variant: string;
    color: string;
    vin?: string;
  };
  deliveryType: 'REGISTRATION_STATION' | 'DEALERSHIP' | 'CUSTOMER_LOCATION';
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  inspectorName?: string;
  inspectorPhone?: string;
  documents: string[];
  notes?: string;
}

interface DeliverySchedulerProps {
  orderId?: string;
  vehicleId?: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  vehicleInfo?: {
    model: string;
    variant: string;
    color: string;
    retailPrice: number;
  };
  onScheduleCreated?: (schedule: DeliverySchedule) => void;
  compact?: boolean;
}

export default function DeliveryScheduler({
  orderId,
  vehicleId,
  customerInfo,
  vehicleInfo,
  onScheduleCreated,
  compact = false
}: DeliverySchedulerProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDeliveries, setScheduledDeliveries] = useState<DeliverySchedule[]>([]);
  
  const [formData, setFormData] = useState({
    deliveryType: 'REGISTRATION_STATION' as 'REGISTRATION_STATION' | 'DEALERSHIP' | 'CUSTOMER_LOCATION',
    scheduledDate: '',
    scheduledTime: '09:00',
    location: '',
    inspectorName: '',
    inspectorPhone: '',
    notes: '',
    documents: [] as string[]
  });

  const registrationStations = [
    { id: '1', name: 'Trạm đăng kiểm Quận 1', address: '123 Nguyễn Huệ, Quận 1, TP.HCM' },
    { id: '2', name: 'Trạm đăng kiểm Quận 7', address: '456 Nguyễn Văn Linh, Quận 7, TP.HCM' },
    { id: '3', name: 'Trạm đăng kiểm Gò Vấp', address: '789 Quang Trung, Gò Vấp, TP.HCM' }
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', 
    '13:00', '14:00', '15:00', '16:00'
  ];

  const handleScheduleDelivery = () => {
    const newSchedule: DeliverySchedule = {
      id: Date.now().toString(),
      orderId: orderId || `ORD${Date.now()}`,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      vehicleInfo: {
        model: vehicleInfo?.model || '',
        variant: vehicleInfo?.variant || '',
        color: vehicleInfo?.color || '',
        vin: `VIN${Date.now()}`
      },
      deliveryType: formData.deliveryType,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      location: formData.location,
      status: 'SCHEDULED',
      inspectorName: formData.inspectorName,
      inspectorPhone: formData.inspectorPhone,
      documents: formData.documents,
      notes: formData.notes
    };

    setScheduledDeliveries(prev => [...prev, newSchedule]);
    onScheduleCreated?.(newSchedule);
    setShowScheduler(false);
    
    setFormData({
      deliveryType: 'REGISTRATION_STATION',
      scheduledDate: '',
      scheduledTime: '09:00',
      location: '',
      inspectorName: '',
      inspectorPhone: '',
      notes: '',
      documents: []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'text-blue-600 bg-blue-100';
      case 'IN_TRANSIT': return 'text-yellow-600 bg-yellow-100';
      case 'DELIVERED': return 'text-green-600 bg-green-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Calendar className="w-4 h-4" />;
      case 'IN_TRANSIT': return <Truck className="w-4 h-4" />;
      case 'DELIVERED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            Lịch giao xe
          </h4>
          <button
            onClick={() => setShowScheduler(true)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            + Đặt lịch
          </button>
        </div>

        {scheduledDeliveries.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Chưa có lịch hẹn giao xe</p>
            <button
              onClick={() => setShowScheduler(true)}
              className="mt-2 text-blue-600 text-sm hover:text-blue-700"
            >
              Đặt lịch ngay
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledDeliveries.map((delivery) => (
              <div key={delivery.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(delivery.status)}
                    <span className="font-medium text-gray-900">
                      {new Date(delivery.scheduledDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(delivery.status)}`}>
                    {delivery.status === 'SCHEDULED' ? 'Đã lên lịch' :
                     delivery.status === 'IN_TRANSIT' ? 'Đang giao' :
                     delivery.status === 'DELIVERED' ? 'Đã giao' : 'Đã hủy'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{delivery.scheduledTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span className="flex-1">{delivery.location}</span>
                  </div>
                  {delivery.inspectorName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span>{delivery.inspectorName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showScheduler && (
          <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
              <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Đặt lịch giao xe</h3>
                <button
                  onClick={() => setShowScheduler(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình thức giao xe
                  </label>
                  <select
                    value={formData.deliveryType}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliveryType: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  >
                    <option value="REGISTRATION_STATION">Trạm đăng kiểm</option>
                    <option value="DEALERSHIP">Đại lý</option>
                    <option value="CUSTOMER_LOCATION">Địa chỉ khách hàng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa điểm giao xe
                  </label>
                  {formData.deliveryType === 'REGISTRATION_STATION' ? (
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    >
                      <option value="">Chọn trạm đăng kiểm</option>
                      {registrationStations.map(station => (
                        <option key={station.id} value={station.name}>
                          {station.name} - {station.address}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder={
                        formData.deliveryType === 'DEALERSHIP' 
                          ? 'Địa chỉ đại lý' 
                          : 'Địa chỉ khách hàng'
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày giao
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giờ hẹn
                    </label>
                    <select
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thông tin người kiểm tra
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.inspectorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, inspectorName: e.target.value }))}
                      placeholder="Họ tên người kiểm tra"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    />
                    <input
                      type="tel"
                      value={formData.inspectorPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, inspectorPhone: e.target.value }))}
                      placeholder="Số điện thoại"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Ghi chú cho lịch hẹn..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 p-6 border-t border-gray-200">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowScheduler(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleScheduleDelivery}
                    disabled={!formData.scheduledDate || !formData.location}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Xác nhận lịch hẹn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-800">Lịch trình giao xe</h3>
        </div>
        <button
          onClick={() => setShowScheduler(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Tạo lịch giao xe
        </button>
      </div>

      <div className="text-center py-8 text-gray-500">
        Phiên bản đầy đủ của Delivery Scheduler sẽ được triển khai...
      </div>
    </div>
  );
}