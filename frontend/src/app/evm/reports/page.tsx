// 'use client'
// import UnifiedReports from '@/components/shared/UnifiedReports';

// export default function EVMReportsPage() {
//   const userRole = 'evm_admin'; 
//   return <UnifiedReports userRole={userRole} />;
// }




"use client";

import ReportEVM from "@/components/reports/ReportEVM";
import { useAuth } from "@/contexts/AuthContext";
import Reports from "@/components/reports/Reports";


const mapUserRole = (role: string | null | undefined) => {
  if (!role) return "evm_staff";
  switch (role) {
    case "ADMIN": return "evm_admin";
    case "EVM_ADMIN":
      return "evm_admin";
    case "EVM_STAFF":
      return "evm_staff";
    default: return "evm_staff";
  }
};

export default function EVMReportsPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Đang tải...</div>;
  if (!user) return <div>Vui lòng đăng nhập.</div>;

  const userRole = mapUserRole(user.role);

  return (
  <main className="p-8 bg-gray-50 min-h-screen">
      <Reports userRole={userRole} />
    </main>
    );
}