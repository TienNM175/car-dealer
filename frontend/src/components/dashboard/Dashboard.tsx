"use client"
import { useState } from "react"
import { TrendingUp, Car, ShoppingCart, FileText, Users, Calendar, BarChart3, Package, LogOut } from "lucide-react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import DashboardContent from "./DashboardContent"

const Dashboard = ({ userRole, onLogout }: { userRole: string; onLogout: () => void }) => {
  const [activeMenu, setActiveMenu] = useState("dashboard")

  const dealerMenuItems = [
    { id: "dashboard", icon: TrendingUp, label: "Tổng quan", role: ["dealer_staff", "dealer_manager"] },
    { id: "vehicles", icon: Car, label: "Danh mục xe", role: ["dealer_staff", "dealer_manager"] },
    { id: "orders", icon: ShoppingCart, label: "Đơn hàng", role: ["dealer_staff", "dealer_manager"] },
    { id: "contracts", icon: FileText, label: "Hợp đồng", role: ["dealer_staff", "dealer_manager"] },
    { id: "customers", icon: Users, label: "Khách hàng", role: ["dealer_staff", "dealer_manager"] },
    { id: "appointments", icon: Calendar, label: "Lịch hẹn", role: ["dealer_staff", "dealer_manager"] },
    { id: "reports", icon: BarChart3, label: "Báo cáo", role: ["dealer_manager"] },
  ]

  const evmMenuItems = [
    { id: "dashboard", icon: TrendingUp, label: "Tổng quan", role: ["evm_staff", "evm_admin"] },
    { id: "products", icon: Car, label: "Quản lý sản phẩm", role: ["evm_staff", "evm_admin"] },
    { id: "inventory", icon: Package, label: "Tồn kho", role: ["evm_staff", "evm_admin"] },
    { id: "dealers", icon: Users, label: "Quản lý đại lý", role: ["evm_admin"] },
    { id: "pricing", icon: FileText, label: "Giá & Chiết khấu", role: ["evm_admin"] },
    { id: "reports", icon: BarChart3, label: "Báo cáo & Phân tích", role: ["evm_staff", "evm_admin"] },
  ]

  const menuItems = userRole.startsWith("evm") ? evmMenuItems : dealerMenuItems
  const filteredMenuItems = menuItems.filter((item) => item.role.includes(userRole))

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        sidebarOpen={true} 
        setSidebarOpen={() => {}} 
        filteredMenuItems={filteredMenuItems}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        onLogout={onLogout}
        />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userRole={userRole} />
        <main className="flex-1 overflow-y-auto p-6">
          <DashboardContent userRole={userRole} />
        </main>
      </div>
    </div>
  )
}

export default Dashboard
