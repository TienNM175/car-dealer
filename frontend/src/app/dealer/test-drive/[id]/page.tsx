'use client';

import { useEffect, useState } from 'react';
import { getTestDriveById } from '@/lib/api/testDriveApi';
import { TestDrive } from '@/lib/types/test-drive';
import { TestDriveDetail } from '@/components/test-drives/TestDriveDetail';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TestDriveDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [testDrive, setTestDrive] = useState<TestDrive | null>(null);

    // useEffect(() => {
    //     (async () => {
    //         try {
    //             const res = await getTestDriveById(id);
    //             setTestDrive(res);
    //         } catch (err) {
    //             toast.error("Không tìm thấy lịch hẹn này");
    //         }
    //     })();
    // }, [id]);

    useEffect(() => {
        (async () => {
            try {
                const data = await getTestDriveById(id);
                setTestDrive(data);
            } catch (err) {
                toast.error("Không tìm thấy lịch hẹn này");
            }
        })();
    }, [id]);




    if (!testDrive) return <div>Đang tải...</div>;

    return (
        <div>
            <h1 className="text-black text-2xl font-bold mb-4">Chi tiết Lái thử</h1>
            <TestDriveDetail testDrive={testDrive} />
        </div>
    );
}
