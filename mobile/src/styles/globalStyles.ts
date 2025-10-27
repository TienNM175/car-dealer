// mobile/src/styles/globalStyles.ts
import { StyleSheet } from "react-native";

// Color palette
export const colors = {
  primary: "#2563eb",
  primaryLight: "#dbeafe",
  secondary: "#10b981",
  secondaryLight: "#dcfce7",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  success: "#10b981",
  successLight: "#dcfce7",
  info: "#3b82f6",
  infoLight: "#dbeafe",

  // Neutral colors
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  black: "#000000",
};

// Typography
export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: "bold" as const,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold" as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    fontWeight: "500" as const,
    lineHeight: 14,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  bodySmallBold: {
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
};

// Global styles
export const globalStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  // Text styles
  title: {
    ...typography.h3,
    color: colors.gray800,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.h4,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  bodyText: {
    ...typography.body,
    color: colors.gray600,
  },
  captionText: {
    ...typography.caption,
    color: colors.gray500,
  },

  // Button styles
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.gray200,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.gray700,
  },

  // Input styles
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.gray800,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },

  // Label
  label: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: spacing.xs,
  },

  // Error text
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  statusText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.gray800,
  },
  modalBody: {
    padding: spacing.lg,
  },

  // List
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.gray500,
    textAlign: "center",
  },

  // Loading
  loadingText: {
    marginTop: spacing.md,
    ...typography.bodySmall,
    color: colors.gray500,
  },

  // Section
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.gray700,
    marginBottom: spacing.md,
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Spacing utilities
  mt: { marginTop: spacing.md },
  mb: { marginBottom: spacing.md },
  ml: { marginLeft: spacing.md },
  mr: { marginRight: spacing.md },
  mx: { marginHorizontal: spacing.md },
  my: { marginVertical: spacing.md },

  pt: { paddingTop: spacing.md },
  pb: { paddingBottom: spacing.md },
  pl: { paddingLeft: spacing.md },
  pr: { paddingRight: spacing.md },
  px: { paddingHorizontal: spacing.md },
  py: { paddingVertical: spacing.md },
});
