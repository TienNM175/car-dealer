import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Không có quyền truy cập
        </h1>
        <p className="text-gray-600 mb-8">
          Bạn không có quyền truy cập vào trang này.
        </p>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-block transition"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}