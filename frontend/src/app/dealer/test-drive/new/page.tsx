'use client';

import { useRouter } from 'next/navigation';
import { TestDriveForm } from '@/components/test-drives/TestDriveForm';
import { ArrowLeft } from 'lucide-react';

export default function CreateTestDrivePage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/dealer/test-drive');
    };

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
                    Tạo đơn Lái thử
                </h1>
            </div>

            <TestDriveForm onSubmitSuccess={handleSuccess} />
        </div>
    );
}
