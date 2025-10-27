'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';
import { TestDrive, Customer, Vehicle, User } from '@/lib/types/test-drive';
import { createTestDrive, updateTestDrive } from '@/lib/api/testDriveApi';
import { customerApi } from '@/lib/api/customerApi';
import { vehicleApi } from '@/lib/api/vehicleApi';
import { usersApi } from '@/lib/api/users';
import { Button } from '@/components/shared/button';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

const testDriveSchema = z.object({
    customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
    vehicleId: z.string().min(1, 'Vui lòng chọn xe'),
    staffId: z.string().min(1, 'Vui lòng chọn nhân viên'),
    scheduledDate: z
        .string()
        .min(1, 'Vui lòng chọn ngày hẹn')
        .refine((value) => new Date(value) > new Date(), {
            message: 'Ngày hẹn phải ở tương lai',
        }),
    notes: z.string().optional(),
});

type TestDriveFormData = z.infer<typeof testDriveSchema>;

interface TestDriveFormProps {
    initialData?: TestDrive;
    onSubmitSuccess: () => void;
}

export const TestDriveForm: React.FC<TestDriveFormProps> = ({
    initialData,
    onSubmitSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [staff, setStaff] = useState<User[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<TestDriveFormData>({
        resolver: zodResolver(testDriveSchema),
        defaultValues: initialData
            ? {
                customerId: initialData.customerId,
                vehicleId: initialData.vehicleId,
                staffId: initialData.staffId,
                scheduledDate: initialData.scheduledDate
                    ? new Date(initialData.scheduledDate).toISOString().slice(0, 16)
                    : '',
                notes: initialData.notes ?? '',
            }
            : {},
    });

    const normalizeResponse = (res: any) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.data) {
            if (Array.isArray(res.data)) return res.data;
            if (res.data.data) return res.data.data;
        }
        return [];
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersRes, vehiclesRes, staffRes] = await Promise.all([
                    customerApi.getAllCustomers(),
                    vehicleApi.getAllVehicles(),
                    usersApi.list(),
                ]);

                setCustomers(normalizeResponse(customersRes));
                setVehicles(normalizeResponse(vehiclesRes));
                setStaff(normalizeResponse(staffRes));
            } catch (error) {
                console.error('Failed to fetch form data:', error);
                toast.error('Không thể tải dữ liệu cho biểu mẫu.');
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setValue('customerId', initialData.customerId ?? '');
            setValue('vehicleId', initialData.vehicleId ?? '');
            setValue('staffId', initialData.staffId ?? '');
        }
    }, [initialData, setValue]);

    const onSubmit = async (data: TestDriveFormData) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                scheduledDate: data.scheduledDate
                    ? new Date(data.scheduledDate).toISOString()
                    : undefined,
            };
            if (initialData) {
                await updateTestDrive(initialData.id, payload);
                toast.success('Cập nhật thành công!');
            } else {
                await createTestDrive(payload);
                toast.success('Tạo mới thành công!');
            }
            reset();
            onSubmitSuccess();
        } catch (error: unknown) {
            let errorMessage = 'Đã có lỗi xảy ra.';
            if (error instanceof AxiosError)
                errorMessage = error.response?.data?.message || errorMessage;
            else if (error instanceof Error) errorMessage = error.message;
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 p-6 bg-white shadow rounded-lg text-black"
        >
            {/* Khách hàng */}
            <div>
                <label className="block text-base font-semibold">Khách hàng</label>
                <Select
                    options={
                        customers.length > 0
                            ? customers.map((c) => ({
                                value: c.id,
                                label: (
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {c.firstName} {c.lastName}
                                        </span>
                                        <span className="text-sm text-gray-600">{c.email}</span>
                                    </div>
                                ),
                            }))
                            : ([{ value: '', label: 'Không có dữ liệu', isDisabled: true }] as any)
                    }
                    defaultValue={
                        initialData
                            ? {
                                value: initialData.customerId,
                                label: (
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {initialData.customer?.firstName}{' '}
                                            {initialData.customer?.lastName}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {initialData.customer?.email}
                                        </span>
                                    </div>
                                ),
                            }
                            : null
                    }
                    onChange={(option) => setValue('customerId', option?.value || '')}
                    className="mt-2"
                />
                {errors.customerId && (
                    <p className="text-red-600 text-sm mt-1">
                        {errors.customerId.message}
                    </p>
                )}
            </div>

            {/* Xe */}
            <div>
                <label className="block text-base font-semibold">Xe</label>
                <Select
                    options={
                        vehicles.length > 0
                            ? vehicles.map((v) => ({
                                value: v.id,
                                label: (
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {v.manufacturer?.name} {v.model}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {v.variant || ''}
                                        </span>
                                    </div>
                                ),
                            }))
                            : ([{ value: '', label: 'Không có dữ liệu', isDisabled: true }] as any)
                    }
                    defaultValue={
                        initialData
                            ? {
                                value: initialData.vehicleId,
                                label: (
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {initialData.vehicle?.manufacturer?.name}{' '}
                                            {initialData.vehicle?.model}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {initialData.vehicle?.variant || ''}
                                        </span>
                                    </div>
                                ),
                            }
                            : null
                    }
                    onChange={(option) => setValue('vehicleId', option?.value || '')}
                    className="mt-2"
                />
                {errors.vehicleId && (
                    <p className="text-red-600 text-sm mt-1">
                        {errors.vehicleId.message}
                    </p>
                )}
            </div>

            {/* Nhân viên */}
            <div>
                <label className="block text-base font-semibold">Nhân viên phụ trách</label>
                <Select
                    options={
                        staff.length > 0
                            ? staff.map((s) => ({
                                value: s.id,
                                label: (
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {s.firstName} {s.lastName}
                                        </span>
                                        <span className="text-sm text-gray-600">{s.email}</span>
                                    </div>
                                ),
                            }))
                            : ([{ value: '', label: 'Không có dữ liệu', isDisabled: true }] as any)
                    }
                    defaultValue={
                        initialData
                            ? {
                                value: initialData.staffId,
                                label: (
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {initialData.staff?.firstName}{' '}
                                            {initialData.staff?.lastName}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {initialData.staff?.email}
                                        </span>
                                    </div>
                                ),
                            }
                            : null
                    }
                    onChange={(option) => setValue('staffId', option?.value || '')}
                    className="mt-2"
                />
                {errors.staffId && (
                    <p className="text-red-600 text-sm mt-1">{errors.staffId.message}</p>
                )}
            </div>

            {/* Ngày hẹn */}
            <div>
                <label className="block text-base font-semibold">Ngày hẹn</label>
                <input
                    type="datetime-local"
                    {...register('scheduledDate')}
                    className="mt-2 block w-full border rounded-md p-3 text-black"
                />
                {errors.scheduledDate && (
                    <p className="text-red-600 text-sm mt-1">
                        {errors.scheduledDate.message}
                    </p>
                )}
            </div>

            {/* Ghi chú */}
            <div>
                <label className="block text-base font-semibold">Ghi chú</label>
                <textarea
                    {...register('notes')}
                    rows={3}
                    className="mt-2 block w-full border rounded-md p-3 text-black"
                />
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
                </Button>
            </div>
        </form>
    );
};
