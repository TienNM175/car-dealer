import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/shared/Header";

import CustomerCard from "@/components/customers/CustomerCard";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import CustomerFormModal from "@/components/customers/CustomerFormModal";
import DeleteConfirmModal from "@/components/customers/DeleteConfirmModal";
import FeedbackModal from "@/components/customers/FeedbackModal";
import ComplaintModal from "@/components/customers/ComplaintModal";
import { styles } from "@/components/customers/styles";
import { useCustomerLogic } from "@/hooks/useCustomerLogic";
import CustomerSearchWithFilter from "@/components/customers/CustomerSearchWithFilter";

export default function CustomersScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const {
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
    handleSaveCustomer,
    handleEditCustomer,
    resetForm,
  } = useCustomerLogic(searchTerm, filterStatus);

  // fetch data khi load lần đầu
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCustomers();
      setLoading(false);
    };
    loadData();
  }, [fetchCustomers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCustomers().then(() => setRefreshing(false));
  }, [fetchCustomers]);

  const renderCustomerCard = ({ item }: any) => (
    <CustomerCard
      customer={item}
      onViewDetail={() => handleViewDetail(item)}
      onEdit={() => {
        handleEditCustomer(item);
        setShowFormModal(true);
      }}
      onDelete={() => {
        setCustomerToDelete(item);
        setShowDeleteModal(true);
      }}
      onViewFeedbacks={() => handleViewFeedbacks(item)}
      onViewComplaints={() => handleViewComplaints(item)}
    />
  );

  return (
    <View style={styles.container}>
      <Header title="Danh sách khách hàng" />

      <CustomerSearchWithFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không có khách hàng</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomerCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <CustomerDetailModal
        visible={showDetailModal}
        customer={selectedCustomer}
        onClose={() => setShowDetailModal(false)}
      />
      <CustomerFormModal
        visible={showFormModal}
        customer={editingCustomer}
        loading={formLoading}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        onSave={handleSaveCustomer}
      />
      <DeleteConfirmModal
        visible={showDeleteModal}
        customer={customerToDelete}
        loading={formLoading}
        onConfirm={() => handleDeleteCustomer()}
        onCancel={() => setShowDeleteModal(false)}
      />
      <FeedbackModal
        visible={showFeedbackModal}
        customer={selectedCustomer}
        feedbacks={feedbacks}
        onClose={() => setShowFeedbackModal(false)}
      />
      <ComplaintModal
        visible={showComplaintModal}
        customer={selectedCustomer}
        complaints={complaints}
        onClose={() => setShowComplaintModal(false)}
      />
    </View>
  );
}
