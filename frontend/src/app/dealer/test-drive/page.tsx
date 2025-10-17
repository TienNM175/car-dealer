'use client';

import { useState, useEffect } from 'react';
import { getTestDrives } from '@/lib/api/testDriveApi';
import { TestDrive, TestDriveFilters, TestDriveListResponse } from '@/lib/types/test-drive';
import { TestDriveList } from '@/components/test-drives/TestDriveList';
import { TestDriveFiltersForm } from '@/components/test-drives/TestDriveFiltersFrom';
import toast from 'react-hot-toast';

export default function TestDrivePage() {
    const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1, limit: 10, total: 0, totalPages: 0, sortBy: 'scheduledDate', sortOrder: 'desc' as 'asc' | 'desc'
    });
    const [filters, setFilters] = useState<TestDriveFilters>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res: TestDriveListResponse = await getTestDrives(filters, pagination);
            setTestDrives(res.data);
            setPagination(prev => ({ ...prev, total: res.meta.total, totalPages: res.meta.totalPages }));
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải danh sách lái thử");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filters, pagination.page, pagination.sortBy, pagination.sortOrder]);

    return (
        <div className="space-y-6">
            <h1 className="text-black text-2xl font-bold">Quản lý Lịch hẹn Lái thử</h1>
            <TestDriveFiltersForm onFilterChange={setFilters} />
            <TestDriveList
                testDrives={testDrives}
                loading={loading}
                pagination={pagination}
                onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                onSort={(s) => setPagination(prev => ({
                    ...prev,
                    sortBy: s,
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                }))}
            />
        </div>
    );
}
