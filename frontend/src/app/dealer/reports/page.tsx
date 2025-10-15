// 'use client'
// import UnifiedReports from '@/components/shared/UnifiedReports';

// export default function DealerReportsPage() {
//   const userRole = 'dealer_manager'; 
//   return <UnifiedReports userRole={userRole} />;
// }

"use client";

import Reports, { ReportsUserRole } from "@/components/reports/Reports";
import RouteGuard from "@/components/auth/RouteGuard";
import { useAuth } from "@/contexts/AuthContext";

function normalizeRole(role?: string | null): ReportsUserRole {
  const r = (role ?? "").toLowerCase();
  if (r === "dealer_staff") return "dealer_staff";
  if (r === "dealer_manager") return "dealer_manager";
  if (r === "evm_staff") return "evm_staff";
  if (r === "admin" || r === "evm_admin") return "evm_admin";
  return "dealer_staff";
}

export default function ReportsPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  return (
    <RouteGuard>
      <div className="container mx-auto p-6">
        <Reports userRole={role} defaultPeriod="month" />
      </div>
    </RouteGuard>
  );
}
