'use client';

import { useState } from 'react';
import { TestDriveFilters } from '@/lib/types/test-drive';
import { Button } from '@/components/shared/button';

interface TestDriveFiltersFormProps {
    onFilterChange: (filters: TestDriveFilters) => void;
}

export const TestDriveFiltersForm: React.FC<TestDriveFiltersFormProps> = ({ onFilterChange }) => {
    const [filters, setFilters] = useState<TestDriveFilters>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value || undefined }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange(filters);
    };

    const handleClearFilters = () => {
        setFilters({});
        onFilterChange({});
        const form = document.getElementById('testdrive-filter-form') as HTMLFormElement;
        form?.reset();
    };

    return (
        <form
            id="testdrive-filter-form"
            onSubmit={handleSubmit}
            className="bg-white p-6 shadow rounded-lg space-y-4 text-black"
        >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                    name="search"
                    placeholder="Tìm kiếm khách hàng..."
                    onChange={handleInputChange}
                    className="px-3 py-3 border rounded-md text-black w-full"
                />

                <select
                    name="status"
                    onChange={handleInputChange}
                    className="px-3 py-3 border rounded-md text-black w-full"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="SCHEDULED">Đã lên lịch</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="NO_SHOW">Không đến</option>
                </select>

                <input
                    type="date"
                    name="fromDate"
                    onChange={handleInputChange}
                    className="px-3 py-3 border rounded-md text-black w-full"
                />

                <input
                    type="date"
                    name="toDate"
                    onChange={handleInputChange}
                    className="px-3 py-3 border rounded-md text-black w-full"
                />

                <input
                    type="text"
                    name="customerId"
                    placeholder="Mã khách hàng"
                    onChange={handleInputChange}
                    className="px-3 py-3 border rounded-md text-black w-full"
                />
                <input
                    type="text"
                    name="vehicleId"
                    placeholder="Mã xe"
                    onChange={handleInputChange}
                    className="px-3 py-3 border rounded-md text-black w-full"
                />
                <input
                    type="text"
                    name="staffId"
                    placeholder="Mã nhân viên"
                    onChange={handleInputChange}
                    className="px-3 py-3 border rounded-md text-black w-full"
                />
            </div>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    onClick={handleClearFilters}
                    className="bg-gray-200 hover:bg-gray-300 text-black border border-gray-300"
                >
                    Bỏ lọc tất cả
                </Button>

                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Lọc
                </Button>
            </div>
        </form>
    );
};
