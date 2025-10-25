// mobile/src/constants/userRoles.ts
import { UserRole } from '@/lib/types/user';

export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; description: string }> = {
  ADMIN: {
    label: 'Admin',
    color: '#9333ea',
    description: 'Toàn quyền quản trị hệ thống',
  },
  EVM_STAFF: {
    label: 'EVM Staff',
    color: '#2563eb',
    description: 'Quản lý sản phẩm, tồn kho',
  },
  DEALER_MANAGER: {
    label: 'Dealer Manager',
    color: '#16a34a',
    description: 'Quản lý dealer và nhân viên',
  },
  DEALER_STAFF: {
    label: 'Dealer Staff',
    color: '#6b7280',
    description: 'Nhân viên bán hàng',
  },
};