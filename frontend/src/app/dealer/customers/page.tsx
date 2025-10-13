"use client";
import React, { useEffect, useState } from "react";
import CustomerList from "@/components/customers/CustomerList";
import CustomerForm from "@/components/customers/CustomerForm";
import {
  Customer,
  customerApi,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/lib/api/customerApi";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// 🔹 Thêm statusConfig vào đây (để sử dụng trong modal chi tiết)
const statusConfig = {
  INTERESTED: { label: "Quan tâm", color: "bg-blue-100 text-blue-700" },
  CONTACTED: { label: "Đã liên hệ", color: "bg-yellow-100 text-yellow-700" },
  TEST_DRIVE: { label: "Lái thử", color: "bg-purple-100 text-purple-700" },
  QUOTED: { label: "Đã báo giá", color: "bg-orange-100 text-orange-700" },
  PURCHASED: { label: "Đã mua", color: "bg-green-100 text-green-700" },
  COLD: { label: "Từ chối", color: "bg-gray-100 text-gray-700" },
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // 🔹 Thêm state cho chi tiết khách hàng
  const [showDetail, setShowDetail] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // 🔹 Thêm state cho modal xác nhận xóa
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

  // 🔹 Lấy danh sách khách hàng
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerApi.getAllCustomers(
        { search: searchTerm, status: filterStatus },
        { page, limit }
      );

      console.log("API Response:", res.data); // ✅ Debug log

      // ✅ Extract data correctly from backend response structure
      const data = res.data.data || [];
      const meta = res.data.meta || {};

      setCustomers(data);
      setTotal(meta.total || 0);
      setTotalPages(meta.totalPages || 0);

      console.log("Parsed:", {
        customers: data.length,
        total: meta.total,
        totalPages: meta.totalPages,
        page: meta.page,
      }); // ✅ Debug log
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, searchTerm, filterStatus]);

  // 🔹 Lưu khách hàng (tạo hoặc cập nhật)
  const handleSave = async (
    data: CreateCustomerInput | UpdateCustomerInput
  ) => {
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, data);
      } else {
        await customerApi.createCustomer(data as CreateCustomerInput);
      }
      setShowForm(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error("Error saving customer:", err);
    }
  };

  // 🔹 Mở modal xóa
  const handleOpenDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  // 🔹 Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (customerToDelete) {
      try {
        await customerApi.deleteCustomer(customerToDelete.id);
        fetchCustomers();
      } catch (err) {
        console.error("Error deleting customer:", err);
      }
    }
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  // 🔹 Hủy xóa
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  // 🔹 Xuất Excel
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      customers.map((c) => ({
        Họ: c.firstName,
        Tên: c.lastName,
        Email: c.email,
        "Điện thoại": c.phone || "",
        "Thành phố": c.city || "",
        CCCD: c.identityCard || "",
        "Trạng thái": c.status,
        "Ngày tạo": new Date(c.createdAt).toLocaleDateString(),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Khách hàng");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleViewFeedbacksClick = async (customer: Customer) => {
    try {
      const res = await customerApi.getCustomerFeedbacks(customer.id);
      const data = res.data.data || [];
      setSelectedCustomer(customer);
      setFeedbacks(data);
      setShowFeedbackModal(true);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    }
  };

  const handleViewComplaintsClick = async (customer: Customer) => {
    try {
      const res = await customerApi.getCustomerComplaints(customer.id);
      const data = res.data.data || [];
      setSelectedCustomer(customer);
      setComplaints(data);
      setShowComplaintModal(true);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  };

  // 🔹 Xem chi tiết khách hàng
  const handleViewDetail = async (customer: Customer) => {
    try {
      const res = await customerApi.getCustomerById(customer.id);
      // 🔹 Fix: Parse đúng cấu trúc response (data.data hoặc data)
      const customerData = res.data.data || res.data;
      console.log("Detail customer data:", customerData); // 🔹 Debug log để kiểm tra
      setDetailCustomer(customerData);
      setShowDetail(true);
    } catch (err) {
      console.error("Error fetching customer detail:", err);
    }
  };

  return (
    <div className="p-6">
      <CustomerList
        customers={customers}
        loading={loading}
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilterStatus}
        onCreateClick={() => {
          setEditingCustomer(null);
          setShowForm(true);
        }}
        onEditClick={(customer) => {
          setEditingCustomer(customer);
          setShowForm(true);
        }}
        // 🔹 Thay đổi onDeleteClick thành handleOpenDelete
        onDeleteClick={handleOpenDelete}
        onExportClick={handleExport}
        onViewFeedbacksClick={handleViewFeedbacksClick} // ✅ thêm prop đúng
        onViewComplaintsClick={handleViewComplaintsClick} // ✅ thêm prop đúng
        // 🔹 Thêm prop cho xem chi tiết
        onViewDetailClick={handleViewDetail}
        pagination={{
          page,
          limit,
          total,
          totalPages,
        }}
        onPageChange={setPage}
      />

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Phản hồi của {selectedCustomer?.firstName}{" "}
              {selectedCustomer?.lastName}
            </h2>
            {feedbacks.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {feedbacks.map((fb) => (
                  <li
                    key={fb.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Danh mục:</strong> {fb.category}
                    </p>
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Đánh giá:</strong> ⭐ {fb.rating}/5
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Bình luận:</strong> {fb.comment}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Không có phản hồi nào.</p>
            )}
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Khiếu nại của {selectedCustomer?.firstName}{" "}
              {selectedCustomer?.lastName}
            </h2>
            {complaints.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {complaints.map((cp) => (
                  <li
                    key={cp.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Tiêu đề:</strong> {cp.title}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Nội dung:</strong> {cp.description}
                    </p>
                    {cp.status && (
                      <p className="text-xs mt-1 text-gray-500">
                        <strong>Trạng thái:</strong> {cp.status}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Không có khiếu nại nào.</p>
            )}
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowComplaintModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modal chi tiết khách hàng */}
      {showDetail && detailCustomer && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Chi tiết khách hàng: {detailCustomer.firstName}{" "}
                {detailCustomer.lastName}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div>
                  <strong className="text-gray-700">Email:</strong>
                  <p className="text-gray-900 ml-2">{detailCustomer.email}</p>
                </div>
                {detailCustomer.phone && (
                  <div>
                    <strong className="text-gray-700">Điện thoại:</strong>
                    <p className="text-gray-900 ml-2">{detailCustomer.phone}</p>
                  </div>
                )}
                {detailCustomer.address && (
                  <div>
                    <strong className="text-gray-700">Địa chỉ:</strong>
                    <p className="text-gray-900 ml-2">
                      {detailCustomer.address}
                    </p>
                  </div>
                )}
                {detailCustomer.city && (
                  <div>
                    <strong className="text-gray-700">Thành phố:</strong>
                    <p className="text-gray-900 ml-2">{detailCustomer.city}</p>
                  </div>
                )}
                {detailCustomer.identityCard && (
                  <div>
                    <strong className="text-gray-700">CCCD:</strong>
                    <p className="text-gray-900 ml-2">
                      {detailCustomer.identityCard}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <strong className="text-gray-700">Trạng thái:</strong>
                  <span
                    className={`ml-2 px-3 py-1 text-xs font-medium rounded-full ${
                      statusConfig[
                        detailCustomer.status as keyof typeof statusConfig
                      ]?.color || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {statusConfig[
                      detailCustomer.status as keyof typeof statusConfig
                    ]?.label ||
                      (detailCustomer.status
                        ? detailCustomer.status.toUpperCase()
                        : "N/A")}
                  </span>
                </div>
                <div>
                  <strong className="text-gray-700">Ngày tạo:</strong>
                  <p className="text-gray-900 ml-2">
                    {detailCustomer.createdAt
                      ? new Date(detailCustomer.createdAt).toLocaleDateString(
                          "vi-VN"
                        ) || "N/A"
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Ngày cập nhật:</strong>
                  <p className="text-gray-900 ml-2">
                    {detailCustomer.updatedAt
                      ? new Date(detailCustomer.updatedAt).toLocaleDateString(
                          "vi-VN"
                        ) || "N/A"
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Hoạt động và đếm */}
            {detailCustomer._count && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Hoạt động liên quan
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {detailCustomer._count.contracts}
                    </p>
                    <p className="text-sm text-gray-600">Hợp đồng</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {detailCustomer._count.quotations}
                    </p>
                    <p className="text-sm text-gray-600">Báo giá</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {detailCustomer._count.testDrives}
                    </p>
                    <p className="text-sm text-gray-600">Lái thử</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {detailCustomer._count.feedbacks}
                    </p>
                    <p className="text-sm text-gray-600">Phản hồi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {detailCustomer._count.complaints}
                    </p>
                    <p className="text-sm text-gray-600">Khiếu nại</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-right">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modal xác nhận xóa */}
      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Xác nhận xóa
              </h2>
              <button
                onClick={handleCancelDelete}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa khách hàng{" "}
              <strong>
                {customerToDelete.firstName} {customerToDelete.lastName}
              </strong>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
