'use client';

import { useEffect, useState } from 'react';
import { getTestDriveById } from '@/lib/api/testDriveApi';
import { TestDrive } from '@/lib/types/test-drive';
import { TestDriveDetail } from '@/components/test-drives/TestDriveDetail';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';


export default function TestDriveDetailPage() {
    const router = useRouter();
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
        <div className="space-y-4">
            <div className="relative mb-4 flex items-center justify-center">
                {/* Nút quay lại ở góc trái */}
                <button
                    onClick={() => router.back()}
                    className="absolute left-0 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Quay lại
                </button>

                {/* Tiêu đề căn giữa */}
                <h1 className="text-black text-2xl font-bold text-center">
                    Chi tiết Lái thử
                </h1>
            </div>


            <TestDriveDetail testDrive={testDrive} />
        </div>
    );

}
