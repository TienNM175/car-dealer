'use client';

import { TestDrive } from '@/lib/types/test-drive';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { Eye, Pencil, Plus } from "lucide-react";

interface TestDriveListProps {
    testDrives: TestDrive[];
    loading: boolean;
    pagination: { page: number; limit: number; total: number; totalPages: number; sortBy?: string; sortOrder?: 'asc' | 'desc' };
    onPageChange: (page: number) => void;
    onSort: (sortBy: string) => void;
}

export const TestDriveList: React.FC<TestDriveListProps> = ({ testDrives, loading, pagination, onPageChange, onSort }) => {
    const SortableHeader = ({ label, sortBy }: { label: string; sortBy: string }) => (
        <th
            className="px-4 py-2 cursor-pointer text-white font-semibold"
            onClick={() => onSort(sortBy)}
        >
            {label}{pagination.sortBy === sortBy && <span>{pagination.sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>}
        </th>
    );

    const translateStatus = (status: string): string => {
        switch (status) {
            case "SCHEDULED": return "Đã lên lịch";
            case "CONFIRMED": return "Đã xác nhận";
            case "COMPLETED": return "Hoàn thành";
            case "CANCELLED": return "Đã hủy";
            case "NO_SHOW": return "Không đến";
            default: return status;
        }
    };

    if (loading) return <div className="p-4 text-center">Đang tải...</div>;

    return (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold text-black">Danh sách Lái thử</h2>
                <Link
                    href="/dealer/test-drive/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                >
                    <Plus className="w-5 h-5" />
                    <span>Tạo mới</span>
                </Link>
            </div>

            <table className="min-w-full divide-y text-black">
                <thead style={{ backgroundColor: "#1D6BFF" }}>
                    <tr>
                        <SortableHeader label="Khách hàng" sortBy="customer.lastName" />
                        <th className="p-3 text-white font-semibold">Email KH</th>
                        <SortableHeader label="Xe" sortBy="vehicle.model" />
                        <th className="p-3 text-white font-semibold">Ảnh</th>
                        <SortableHeader label="Nhân viên" sortBy="staff.lastName" />
                        <th className="p-3 text-white font-semibold">Đại lý</th>
                        <SortableHeader label="Ngày hẹn" sortBy="scheduledDate" />
                        <th className="p-3 text-white font-semibold">Trạng thái</th>
                        <th className="p-3 text-white font-semibold">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {testDrives.map((d) => (
                        <tr key={d.id} className="whitespace-normal break-words">
                            <td className="p-3">{d.customer.firstName} {d.customer.lastName}</td>
                            <td className="p-3">{d.customer.email}</td>
                            <td className="p-3">{d.vehicle.manufacturer.name} {d.vehicle.model}</td>
                            <td className="p-3">
                                {d.vehicle.images?.[0]?.url && (
                                    <img src={d.vehicle.images[0].url} alt="Xe" className="h-10 rounded" />
                                )}
                            </td>
                            <td className="p-3">{d.staff.firstName} {d.staff.lastName}</td>
                            <td className="p-3">{d.staff.dealer?.name}</td>
                            <td className="p-3">
                                {format(new Date(d.scheduledDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </td>
                            <td className="p-3">{translateStatus(d.status)}</td>
                            <td className="p-3">
                                <div className="flex gap-4">
                                    <Link
                                        href={`/dealer/test-drive/${d.id}`}
                                        className="text-blue-600 hover:text-blue-800 relative group"
                                    >
                                        <Eye className="w-5 h-5" />
                                        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 
                                            bg-black text-white text-xs rounded px-2 py-1 opacity-0 
                                            group-hover:opacity-100 transition whitespace-nowrap">
                                            Xem chi tiết
                                        </span>
                                    </Link>
                                    <Link
                                        href={`/dealer/test-drive/${d.id}/edit`}
                                        className="text-green-600 hover:text-green-800 relative group"
                                    >
                                        <Pencil className="w-5 h-5" />
                                        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 
                                            bg-black text-white text-xs rounded px-2 py-1 opacity-0 
                                            group-hover:opacity-100 transition whitespace-nowrap">
                                            Chỉnh sửa
                                        </span>
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
