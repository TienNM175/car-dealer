// src/lib/helpers/index.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Gộp các class names của Tailwind CSS một cách thông minh,
 * ưu tiên class cuối cùng nếu có xung đột.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Bạn có thể thêm các hàm helper khác ở đây
// Ví dụ: formatCurrency, formatDate, v.v.
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}


export function buildQueryParams(params: Record<string, string | number | boolean | null | undefined>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    return searchParams.toString();
}

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
