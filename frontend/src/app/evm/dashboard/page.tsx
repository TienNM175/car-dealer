'use client'
import UnifiedDashboard from '@/components/shared/UnifiedDashboard';
import { useAuth } from '@/contexts/AuthContext';
import RouteGuard from '@/components/auth/RouteGuard';

export default function EVMDashboardPage() {
  const { user } = useAuth();

  return (
    <RouteGuard allowedRoles={['EVM_STAFF', 'ADMIN']}>
      <UnifiedDashboard userRole={user?.role || ''} />
    </RouteGuard>
  );
}
