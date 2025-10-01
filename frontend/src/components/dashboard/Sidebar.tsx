"use client";

import { Car, LogOut, Menu, X } from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  filteredMenuItems: { id: string; icon: any; label: string }[];
  activeMenu: string;
  setActiveMenu: (id: string) => void;
  onLogout: () => void;
  setIsLoggedIn?: (val: boolean) => void; // optional fallback
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  filteredMenuItems,
  activeMenu,
  setActiveMenu,
  onLogout,
}: SidebarProps) {
  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-white shadow-lg transition-all duration-300 flex flex-col`}
    >
      {/* Logo + Toggle */}
      <div className="p-6 border-b flex items-center justify-between">
        {sidebarOpen && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-800">EVM System</span>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
              activeMenu === item.id
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <item.icon className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
        >
          <LogOut className="w-5 h-5" />
          {sidebarOpen && <span className="font-medium">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
}
