import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const STATUS_FILTERS = [
  { label: "Tất cả", value: "" },
  { label: "Quan tâm", value: "INTERESTED" },
  { label: "Đã mua", value: "PURCHASED" },
  { label: "Lái thử", value: "TEST_DRIVE" },
  { label: "Đã liên hệ", value: "CONTACTED" },
];

interface Props {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  filterStatus: string;
  onFilterChange: (status: string) => void;
}

export default function CustomerSearchWithFilter({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedLabel =
    STATUS_FILTERS.find((f) => f.value === filterStatus)?.label || "Tất cả";

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color="#9ca3af"
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.input}
          placeholder="Tìm kiếm khách hàng..."
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Filter dropdown */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>{selectedLabel}</Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color="#1f2937"
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={styles.modalOption}
                  onPress={() => {
                    onFilterChange(f.value); // set filterStatus
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      f.value === filterStatus && {
                        fontWeight: "bold",
                        color: "#2563eb",
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#1f2937" },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  filterButtonText: { fontSize: 14, color: "#1f2937" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
  },
  modalOption: { paddingVertical: 10, paddingHorizontal: 16 },
  modalOptionText: { fontSize: 14, color: "#1f2937" },
});
