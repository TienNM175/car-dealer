// mobile/src/components/ai-insights/styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 0,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1, // <--- THÊM DÒNG NÀY ĐỂ CONTAINER CHIẾM HẾT PHẦN CÒN LẠI
    paddingTop: 0, 
    paddingHorizontal: 24,
    paddingBottom: 30,
    alignItems: 'center',
    justifyContent: 'center', // <--- THÊM DÒNG NÀY ĐỂ NỘI DUNG DÍNH LÊN PHÍA TRÊN
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  errorBox: {
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    borderRadius: 6,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  generateBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#e5e7eb',
  paddingVertical: 6,
},

});