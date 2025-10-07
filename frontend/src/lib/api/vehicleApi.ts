// frontend/src/lib/api/vehicleApi.ts
import axiosClient from "@/lib/utils/axiosClient";

export interface Vehicle {
  id: string;
  manufacturerId: string;
  model: string;
  variant?: string;
  year: number;
  batteryCapacity: number;
  range: number;
  chargingTime?: number;
  motorPower?: number;
  topSpeed?: number;
  acceleration?: number;
  seats: number;
  doors: number;
  color: string;
  bodyType: string;
  wholesalePrice: number;
  retailPrice: number;
  currency: string;
  status: string;
  description?: string;
  specifications?: string;
  createdAt: string;
  updatedAt: string;
  manufacturer?: {
    id: string;
    name: string;
    code: string;
    country: string;
    logo?: string;
  };
  images?: VehicleImage[];
  _count?: {
    evmInventories: number;
    dealerInventories: number;
    dealerOrders: number;
    quotations: number;
    contracts: number;
    testDrives: number;
  };
}

export interface VehicleImage {
  id: string;
  vehicleId: string;
  url: string;
  alt?: string;
  blurhash?: string;
  isMain: boolean;
  order: number;
}

export interface CreateVehicleInput {
  manufacturerId: string;
  model: string;
  variant?: string;
  year: number;
  batteryCapacity: number;
  range: number;
  chargingTime?: number;
  motorPower?: number;
  topSpeed?: number;
  acceleration?: number;
  seats?: number;
  doors?: number;
  color: string;
  bodyType: string;
  wholesalePrice: number;
  retailPrice: number;
  currency?: string;
  status?: string;
  description?: string;
  specifications?: string;
}

export interface UpdateVehicleInput extends Partial<CreateVehicleInput> {}

export interface VehicleFilters {
  search?: string;
  manufacturerId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  bodyType?: string;
  color?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const vehicleApi = {
  // Get all vehicles with filters
  getAllVehicles: async (
    filters?: VehicleFilters,
    pagination?: PaginationParams
  ) => {
    const params = new URLSearchParams();

    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.limit) params.append("limit", pagination.limit.toString());
    if (filters?.search) params.append("search", filters.search);
    if (filters?.manufacturerId)
      params.append("manufacturerId", filters.manufacturerId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.minPrice)
      params.append("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice)
      params.append("maxPrice", filters.maxPrice.toString());
    if (filters?.year) params.append("year", filters.year.toString());
    if (filters?.bodyType) params.append("bodyType", filters.bodyType);
    if (filters?.color) params.append("color", filters.color);

    return axiosClient.get(`/vehicles?${params.toString()}`);
  },

  // Get vehicle by ID
  getVehicleById: async (id: string) => {
    return axiosClient.get(`/vehicles/${id}`);
  },

  // Create vehicle
  createVehicle: async (data: CreateVehicleInput) => {
    return axiosClient.post("/vehicles", data);
  },

  // Update vehicle
  updateVehicle: async (id: string, data: UpdateVehicleInput) => {
    return axiosClient.patch(`/vehicles/${id}`, data);
  },

  // Delete vehicle
  deleteVehicle: async (id: string) => {
    return axiosClient.delete(`/vehicles/${id}`);
  },

  // Get vehicle statistics
  getVehicleStats: async () => {
    return axiosClient.get("/vehicles/stats");
  },

  // Compare vehicles
  compareVehicles: async (vehicleIds: string[]) => {
    return axiosClient.post("/vehicles/compare", { vehicleIds });
  },
};
