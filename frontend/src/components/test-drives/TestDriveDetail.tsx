'use client';

import { TestDrive } from '@/lib/types/test-drive';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-black">
            <Card>
                <CardHeader><CardTitle>Khách hàng</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-black">
                    <p><b>Họ tên:</b> {testDrive.customer?.firstName} {testDrive.customer?.lastName}</p>
                    <p><b>Email:</b> {testDrive.customer?.email || 'Không có'}</p>
                    <p><b>SĐT:</b> {testDrive.customer?.phone || 'Không có'}</p>
                    <p><b>Địa chỉ:</b> {testDrive.customer?.address || 'Không rõ'} - {testDrive.customer?.city || ''}</p>
                    <p><b>Trạng thái:</b> {testDrive.customer?.status || 'Không rõ'}</p>

                    {testDrive.customer?._count && (
                        <p>
                            <b>Lịch sử:</b>{" "}
                            {testDrive.customer._count.testDrives} lái thử,{" "}
                            {testDrive.customer._count.quotations} báo giá,{" "}
                            {testDrive.customer._count.contracts} hợp đồng
                        </p>
                    )}
                </CardContent>
            </Card>



            <Card>
                <CardHeader><CardTitle>Xe</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <p><b>Hãng:</b> {testDrive.vehicle?.manufacturer?.name ?? 'Không rõ'}</p>
                    <p><b>Mẫu:</b> {testDrive.vehicle?.model ?? ''} {testDrive.vehicle?.variant ?? ''}</p>
                    <p><b>Năm:</b> {testDrive.vehicle?.year ?? 'Không rõ'}</p>
                    <p><b>Giá:</b> {testDrive.vehicle?.price?.toLocaleString('vi-VN') ?? 'Không rõ'} VNĐ</p>
                    {testDrive.vehicle?.images?.length
                        ? testDrive.vehicle.images.map(img => (
                            <img key={img.id} src={img.url} alt="Xe" className="h-20 rounded" />
                        ))
                        : <p>Không có hình ảnh</p>
                    }
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Nhân viên</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <p><b>Họ tên:</b> {testDrive.staff?.firstName ?? ''} {testDrive.staff?.lastName ?? ''}</p>
                    <p><b>Email:</b> {testDrive.staff?.email ?? 'Không có'}</p>
                    <p><b>SĐT:</b> {testDrive.staff?.phone ?? 'Không có'}</p>
                    <p><b>Đại lý:</b> {testDrive.staff?.dealer?.name ?? 'Không rõ'} ({testDrive.staff?.dealer?.city ?? ''})</p>
                    <p><b>Liên hệ:</b> {testDrive.staff?.dealer?.phone ?? ''} - {testDrive.staff?.dealer?.email ?? ''}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Thông tin buổi lái thử</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <p><b>Ngày hẹn:</b> {formatDate(testDrive.scheduledDate)}</p>
                    <p><b>Trạng thái:</b> {translateStatus(testDrive.status)}</p>
                    <p><b>Ghi chú:</b> {testDrive.notes || 'Không có'}</p>
                    <p><b>Phản hồi:</b> {testDrive.feedback || 'Chưa có'}</p>
                </CardContent>
            </Card>
        </div>
    );
};
