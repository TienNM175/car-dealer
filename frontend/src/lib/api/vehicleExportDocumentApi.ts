import axiosClient from "../utils/axiosClient";

export interface CreateExportDocumentInput {
  vehicleUnitId: string;
  dealerId: string;
  contractId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientId?: string;
  recipientAddress?: string;
  notes?: string;
}

export interface CancelExportDocumentInput {
  reason?: string;
  notes?: string;
}

const normalizeResponse = <T>(res: any): T => {
  if (res?.data?.data) return res.data.data as T;
  if (res?.data) return res.data as T;
  return res as T;
};

export const vehicleExportDocumentApi = {
  create: (data: CreateExportDocumentInput) =>
    axiosClient.post("/export-documents", data),

  approve: (id: string) => axiosClient.patch(`/export-documents/${id}/approve`),

  cancel: (id: string, data: CancelExportDocumentInput = {}) =>
    axiosClient.patch(`/export-documents/${id}/cancel`, data),

  download: (id: string) =>
    axiosClient.get(`/export-documents/${id}/pdf`, {
      responseType: "blob",
    }),

  getById: async (id: string) => {
    const res = await axiosClient.get(`/export-documents/${id}`);
    return normalizeResponse(res);
  },

  list: async (params: Record<string, string | number | undefined> = {}) => {
    const res = await axiosClient.get("/export-documents", { params });
    return normalizeResponse(res);
  },
};
