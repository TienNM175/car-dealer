// mobile/src/hooks/useCustomerLogic.ts
import { useState, useCallback } from 'react';
import { customerApi, Customer, CreateCustomerInput } from '@/lib/api/customerApi';
import Toast from 'react-native-toast-message';

export function useCustomerLogic(searchTerm: string, filterStatus: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  const [formLoading, setFormLoading] = useState(false);

const fetchCustomers = useCallback(async () => {
  try {
    let res;
    let data: Customer[] = [];

    // Luôn gọi getAllCustomers với filterStatus
    res = await customerApi.getAllCustomers(
      { search: searchTerm, status: filterStatus || undefined },
      { page: 1, limit: 10 }
    );

    if (res?.data) {
      if (Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }
    }

    setCustomers(data);
  } catch (err) {
    console.error('Error fetching customers:', err);
    Toast.show({
      type: 'error',
      text1: 'Lỗi',
      text2: 'Không thể tải danh sách khách hàng',
    });
    setCustomers([]);
  }
}, [searchTerm, filterStatus]);



  const handleSaveCustomer = useCallback(
    async (data: CreateCustomerInput) => {
      setFormLoading(true);
      try {
        if (editingCustomer?.id) {
          await customerApi.updateCustomer(editingCustomer.id, data);
          Toast.show({ type: 'success', text1: 'Thành công', text2: 'Cập nhật khách hàng thành công' });
        } else {
          await customerApi.createCustomer(data);
          Toast.show({ type: 'success', text1: 'Thành công', text2: 'Thêm khách hàng mới thành công' });
        }
        fetchCustomers();
        setShowFormModal(false);
        setEditingCustomer(null);
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: err?.response?.data?.message || 'Không thể lưu khách hàng',
        });
      } finally {
        setFormLoading(false);
      }
    },
    [editingCustomer, fetchCustomers]
  );

  const handleViewDetail = useCallback(async (customer: Customer) => {
    try {
      const res = await customerApi.getCustomerById(customer.id);
      const customerData = res?.data?.data ?? res?.data ?? null;
      setSelectedCustomer(customerData);
      setShowDetailModal(true);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải chi tiết khách hàng',
      });
    }
  }, []);

  const handleViewFeedbacks = useCallback(async (customer: Customer) => {
    try {
      const res = await customerApi.getCustomerFeedbacks(customer.id);
      setSelectedCustomer(customer);
      setFeedbacks(res?.data?.data ?? []);
      setShowFeedbackModal(true);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải phản hồi',
      });
    }
  }, []);

  const handleViewComplaints = useCallback(async (customer: Customer) => {
    try {
      const res = await customerApi.getCustomerComplaints(customer.id);
      setSelectedCustomer(customer);
      setComplaints(res?.data?.data ?? []);
      setShowComplaintModal(true);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải khiếu nại',
      });
    }
  }, []);

  const handleEditCustomer = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
  }, []);

  const handleDeleteCustomer = useCallback(async () => {
    if (!customerToDelete) return;
    setFormLoading(true);
    try {
      await customerApi.deleteCustomer(customerToDelete.id);
      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Xóa khách hàng thành công' });
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: err?.response?.data?.message || 'Không thể xóa khách hàng' });
    } finally {
      setFormLoading(false);
    }
  }, [customerToDelete, fetchCustomers]);

  const resetForm = useCallback(() => {
    setEditingCustomer(null);
  }, []);

  return {
    customers,
    fetchCustomers,
    selectedCustomer,
    setSelectedCustomer,
    editingCustomer,
    setEditingCustomer,
    customerToDelete,
    setCustomerToDelete,
    feedbacks,
    complaints,
    showDetailModal,
    setShowDetailModal,
    showFormModal,
    setShowFormModal,
    showDeleteModal,
    setShowDeleteModal,
    showFeedbackModal,
    setShowFeedbackModal,
    showComplaintModal,
    setShowComplaintModal,
    formLoading,
    handleViewDetail,
    handleViewFeedbacks,
    handleViewComplaints,
    handleDeleteCustomer,
    handleEditCustomer,
    handleSaveCustomer,
    resetForm,
  };
}
