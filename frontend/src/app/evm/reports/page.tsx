// 'use client'
// import UnifiedReports from '@/components/shared/UnifiedReports';

// export default function EVMReportsPage() {
//   const userRole = 'evm_admin'; 
//   return <UnifiedReports userRole={userRole} />;
// }




"use client";

import ReportEVM from "@/components/reports/ReportEVM";
import { useAuth } from "@/contexts/AuthContext";

const mapUserRole = (role: string | null | undefined) => {
  if (!role) return "evm_staff";
  switch (role) {
    case "ADMIN": return "evm_admin";
    default: return "evm_staff";
  }
};

export default function EVMReportsPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Đang tải...</div>;
  if (!user) return <div>Vui lòng đăng nhập.</div>;

  const userRole = mapUserRole(user.role);

  return <ReportEVM userRole={userRole} />;
}