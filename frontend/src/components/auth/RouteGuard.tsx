'use client'
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      // Chưa đăng nhập
      if (!isAuthenticated) {
        router.push(`/login?redirect=${pathname}`);
        return;
      }

      // Đã đăng nhập nhưng không có quyền
      if (allowedRoles && user && !allowedRoles.includes(user.role!)) {
        router.push('/unauthorized');
        return;
      }

      // Check role-based routing
      if (user) {
        const isEVMUser = user.role?.startsWith('evm');
        const isDealerUser = user.role?.startsWith('dealer');
        const isEVMRoute = pathname.startsWith('/evm');
        const isDealerRoute = pathname.startsWith('/dealer');

        // EVM user trying to access dealer route
        if (isEVMUser && isDealerRoute) {
          router.push('/evm/dashboard');
          return;
        }

        // Dealer user trying to access EVM route
        if (isDealerUser && isEVMRoute) {
          router.push('/dealer/dashboard');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, pathname, router]);

  // Show loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // No permission
  if (allowedRoles && user && !allowedRoles.includes(user.role!)) {
    return null;
  }

  return <>{children}</>;
}