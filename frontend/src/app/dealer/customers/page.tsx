'use client';
import React, { useEffect, useState } from 'react';
import CustomerList from '@/components/customers/CustomerList';
import CustomerForm from '@/components/customers/CustomerForm';
import {
  Customer,
  customerApi,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@/lib/api/customerApi';

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
const [feedbacks, setFeedbacks] = useState<any[]>([]);
const [complaints, setComplaints] = useState<any[]>([]);
const [showFeedbackModal, setShowFeedbackModal] = useState(false);
const [showComplaintModal, setShowComplaintModal] = useState(false);


  // 🔹 Lấy danh sách khách hàng
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerApi.getAllCustomers(
        { search: searchTerm, status: filterStatus },
        { page, limit }
      );

      const data = res.data.data || res.data;
      const totalCount = res.data.total ?? data.length ?? 0;

      setCustomers(data);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, searchTerm, filterStatus]);

  // 🔹 Lưu khách hàng (tạo hoặc cập nhật)
  const handleSave = async (data: CreateCustomerInput | UpdateCustomerInput) => {
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

  // 🔹 Xóa khách hàng
  const handleDelete = async (customer: Customer) => {
    try {
      await customerApi.deleteCustomer(customer.id);
      fetchCustomers();
    } catch (err) {
      console.error("Error deleting customer:", err);
    }
  };

  // 🔹 Xuất Excel
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      customers.map((c) => ({
        "Họ": c.firstName,
        "Tên": c.lastName,
        "Email": c.email,
        "Điện thoại": c.phone || "",
        "Thành phố": c.city || "",
        "CCCD": c.identityCard || "",
        "Trạng thái": c.status,
        "Ngày tạo": new Date(c.createdAt).toLocaleDateString(),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Khách hàng");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `customers_${new Date().toISOString().slice(0,10)}.xlsx`);
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
        onDeleteClick={handleDelete}
        onExportClick={handleExport}
        onViewFeedbacksClick={handleViewFeedbacksClick}    // ✅ thêm prop đúng
        onViewComplaintsClick={handleViewComplaintsClick}  // ✅ thêm prop đúng
        pagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }}
        onPageChange={setPage}
      />

      {/* Feedback Modal */}
{showFeedbackModal && (
  <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Phản hồi của {selectedCustomer?.firstName} {selectedCustomer?.lastName}
      </h2>
      {feedbacks.length > 0 ? (
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {feedbacks.map((fb) => (
            <li key={fb.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 mb-1"><strong>Danh mục:</strong> {fb.category}</p>
              <p className="text-sm text-gray-700 mb-1"><strong>Đánh giá:</strong> ⭐ {fb.rating}/5</p>
              <p className="text-sm text-gray-700"><strong>Bình luận:</strong> {fb.comment}</p>
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
        Khiếu nại của {selectedCustomer?.firstName} {selectedCustomer?.lastName}
      </h2>
      {complaints.length > 0 ? (
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {complaints.map((cp) => (
            <li key={cp.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 mb-1"><strong>Tiêu đề:</strong> {cp.title}</p>
              <p className="text-sm text-gray-700"><strong>Nội dung:</strong> {cp.description}</p>
              {cp.status && (
                <p className="text-xs mt-1 text-gray-500"><strong>Trạng thái:</strong> {cp.status}</p>
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
