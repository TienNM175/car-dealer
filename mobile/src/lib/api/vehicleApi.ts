import axiosClient from "../utils/axiosClient";

export interface Vehicle {
  id: string;
  model: string;
  variant?: string;
  year: number;
  manufacturer: {
    id: string;
    name: string;
  };
  batteryCapacity: number;
  range: number;
  retailPrice: number;
  wholesalePrice: number;
  images: { url: string; isMain: boolean }[];
  status: string;
  chargingTime?: number;
  motorPower?: number;
  topSpeed?: number;
  seats: number;
  doors: number;
  color: string;
  bodyType: string;
  description?: string;
  specifications?: string;
}

export interface VehicleFilters {
  search?: string;
  status?: string;
  manufacturer?: string;
  bodyType?: string;
  priceMin?: string;
  priceMax?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const vehicleApi = {
  // Get dealer vehicles
  getDealerVehicles: (
    dealerId: string,
    filters?: VehicleFilters,
    pagination?: PaginationParams
  ) => {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.manufacturer)
      params.append("manufacturerId", filters.manufacturer);
    if (filters?.bodyType) params.append("bodyType", filters.bodyType);
    if (filters?.priceMin) params.append("minPrice", filters.priceMin);
    if (filters?.priceMax) params.append("maxPrice", filters.priceMax);

    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.limit) params.append("limit", pagination.limit.toString());

    return axiosClient.get<{ data: { data: Vehicle[]; meta: any } }>(
      `/vehicles/dealer/${dealerId}?${params.toString()}`
    );
  },

  // Get vehicle by ID
  getVehicleById: (id: string) => {
    return axiosClient.get<{ data: Vehicle }>(`/vehicles/${id}`);
  },
};
