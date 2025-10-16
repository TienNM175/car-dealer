"use client";

import React, { useState } from "react";
import { X, AlertCircle, Eye, EyeOff, Key, Shield, Check } from "lucide-react";
import { usersApi } from "@/lib/api/users";
import { User } from "@/lib/types/user";
import { useAuth } from "@/contexts/AuthContext";

interface ChangePasswordModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (message?: string) => void; 
}

export default function ChangePasswordModal({
  user,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isAdmin = currentUser?.role === "ADMIN";
  const isOwnProfile = currentUser?.id === user.id;

  // Password strength validation
  const hasMinLength = formData.newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(formData.newPassword);
  const hasLowerCase = /[a-z]/.test(formData.newPassword);
  const hasNumber = /[0-9]/.test(formData.newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);
  const passwordsMatch =
    formData.newPassword && formData.newPassword === formData.confirmPassword;

  const allRequirementsMet =
    hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isAdmin && !formData.oldPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    if (!formData.newPassword) {
      setError("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (!allRequirementsMet) {
      setError("Mật khẩu chưa đáp ứng đủ yêu cầu");
      return;
    }

    if (!passwordsMatch) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      await usersApi.changePassword(user.id, {
        oldPassword: formData.oldPassword || "",
        newPassword: formData.newPassword,
      });
      onSuccess("Mật khẩu đã được thay đổi thành công!");
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header - Fixed */}
        <div className="flex-shrink-0 relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 p-6 rounded-t-2xl">
          <button 
            aria-label="Đóng cửa sổ"
            onClick={onClose}
            className="absolute right-4 top-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Đổi mật khẩu</h2>
              <p className="text-purple-100 text-sm mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 font-medium">{error}</div>
            </div>
          )}

          {isAdmin && !isOwnProfile && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Admin đổi mật khẩu cho user khác không cần mật khẩu cũ
              </p>
            </div>
          )}

          {/* Old Password */}
          {(!isAdmin || isOwnProfile) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={formData.oldPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, oldPassword: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none font-medium text-gray-900"
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {showOldPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none font-medium text-gray-900"
                placeholder="Nhập mật khẩu mới"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className={`w-full border-2 rounded-xl px-4 py-3 pr-12 focus:ring-2 transition-all outline-none font-medium text-gray-900 ${
                  formData.confirmPassword && !passwordsMatch
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-200 focus:ring-purple-500 focus:border-purple-500"
                }`}
                placeholder="Nhập lại mật khẩu mới"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {formData.confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-600 mt-2 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Mật khẩu xác nhận không khớp</span>
              </p>
            )}
            {passwordsMatch && formData.confirmPassword && (
              <p className="text-xs text-green-600 mt-2 flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Mật khẩu khớp</span>
              </p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Yêu cầu mật khẩu:
            </p>
            <div className="space-y-2">
              {[
                { met: hasMinLength, text: "Ít nhất 8 ký tự" },
                { met: hasUpperCase, text: "Có chữ hoa (A-Z)" },
                { met: hasLowerCase, text: "Có chữ thường (a-z)" },
                { met: hasNumber, text: "Có số (0-9)" },
                { met: hasSpecial, text: "Có ký tự đặc biệt (!@#$...)" },
              ].map((req, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      req.met ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    {req.met && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={`text-xs transition-colors ${
                      req.met ? "text-green-700 font-medium" : "text-gray-600"
                    }`}
                  >
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 transition-all font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !allRequirementsMet || !passwordsMatch}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang đổi...</span>
                </span>
              ) : (
                "Đổi mật khẩu"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}