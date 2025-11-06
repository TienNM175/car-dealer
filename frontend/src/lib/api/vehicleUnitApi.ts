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
  reservedAt?: string | null;
  deliveredAt?: string | null;
  createdAt?: string;
  location?: string | null;
  vehicle?: {
    model: string;
    variant?: string | null;
    manufacturer?: {
      name: string;
    };
  };
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
};
