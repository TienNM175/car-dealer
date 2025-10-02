'use client'
import UnifiedReports from '@/components/shared/UnifiedReports';

export default function DealerReportsPage() {
  const userRole = 'dealer_manager'; 
  return <UnifiedReports userRole={userRole} />;
}
