// mobile/src/components/customers/styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // List
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 14,
  },
  emptyText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 16,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  email: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  phone: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  city: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 56,
    marginBottom: 10,
  },

  // Action Buttons
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    minWidth: "45%",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalBody: {
    padding: 16,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },

  // Detail Info
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },

  // Status Badge Large
  statusBadgeLarge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  statusTextLarge: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statItem: {
    width: "48%",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
  },

  // Close Button
  closeBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Form
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
  },

  // Status Select
  statusSelect: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
  },
  statusOptionActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  statusOptionText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  statusOptionTextActive: {
    color: "#fff",
  },

  // Form Actions
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelBtnText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#2563eb",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Confirm Modal
  confirmModal: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 12,
  },
  confirmMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  cancelConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelConfirmBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  deleteConfirmBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Feedback & Complaint
  feedbackItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  feedbackCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
  },
  rating: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f59e0b",
  },
  feedbackComment: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  complaintItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  complaintTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 6,
  },
  complaintDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 6,
  },
  complaintStatus: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  emptyMessage: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  // Modal Footer
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  // Feedback specific styles
  feedbackDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 8,
    fontStyle: "italic",
  },

  // Complaint specific styles
  complaintStatusBadge: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  complaintStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  complaintDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 8,
    fontStyle: "italic",
  },
  complaintResolution: {
    marginTop: 10,
    backgroundColor: "#f0fdf4",
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  complaintResolutionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
    marginBottom: 4,
  },
  complaintResolutionText: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 16,
  },
});
