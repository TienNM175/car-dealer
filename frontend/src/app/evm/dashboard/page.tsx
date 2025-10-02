'use client'
import UnifiedDashboard from '@/components/shared/UnifiedDashboard';

export default function EVMDashboardPage() {
  // Lấy role từ store/context
  const userRole = 'evm_admin'; // hoặc 'evm_staff'
  
  return <UnifiedDashboard userRole={userRole} />;
}