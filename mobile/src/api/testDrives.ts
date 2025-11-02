// ============================================
// 8. src/api/testDrives.ts
// ============================================
import { apiClient } from './client';
import { TestDriveRequest, TestDriveResponse } from '../types/testDrive';

export interface TestDriveBookingResponse {
  success: boolean;
  message: string;
  data: TestDriveResponse;
}

export const testDriveApi = {
  // Đặt lịch lái thử
  bookTestDrive: async (data: TestDriveRequest) => {
    const response = await apiClient.post<TestDriveBookingResponse>(
      '/public/test-drives',
      data
    );
    return response.data;
  },
};