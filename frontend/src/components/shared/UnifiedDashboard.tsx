'use client'
import React from 'react';
import { Car, Users, Package, TrendingUp, FileText, ShoppingCart, ChevronRight } from 'lucide-react';

// Types
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

interface ActivityItem {
  id: number;
  title: string;
  time: string;
}

interface RankingItem {
  rank: number;
  name: string;
  value: string;
}

interface DashboardData {
  stats: {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
    trend?: string;
  }[];
  activities: ActivityItem[];
  rankings: {
    title: string;
    items: RankingItem[];
  };
}

// Props
interface UnifiedDashboardProps {
  userRole: 'dealer_staff' | 'dealer_manager' | 'evm_staff' | 'evm_admin';
}

// Component
export default function UnifiedDashboard({ userRole }: UnifiedDashboardProps) {
  
  // Determine if user is Dealer or EVM
  const isDealer = userRole.startsWith('dealer');
  const isEVM = userRole.startsWith('evm');

  // Dashboard data based on role
  const getDashboardData = (): DashboardData => {
    if (isDealer) {
      return {
        stats: [
          { title: 'Xe có sẵn', value: '23', icon: Car, color: 'bg-blue-500', trend: '+5%' },
          { title: 'Khách hàng', value: '156', icon: Users, color: 'bg-green-500', trend: '+12%' },
          { title: 'Doanh số tháng', value: '3.2 tỷ', icon: TrendingUp, color: 'bg-purple-500', trend: '+8%' },
          { title: 'Hợp đồng mới', value: '12', icon: FileText, color: 'bg-orange-500', trend: '+15%' },
        ],
        activities: [
          { id: 1, title: 'Đơn hàng mới #1001', time: '1 giờ trước' },
          { id: 2, title: 'Đơn hàng mới #1002', time: '2 giờ trước' },
          { id: 3, title: 'Đơn hàng mới #1003', time: '3 giờ trước' },
          { id: 4, title: 'Đơn hàng mới #1004', time: '4 giờ trước' },
          { id: 5, title: 'Đơn hàng mới #1005', time: '5 giờ trước' },
        ],
        rankings: {
          title: 'Xe bán chạy',
          items: [
            { rank: 1, name: 'Model EV-1', value: '40 xe' },
            { rank: 2, name: 'Model EV-2', value: '35 xe' },
            { rank: 3, name: 'Model EV-3', value: '30 xe' },
            { rank: 4, name: 'Model EV-4', value: '25 xe' },
            { rank: 5, name: 'Model EV-5', value: '20 xe' },
          ],
        },
      };
    } else {
      return {
        stats: [
          { title: 'Tổng đại lý', value: '45', icon: Users, color: 'bg-blue-500', trend: '+3 mới' },
          { title: 'Tồn kho', value: '1,245', icon: Package, color: 'bg-green-500', trend: '-8%' },
          { title: 'Doanh số tháng', value: '48.5 tỷ', icon: TrendingUp, color: 'bg-purple-500', trend: '+18%' },
          { title: 'Đơn hàng mới', value: '128', icon: ShoppingCart, color: 'bg-orange-500', trend: '+22%' },
        ],
        activities: [
          { id: 1, title: 'Đơn hàng từ Đại lý #1', time: '1 giờ trước' },
          { id: 2, title: 'Đơn hàng từ Đại lý #2', time: '2 giờ trước' },
          { id: 3, title: 'Đơn hàng từ Đại lý #3', time: '3 giờ trước' },
          { id: 4, title: 'Đơn hàng từ Đại lý #4', time: '4 giờ trước' },
          { id: 5, title: 'Đơn hàng từ Đại lý #5', time: '5 giờ trước' },
        ],
        rankings: {
          title: 'Đại lý hàng đầu',
          items: [
            { rank: 1, name: 'Đại lý Hà Nội', value: '45 xe' },
            { rank: 2, name: 'Đại lý TP.HCM', value: '40 xe' },
            { rank: 3, name: 'Đại lý Đà Nẵng', value: '35 xe' },
            { rank: 4, name: 'Đại lý Cần Thơ', value: '30 xe' },
            { rank: 5, name: 'Đại lý Hải Phòng', value: '25 xe' },
          ],
        },
      };
    }
  };

  const dashboardData = getDashboardData();

  // StatCard Component
  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 mt-1 font-semibold">{trend}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Activity Item Component
  const ActivityItem: React.FC<ActivityItem> = ({ title, time }) => (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Car className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
        <p className="text-xs text-gray-600">{time}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </div>
  );

  // Ranking Item Component
  const RankingItem: React.FC<RankingItem> = ({ rank, name, value }) => (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-green-600">{rank}</span>
        </div>
        <span className="text-sm font-medium text-gray-800">{name}</span>
      </div>
      <span className="text-sm font-semibold text-blue-600">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          {isDealer ? 'Tổng quan Đại lý' : 'Tổng quan Hãng xe'}
        </h2>
        <p className="text-gray-600 mt-1">
          {isDealer 
            ? 'Theo dõi hoạt động kinh doanh và hiệu suất của đại lý' 
            : 'Giám sát toàn bộ hệ thống đại lý và doanh số'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData.stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Activity & Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Hoạt động gần đây
          </h3>
          <div className="space-y-2">
            {dashboardData.activities.map((activity) => (
              <ActivityItem key={activity.id} {...activity} />
            ))}
          </div>
        </div>

        {/* Rankings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {dashboardData.rankings.title}
          </h3>
          <div className="space-y-2">
            {dashboardData.rankings.items.map((item) => (
              <RankingItem key={item.rank} {...item} />
            ))}
          </div>
        </div>
      </div>

      {/* Additional Info Card - Role specific */}
      {isDealer && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Mục tiêu tháng này</h3>
              <p className="text-blue-100">Bạn đã đạt 65% mục tiêu doanh số</p>
              <div className="mt-3 bg-white bg-opacity-20 rounded-full h-2 w-64">
                <div className="bg-white rounded-full h-2" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">13/20</p>
              <p className="text-blue-100 text-sm">xe đã bán</p>
            </div>
          </div>
        </div>
      )}

      {isEVM && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
            <h3 className="text-sm font-semibold mb-2">Tăng trưởng</h3>
            <p className="text-3xl font-bold">+18.5%</p>
            <p className="text-green-100 text-sm mt-1">So với tháng trước</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <h3 className="text-sm font-semibold mb-2">Tỷ lệ giao hàng</h3>
            <p className="text-3xl font-bold">92.3%</p>
            <p className="text-purple-100 text-sm mt-1">Đúng hạn</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
            <h3 className="text-sm font-semibold mb-2">Đại lý mới</h3>
            <p className="text-3xl font-bold">+3</p>
            <p className="text-orange-100 text-sm mt-1">Tháng này</p>
          </div>
        </div>
      )}
    </div>
  );
}