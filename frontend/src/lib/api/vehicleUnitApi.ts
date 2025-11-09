import axiosClient from "../utils/axiosClient";

export interface VehicleUnitSummary {
  id: string;
  vin: string;
  engineNumber?: string | null;
  batterySerial?: string | null;
  color?: string | null;
  status: string;
  storageType: string;
  dealerId?: string | null;
  dealer?: {
    id: string;
    name: string;
    code?: string | null;
    city?: string | null;
  } | null;
  reservedAt?: string | null;
  deliveredAt?: string | null;
  importedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  location?: string | null;
  vehicle?: {
    model: string;
    variant?: string | null;
    manufacturer?: {
      name: string;
    };
  };
  contract?: {
    id: string;
    contractCode: string;
    status: string;
  } | null;
}

export const vehicleUnitApi = {
  getAvailableUnits: (vehicleId: string, dealerId: string) =>
    axiosClient.get<{ data: VehicleUnitSummary[] }>(
      "/vehicle-units/available",
      {
        params: {
          vehicleId,
          dealerId,
        },
      }
    ),
  list: (
    params: {
      vehicleId?: string;
      dealerId?: string;
      status?: string | string[];
      storageType?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ) =>
    axiosClient.get<{ data: VehicleUnitSummary[] }>("/vehicle-units", {
      params: {
        ...params,
        status: Array.isArray(params.status)
          ? params.status.join(",")
          : params.status,
      },
    }),
};
