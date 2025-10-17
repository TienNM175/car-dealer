'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TestDrive } from '@/lib/types/test-drive';
import { getTestDriveById } from '@/lib/api/testDriveApi';
import { TestDriveForm } from '@/components/test-drives/TestDriveForm';
import toast from 'react-hot-toast';

export default function EditTestDrivePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [testDrive, setTestDrive] = useState<TestDrive | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const data = await getTestDriveById(id);
                setTestDrive(data);
            } catch (error) {
                console.error(error);
                toast.error('Không thể tải dữ liệu lái thử');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleSuccess = () => {
        router.push('/dealer/test-drive');
    };

    if (loading) {
        return <div className="p-6">Đang tải...</div>;
    }

    if (!testDrive) {
        return <div className="p-6">Không tìm thấy buổi lái thử.</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-black text-3xl font-bold mb-6">Chỉnh sửa đơn Lái thử</h1>
            <TestDriveForm initialData={testDrive} onSubmitSuccess={handleSuccess} />
        </div>
    );
}
