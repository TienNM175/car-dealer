'use client'
import UnifiedReports from '@/components/shared/UnifiedReports';

export default function EVMReportsPage() {
  const userRole = 'evm_admin'; 
  return <UnifiedReports userRole={userRole} />;
}