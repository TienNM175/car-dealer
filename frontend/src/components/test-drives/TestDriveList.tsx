'use client';

import { TestDrive } from '@/lib/types/test-drive';
import { format, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { Eye, Pencil, Plus, Clock, Car } from "lucide-react";
import { useState } from 'react';

interface TestDriveListProps {
    testDrives: TestDrive[];
    loading: boolean;
    pagination: { page: number; limit: number; total: number; totalPages: number; sortBy?: string; sortOrder?: 'asc' | 'desc' };
    onPageChange: (page: number) => void;
}

export const TestDriveList: React.FC<TestDriveListProps> = ({ testDrives, loading, pagination, onPageChange }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

    const filteredTestDrives = selectedDate
        ? testDrives.filter(d => isSameDay(new Date(d.scheduledDate), selectedDate))
        : testDrives;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Danh sách Lái thử</h2>
                <Link
                    href="/dealer/test-drive/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tạo lịch hẹn
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTestDrives.length === 0 && (
                        <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow">
                            Không có lịch lái thử nào {selectedDate ? `ngày ${format(selectedDate, 'dd/MM/yyyy')}` : ''}.
                        </div>
                    )}

                    {filteredTestDrives.map((d) => (
                        <div key={d.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Car className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{d.customer.firstName} {d.customer.lastName}</p>
                                        <p className="text-sm text-gray-600">{d.vehicle.manufacturer.name} {d.vehicle.model}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full 
                                    ${d.status === 'CONFIRMED'
                                        ? 'bg-green-100 text-green-700'
                                        : d.status === 'SCHEDULED'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : d.status === 'COMPLETED'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-red-100 text-red-700'}`}>
                                    {translateStatus(d.status)}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {format(new Date(d.scheduledDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </span>
                                {d.staff.dealer?.name && (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                        {d.staff.dealer.name}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    href={`/dealer/test-drive/${d.id}`}
                                    className="flex-1 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 text-center"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <Eye className="w-4 h-4" /> Xem chi tiết
                                    </div>
                                </Link>
                                <Link
                                    href={`/dealer/test-drive/${d.id}/edit`}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
                                >
                                    <Pencil className="w-4 h-4" /> Chỉnh sửa
                                </Link>
                            </div>
                        </div>
                    ))}





                </div>

                {/* lịch */}
                <div className="bg-white rounded-xl shadow-md p-6 self-start">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={handlePrevMonth}
                            className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                        >
                            ←
                        </button>
                        <h3 className="font-semibold text-lg">
                            Tháng {currentMonth + 1} / {currentYear}
                        </h3>
                        <button
                            onClick={handleNextMonth}
                            className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                        >
                            →
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                            <div key={day} className="font-semibold text-gray-600">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center text-sm">
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const thisDate = new Date(currentYear, currentMonth, day);
                            const hasEvent = testDrives.some(d =>
                                isSameDay(new Date(d.scheduledDate), thisDate)
                            );
                            const isSelected = selectedDate && isSameDay(thisDate, selectedDate);

                            return (
                                <div
                                    key={day}
                                    onClick={() => {
                                        setSelectedDate(thisDate);
                                        onPageChange(1);
                                    }}
                                    className={`p-2 rounded-lg cursor-pointer transition
                                        ${isSelected
                                            ? 'bg-blue-600 text-white font-bold'
                                            : hasEvent
                                                ? 'bg-blue-100 text-blue-700 font-semibold'
                                                : 'hover:bg-gray-100'}
                                    `}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>

                    {selectedDate && (
                        <button
                            onClick={() => {
                                setSelectedDate(null);
                                onPageChange(1);
                            }}
                            className="mt-4 text-sm text-blue-600 hover:underline"
                        >
                            Bỏ lọc ngày
                        </button>
                    )}
                </div>



            </div>
            <div className="grid grid-cols-3 gap-4 text-black">
                {filteredTestDrives.length > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white rounded shadow">
                        <span className="text-sm text-gray-600">
                            Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} lịch lái thử)
                        </span>
                        <div className="flex gap-1">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => onPageChange(pagination.page - 1)}
                                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => onPageChange(pagination.page + 1)}
                                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
