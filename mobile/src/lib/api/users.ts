// frontend/src/lib/api/users.ts

import api from '../utils/axiosClient';
import {
  User,
  CreateUserData,
  UpdateUserData,
  ChangePasswordData,
  UsersListResponse,
  UserResponse,
  UserRole
} from '@/lib/types/user';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  dealerId?: string;
  isActive?: boolean;
}

export const usersApi = {
  /**
   * List users with filters
   */
  list: async (params?: ListUsersParams): Promise<UsersListResponse> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  getById: async (userId: string): Promise<UserResponse> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Create new user
   */
  create: async (data: CreateUserData): Promise<UserResponse> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  /**
   * Update user
   */
  update: async (userId: string, data: UpdateUserData): Promise<UserResponse> => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * Delete user (soft delete)
   */
  delete: async (userId: string): Promise<{ success: boolean; data: { message: string } }> => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Assign user to dealer
   */
  assignToDealer: async (userId: string, dealerId: string): Promise<UserResponse> => {
    const response = await api.patch(`/users/${userId}/dealer`, { dealerId });
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (
    userId: string,
    data: ChangePasswordData
  ): Promise<{ success: boolean; data: { message: string } }> => {
    const response = await api.patch(`/users/${userId}/password`, data);
    return response.data;
  },

  /**
   * Toggle active status
   */
  toggleStatus: async (
    userId: string,
    isActive: boolean
  ): Promise<UserResponse> => {
    const response = await api.patch(`/users/${userId}/status`, { isActive });
    return response.data;
  },
};