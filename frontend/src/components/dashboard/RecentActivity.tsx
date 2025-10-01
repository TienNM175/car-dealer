"use client"
import { Car } from "lucide-react"

const RecentActivity = () => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Hoạt động gần đây</h3>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Đơn hàng mới #{1000 + i}</p>
            <p className="text-xs text-gray-600">{i} giờ trước</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default RecentActivity
