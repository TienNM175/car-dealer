// 'use client'
// import UnifiedReports from '@/components/shared/UnifiedReports';

// export default function DealerReportsPage() {
//   const userRole = 'dealer_manager'; 
//   return <UnifiedReports userRole={userRole} />;
// }



"use client";

import ReportDealer from "@/components/reports/ReportDealer";
import { useAuth } from "@/contexts/AuthContext";
import Reports from "@/components/reports/Reports";

const mapUserRole = (role: string | null | undefined) => {
  if (!role) return "dealer_staff";
  switch (role) {
    case "DEALER_MANAGER": return "dealer_manager";
    case "EVM_ADMIN": return "evm_admin";
    case "EVM_STAFF": return "evm_staff";
    default: return "dealer_staff";
  }
};

export default function DealerReportsPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Đang tải...</div>;
  if (!user) return <div>Vui lòng đăng nhập.</div>;

  const userRole = mapUserRole(user.role);
  const userId = user?.id;
  const dealerId = user?.dealerId;


  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <Reports userRole={userRole} userId={userId} dealerId={dealerId} />
    </main>
  );
}