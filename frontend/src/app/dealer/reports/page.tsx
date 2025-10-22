// 'use client'
// import UnifiedReports from '@/components/shared/UnifiedReports';

// export default function DealerReportsPage() {
//   const userRole = 'dealer_manager'; 
//   return <UnifiedReports userRole={userRole} />;
// }



"use client";

import ReportDealer from "@/components/reports/ReportDealer";
import { useAuth } from "@/contexts/AuthContext";

const mapUserRole = (role: string | null | undefined) => {
  if (!role) return "dealer_staff";
  switch (role) {
    case "DEALER_MANAGER": return "dealer_manager";
    default: return "dealer_staff";
  }
};

export default function DealerReportsPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Đang tải...</div>;
  if (!user) return <div>Vui lòng đăng nhập.</div>;

  const userRole = mapUserRole(user.role);

  return <ReportDealer userRole={userRole} />;
}