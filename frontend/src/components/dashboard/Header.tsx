"use client";
import { Bell, UserCircle } from "lucide-react";

const Header = ({ userRole }: { userRole: string }) => (
  <header className="bg-white shadow-sm p-4 flex items-center justify-between">
    <div>
      <h1 className="text-xl font-bold text-gray-800">
        {userRole === "dealer_staff" && "Nhân viên Đại lý"}
        {userRole === "dealer_manager" && "Quản lý Đại lý"}
        {userRole === "evm_staff" && "Nhân viên Hãng xe"}
        {userRole === "evm_admin" && "Quản trị viên Hãng xe"}
      </h1>
      <p className="text-sm text-gray-600">Chào mừng trở lại!</p>
    </div>
    <div className="flex items-center space-x-4">
      <button
        type="button"
        aria-label="Thông báo"
        className="p-2 hover:bg-gray-100 rounded-lg relative"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      <button
        type="button"
        aria-label="Tài khoản"
        className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2"
      >
        <UserCircle className="w-8 h-8 text-gray-600" />
      </button>
    </div>
  </header>
);

export default Header;
