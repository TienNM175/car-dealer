"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "DEALER_STAFF" | "DEALER_MANAGER" | "EVM_STAFF" | "ADMIN";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return; // đợi context load xong

    // ❌ Chưa đăng nhập → redirect login
    if (!isAuthenticated) {
      router.push(`/login?redirect=${pathname}`);
      return;
    }

    if (user?.role) {
      const role = user.role.toUpperCase(); // luôn normalize về uppercase
      const isEVMUser = role === "ADMIN" || role.startsWith("EVM");
      const isDealerUser = role.startsWith("DEALER");

      const isEVMRoute = pathname.startsWith("/evm");
      const isDealerRoute = pathname.startsWith("/dealer");

      // 👉 xử lý allowedRoles: nếu yêu cầu EVM thì ADMIN cũng được vào
      if (allowedRoles) {
        let normalizedRoles = allowedRoles.map(r => r.toUpperCase());
        if (normalizedRoles.some(r => r.startsWith("EVM")) && !normalizedRoles.includes("ADMIN")) {
          normalizedRoles.push("ADMIN");
        }

        console.log("DEBUG GUARD >>>", { pathname, userRole: role, allowedRoles: normalizedRoles });

        if (!normalizedRoles.includes(role)) {
          router.push("/unauthorized");
          return;
        }
      }

      // ❌ EVM user mà vào Dealer route
      if (isEVMUser && isDealerRoute) {
        router.push("/evm/dashboard");
        return;
      }

      // ❌ Dealer user mà vào EVM route
      if (isDealerUser && isEVMRoute) {
        router.push("/dealer/dashboard");
        return;
      }

      // ✅ Nếu đang ở trang login nhưng đã login rồi → redirect theo role
      if (pathname.startsWith("/login")) {
        if (isEVMUser) router.push("/evm/dashboard");
        else if (isDealerUser) router.push("/dealer/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, pathname, router]);

  // Loading UI
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // ❌ Không login thì không render UI
  if (!isAuthenticated) return null;

  // ✅ Trường hợp hợp lệ thì render children
  return <>{children}</>;
}
