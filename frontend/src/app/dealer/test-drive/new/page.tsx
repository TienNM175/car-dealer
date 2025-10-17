'use client';

import { useRouter } from 'next/navigation';
import { TestDriveForm } from '@/components/test-drives/TestDriveForm';

export default function CreateTestDrivePage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/dealer/test-drive');
    };

    return (
        <div className="p-6">
            <h1 className="text-black text-3xl font-bold mb-6">Tạo đơn Lái thử</h1>
            <TestDriveForm onSubmitSuccess={handleSuccess} />
        </div>
    );
}
