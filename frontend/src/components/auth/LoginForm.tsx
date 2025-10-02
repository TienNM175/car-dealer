"use client";
import React, { useState } from "react";
import { Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage: React.FC = () => {
  const { login } = useAuth(); // lấy hàm login từ context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"dealer_staff" | "dealer_manager" | "evm_staff" | "evm_admin">("dealer_manager");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      // gọi mock login từ AuthContext
      await login(email, password);

      // update role nếu muốn override theo dropdown
      const tokenUser = localStorage.getItem("user");
      if (tokenUser) {
        const parsedUser = JSON.parse(tokenUser);
        parsedUser.role = selectedRole;
        localStorage.setItem("user", JSON.stringify(parsedUser));
      }
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center"
       style={{backgroundImage:"url('/images/vin.png')"}}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-20"></div>

      {/* Login Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            EVM Dealer System
          </h1>
          <p className="text-gray-600">Hệ thống Quản lý Đại lý Xe Điện</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Role Selector */}
          <div>
            <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">
              Vai trò
            </label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="dealer_staff">Nhân viên Đại lý</option>
              <option value="dealer_manager">Quản lý Đại lý</option>
              <option value="evm_staff">Nhân viên Hãng xe</option>
              <option value="evm_admin">Quản trị viên Hãng xe</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-lg"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
