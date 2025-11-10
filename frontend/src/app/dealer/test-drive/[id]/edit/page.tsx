'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TestDrive } from '@/lib/types/test-drive';
import { getTestDriveById } from '@/lib/api/testDriveApi';
import { TestDriveForm } from '@/components/test-drives/TestDriveForm';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

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
        <div className="p-6 space-y-6">
            {/* Header có nút quay lại và tiêu đề căn giữa */}
            <div className="relative mb-6 flex items-center justify-center">
                <button
                    onClick={() => router.back()}
                    className="absolute left-0 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Quay lại
                </button>

                <h1 className="text-black text-3xl font-bold text-center">
                    Chỉnh sửa đơn Lái thử
                </h1>
            </div>

            <TestDriveForm initialData={testDrive} onSubmitSuccess={handleSuccess} />
        </div>
    );
}
