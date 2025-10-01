"use client"
import { Users, Package, TrendingUp, ShoppingCart, Car, FileText } from "lucide-react"
import StatCard from "./StatCard"
import RecentActivity from "./RecentActivity"
import TopList from "./TopList"

const DashboardContent = ({ userRole }: { userRole: string }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800">
      {userRole.startsWith("evm") ? "Tổng quan Hãng xe" : "Tổng quan Đại lý"}
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {userRole.startsWith("evm") ? (
        <>
          <StatCard title="Tổng đại lý" value="45" icon={Users} color="bg-blue-500" />
          <StatCard title="Tồn kho" value="1,245" icon={Package} color="bg-green-500" />
          <StatCard title="Doanh số tháng" value="15.8 tỷ" icon={TrendingUp} color="bg-purple-500" />
          <StatCard title="Đơn hàng mới" value="128" icon={ShoppingCart} color="bg-orange-500" />
        </>
      ) : (
        <>
          <StatCard title="Xe có sẵn" value="23" icon={Car} color="bg-blue-500" />
          <StatCard title="Khách hàng" value="156" icon={Users} color="bg-green-500" />
          <StatCard title="Doanh số tháng" value="3.2 tỷ" icon={TrendingUp} color="bg-purple-500" />
          <StatCard title="Hợp đồng mới" value="12" icon={FileText} color="bg-orange-500" />
        </>
      )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <RecentActivity />
      <TopList isEvm={userRole.startsWith("evm")} />
    </div>
  </div>
)

export default DashboardContent
