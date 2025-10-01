"use client"
import Dashboard from "../../components/dashboard/Dashboard"

export default function DashboardPage() {
  return <Dashboard userRole="dealer_manager" onLogout={() => console.log("Đăng xuất")} />
}
