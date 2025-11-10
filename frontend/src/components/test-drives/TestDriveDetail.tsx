'use client';

import { TestDrive } from '@/lib/types/test-drive';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';
import { CalendarDays, User, Car, ClipboardList, Mail, Phone, MapPin, Building2, DollarSign, Info } from 'lucide-react';



interface TestDriveDetailProps {
    testDrive: TestDrive;
}

const translateStatus = (status?: string) => {
    switch (status) {
        case 'SCHEDULED': return 'Đã lên lịch';
        case 'CONFIRMED': return 'Đã xác nhận';
        case 'COMPLETED': return 'Hoàn thành';
        case 'CANCELLED': return 'Đã hủy';
        case 'NO_SHOW': return 'Không đến';
        default: return 'Không rõ';
    }
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Không có';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Không hợp lệ';
    return format(d, 'HH:mm - dd/MM/yyyy', { locale: vi });
};



export const TestDriveDetail: React.FC<TestDriveDetailProps> = ({ testDrive }) => {

    return (

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-[#111]">

            {/* --- Cột trái --- */}
            <div className="flex flex-col gap-6">
                {/* Khách hàng */}
                <Card className="shadow-md border border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-t-md flex items-center gap-2">
                        <User className="text-blue-700 w-5 h-5" />
                        <CardTitle className="text-blue-800 font-semibold">Khách hàng</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2 pt-4">
                        <p><b>Họ tên:</b> {testDrive.customer?.firstName} {testDrive.customer?.lastName}</p>
                        <p><b>Email:</b> {testDrive.customer?.email || 'Không có'}</p>
                        <p><b>Số điện thoại:</b> {testDrive.customer?.phone || 'Không có'}</p>
                        <p><b>Địa chỉ:</b> {testDrive.customer?.address || 'Không rõ'} - {testDrive.customer?.city || ''}</p>
                        {/* <p className="flex items-center gap-2">
                            <b>Trạng thái:</b>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">TEST DRIVE</span>
                        </p> */}
                        {testDrive.customer?._count && (
                            <p>
                                <b>Lịch sử:</b>{' '}
                                {testDrive.customer._count.testDrives} lái thử,{' '}
                                {testDrive.customer._count.quotations} báo giá,{' '}
                                {testDrive.customer._count.contracts} hợp đồng
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Nhân viên phụ trách */}
                <Card className="shadow-md border border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-t-md flex items-center gap-2">
                        <User className="text-blue-700 w-5 h-5" />
                        <CardTitle className="text-blue-800 font-semibold">Nhân viên phụ trách</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-4">
                        <p><b>Họ tên:</b> {testDrive.staff?.firstName ?? ''} {testDrive.staff?.lastName ?? ''}</p>
                        <p><b>Email:</b> {testDrive.staff?.email ?? 'Không có'}</p>
                        <p><b>SĐT:</b> {testDrive.staff?.phone ?? 'Không có'}</p>
                        <p><b>Đại lý:</b> {testDrive.staff?.dealer?.name ?? 'Không rõ'} ({testDrive.staff?.dealer?.city ?? ''})</p>
                        <p><b>Liên hệ:</b> {testDrive.staff?.dealer?.phone ?? ''} - {testDrive.staff?.dealer?.email ?? ''}</p>
                    </CardContent>
                </Card>
            </div>

            {/* --- Cột phải --- */}
            <div className="flex flex-col gap-6">
                {/* Thông tin buổi lái thử */}
                <Card className="shadow-md border border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-t-md flex items-center gap-2">
                        <ClipboardList className="text-blue-700 w-5 h-5" />
                        <CardTitle className="text-blue-800 font-semibold">Thông tin buổi lái thử</CardTitle>
                    </CardHeader>

                    <CardContent className="grid grid-cols-2 gap-y-2 pt-4">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-gray-600" />
                            <p><b>Ngày hẹn:</b> {formatDate(testDrive.scheduledDate)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-gray-600" />
                            <p><b>Trạng thái:</b>{' '}
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                                    {translateStatus(testDrive.status)}
                                </span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2 col-span-2">
                            <ClipboardList className="w-4 h-4 text-gray-600" />
                            <p><b>Ghi chú:</b> {testDrive.notes || 'Không có'}</p>
                        </div>

                        <div className="flex items-center gap-2 col-span-2">
                            <Info className="w-4 h-4 text-gray-600" />
                            <p><b>Phản hồi:</b> {testDrive.feedback || 'Chưa có'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Thông tin xe */}
                <Card className="shadow-md border border-gray-200 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-t-md flex items-center gap-2">
                        <Car className="text-blue-700 w-5 h-5" />
                        <CardTitle className="text-blue-800 font-semibold">Thông tin xe</CardTitle>
                    </CardHeader>

                    <CardContent className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p><b>Hãng xe:</b> {testDrive.vehicle?.manufacturer?.name ?? 'Không rõ'}</p>
                            <p><b>Mẫu xe:</b> {testDrive.vehicle?.model ?? ''} {testDrive.vehicle?.variant ?? ''}</p>
                            <p><b>Năm sản xuất:</b> {testDrive.vehicle?.year ?? 'Không rõ'}</p>
                            <p><b>Giá bán:</b> {testDrive.vehicle?.price?.toLocaleString('vi-VN') ?? 'Không rõ'} VNĐ</p>
                        </div>

                        <div className="w-1/3">
                            {testDrive.vehicle?.images?.length ? (
                                <img
                                    src={testDrive.vehicle.images[0].url}
                                    alt={testDrive.vehicle.model || 'Xe'}
                                    className="rounded-lg shadow-md w-full h-32 object-cover"
                                />
                            ) : (
                                <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">
                                    Không có hình
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
};
