'use client'
import UnifiedDashboard from '@/components/shared/UnifiedDashboard';

export default function DealerDashboardPage() {
  // Lấy role từ store/context
  const userRole = 'dealer_staff'; // hoặc 'dealer_manager'
  
  return <UnifiedDashboard userRole={userRole} />;
}