// frontend/src/app/customers/page.tsx
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

  const handleSave = async (data: CreateCustomerInput | UpdateCustomerInput) => {
    if (editingCustomer) {
      await customerApi.updateCustomer(editingCustomer.id, data);
    } else {
      await customerApi.createCustomer(data as CreateCustomerInput);
    }
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const handleDelete = async (customer: Customer) => {
    await customerApi.deleteCustomer(customer.id);
    fetchCustomers();
  };

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
        onViewClick={(customer) => console.log('View', customer)}
        onEditClick={(customer) => {
          setEditingCustomer(customer);
          setShowForm(true);
        }}
        onDeleteClick={handleDelete}
        onExportClick={handleExport}   
        pagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }}
        onPageChange={setPage}
      />

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
