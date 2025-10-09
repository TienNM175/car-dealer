// src/app/evm/ai-insights/page.tsx
'use client'
import AdminAIDashboard from '@/components/admin/AdminAIDashboard';
import { useAuth } from '@/contexts/AuthContext';
import RouteGuard from '@/components/auth/RouteGuard';

export default function AIInsightsPage() {
  const { user } = useAuth();

  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <div>
        <AdminAIDashboard />
      </div>
    </RouteGuard>
  );
}