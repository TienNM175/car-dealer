// src/lib/api/testDriveApi.ts

import axiosClient from '@/lib/utils/axiosClient';
import {
    TestDrive,
    TestDriveFilters,
    PaginationParams,
    TestDriveListResponse,
    TestDriveStatus,
    TestDriveStats,
} from '@/lib/types/test-drive';
import { buildQueryParams } from '@/lib/helpers/index';

export const getTestDrives = async (
    filters: TestDriveFilters,
    pagination: PaginationParams
): Promise<TestDriveListResponse> => {
    const allParams = { ...filters, ...pagination };
    const response = await axiosClient.get(
        `/test-drives?${buildQueryParams(allParams)}`
    );
    return {
        data: response.data.data,
        meta: response.data.meta,
    };
};

export const getTestDriveById = async (id: string): Promise<TestDrive> => {
    const response = await axiosClient.get(`/test-drives/${id}`);
    return response.data.data;
};
export const createTestDrive = async (
    data: Partial<TestDrive>
): Promise<TestDrive> => {
    const response = await axiosClient.post('/test-drives', data);
    return response.data.data;
};
export const updateTestDrive = async (
    id: string,
    data: Partial<TestDrive>
): Promise<TestDrive> => {
    const response = await axiosClient.put(`/test-drives/${id}`, data);
    return response.data.data;
};
export const updateTestDriveStatus = async (
    id: string,
    status: TestDriveStatus,
    feedback?: string
): Promise<TestDrive> => {
    const response = await axiosClient.patch(`/test-drives/${id}/status`, {
        status,
        feedback,
    });
    return response.data.data;
};
export const cancelTestDrive = async (
    id: string,
    reason: string
): Promise<TestDrive> => {
    const response = await axiosClient.post(`/test-drives/${id}/cancel`, {
        reason,
    });
    return response.data.data;
};
type TestDriveStatsFilters = {
    dealerId?: string;
    staffId?: string;
    fromDate?: string;
    toDate?: string;
};

export const getTestDriveStatistics = async (
    filters?: TestDriveStatsFilters
): Promise<TestDriveStats> => {
    const response = await axiosClient.get(
        `/test-drives/statistics?${buildQueryParams(filters || {})}`
    );
    return response.data.data;
};
export const getTestDrivesByStatus = async (
    dealerId?: string
): Promise<{ status: string; count: number }[]> => {
    const response = await axiosClient.get(
        `/test-drives/by-status?${buildQueryParams({ dealerId })}`
    );
    return response.data.data;
};
export const getUpcomingTestDrives = async (
    dealerId?: string,
    staffId?: string
): Promise<TestDrive[]> => {
    const response = await axiosClient.get(
        `/test-drives/upcoming?${buildQueryParams({ dealerId, staffId })}`
    );
    return response.data.data;
};






// // src/lib/api/testDriveApi.ts

// import axiosClient from '@/lib/utils/axiosClient';
// import {
//     TestDrive,
//     TestDriveFilters,
//     PaginationParams,
//     TestDriveListResponse,
//     TestDriveStatus,
//     TestDriveStats
// } from '@/lib/types/test-drive';
// import { buildQueryParams } from '@/lib/helpers/index';

// export const getTestDrives = async (filters: TestDriveFilters, pagination: PaginationParams): Promise<TestDriveListResponse> => {
//     const allParams = { ...filters, ...pagination };
//     const response = await axiosClient.get(`/test-drives?${buildQueryParams(allParams)}`);
//     return response.data;
// };

// export const getTestDriveById = async (id: string): Promise<TestDrive> => {
//     const response = await axiosClient.get(`/test-drives/${id}`);
//     return response.data.data;
// };


// export const createTestDrive = async (data: Partial<TestDrive>): Promise<TestDrive> => {
//     const response = await axiosClient.post('/test-drives', data);
//     return response.data;
// };

// export const updateTestDrive = async (id: string, data: Partial<TestDrive>): Promise<TestDrive> => {
//     const response = await axiosClient.put(`/test-drives/${id}`, data);
//     return response.data;
// };

// export const updateTestDriveStatus = async (id: string, status: TestDriveStatus, feedback?: string): Promise<TestDrive> => {
//     const response = await axiosClient.patch(`/test-drives/${id}/status`, { status, feedback });
//     return response.data;
// };

// export const cancelTestDrive = async (id: string, reason: string): Promise<TestDrive> => {
//     const response = await axiosClient.post(`/test-drives/${id}/cancel`, { reason });
//     return response.data;
// };

// export const getTestDriveStatistics = async (filters?: { dealerId?: string; staffId?: string; fromDate?: string; toDate?: string }): Promise<TestDriveStats> => {
//     const response = await axiosClient.get(`/test-drives/statistics?${buildQueryParams(filters || {})}`);
//     return response.data;
// };

// export const getTestDrivesByStatus = async (dealerId?: string): Promise<{ status: string; count: number }[]> => {
//     const params = { dealerId };
//     const response = await axiosClient.get(`/test-drives/by-status?${buildQueryParams(params)}`);
//     return response.data;
// };

// export const getUpcomingTestDrives = async (dealerId?: string, staffId?: string): Promise<TestDrive[]> => {
//     const params = { dealerId, staffId };
//     const response = await axiosClient.get(`/test-drives/upcoming?${buildQueryParams(params)}`);
//     return response.data;
// };
