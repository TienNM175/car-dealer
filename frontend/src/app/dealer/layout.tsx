"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import {
  Car,
  Users,
  ShoppingCart,
  FileText,
  Calendar,
  BarChart3,
  TrendingUp,
  Menu,
  X,
  LogOut,
  Percent,
} from "lucide-react";

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("vehicles");
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // role normalize về UPPERCASE
  const userRole = user?.role?.toUpperCase() || "DEALER_STAFF";

  const dealerMenuItems = [
    {
      id: "vehicles",
      icon: Car,
      label: "Danh mục xe",
      role: ["DEALER_STAFF", "DEALER_MANAGER"],
    },
    {
      id: "orders",
      icon: ShoppingCart,
      label: "Đơn hàng",
      role: ["DEALER_STAFF", "DEALER_MANAGER"],
    },
    {
      id: "contracts",
      icon: FileText,
      label: "Hợp đồng",
      role: ["DEALER_STAFF", "DEALER_MANAGER"],
    },
    {
      id: "customers",
      icon: Users,
      label: "Khách hàng",
      role: ["DEALER_STAFF", "DEALER_MANAGER"],
    },
    {
      id: "promotions",
      icon: Percent,
      label: "Mã khuyến mãi",
      role: ["DEALER_STAFF", "DEALER_MANAGER"],
    },
    {
      id: "inventory",
      icon: FileText,
      label: "Quản lý kho",
      role: ["DEALER_MANAGER", "DEALER_STAFF"],
    },
    {
      id: "reports",
      icon: BarChart3,
      label: "Báo cáo",
      role: ["DEALER_MANAGER"],
    },
    
    //thêm mục lái thử ở đaaay
    {
      id: "test-drive",
      icon: Calendar,
      label: "Lái thử",
      role: ["DEALER_STAFF", "DEALER_MANAGER"],
    },
  ];

  const filteredMenuItems = dealerMenuItems.filter((item) =>
    item.role.includes(userRole)
  );

  useEffect(() => {
    const currentPath = pathname.split("/").pop() || "dashboard";
    setActiveMenu(currentPath);
  }, [pathname]);

  return (
    <RouteGuard allowedRoles={["DEALER_STAFF", "DEALER_MANAGER", "ADMIN"]}>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-white shadow-lg transition-all duration-300 flex flex-col`}
        >
          <div className="p-6 border-b flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-gray-800">Đại lý EVM</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.id}
                href={`/dealer/${item.id}`}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                  activeMenu === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            {sidebarOpen && user && (
              <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Xin chào</p>
                <p className="text-sm font-semibold text-gray-800">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">Đăng xuất</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </div>
      </div>
    </RouteGuard>
  );
}
