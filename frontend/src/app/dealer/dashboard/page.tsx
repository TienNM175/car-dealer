'use client'
import UnifiedDashboard from '@/components/shared/UnifiedDashboard';
import { useAuth } from '@/contexts/AuthContext';
import RouteGuard from '@/components/auth/RouteGuard';

export default function DealerDashboardPage() {
  const { user } = useAuth();

  return (
    <RouteGuard allowedRoles={['DEALER_STAFF', 'DEALER_MANAGER']}>
      <UnifiedDashboard userRole={user?.role || ''} />
    </RouteGuard>
  );
}
