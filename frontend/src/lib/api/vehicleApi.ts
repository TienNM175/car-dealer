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
  evmInventories?: {
    quantity: number;
    reserved: number;
    available: number;
  };
  dealerInventories?: Array<{
    quantity: number;
    reserved: number;
    available: number;
    dealer: {
      name: string;
      city: string;
    };
  }>;
  _count?: {
    // evmInventories: number; // Removed - not a count relation
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
  publicId?: string;
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
  initialStock?: number;
}

export interface UpdateVehicleInput extends Partial<CreateVehicleInput> { }

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

  // Get dealer vehicles (vehicles available in dealer inventory)
  getDealerVehicles: async (
    dealerId: string,
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

    return axiosClient.get(`/vehicles/dealer/${dealerId}?${params.toString()}`);
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
    return axiosClient.put(`/vehicles/${id}`, data);
  },

  // Delete vehicle
  deleteVehicle: async (id: string) => {
    return axiosClient.delete(`/vehicles/${id}`);
  },

  // Get all manufacturers
  getAllManufacturers: async () => {
    return axiosClient.get("/vehicles/manufacturers");
  },

  // Get vehicles by manufacturer
  getVehiclesByManufacturer: async (manufacturerId: string) => {
    return axiosClient.get(`/vehicles/manufacturer/${manufacturerId}`);
  },

  // Compare vehicles
  compareVehicles: async (vehicleIds: string[]) => {
    return axiosClient.post("/vehicles/compare", { vehicleIds });
  },

  // Upload vehicle images
  uploadImages: async (vehicleId: string, formData: FormData) => {
    return axiosClient.post(`/vehicles/${vehicleId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Delete vehicle image
  deleteImage: async (vehicleId: string, imageId: string) => {
    return axiosClient.delete(`/vehicles/${vehicleId}/images/${imageId}`);
  },

  // Set main image
  setMainImage: async (vehicleId: string, imageId: string) => {
    return axiosClient.patch(`/vehicles/${vehicleId}/images/${imageId}/main`);
  },

  // Reorder images
  reorderImages: async (
    vehicleId: string,
    imageOrders: { imageId: string; order: number }[]
  ) => {
    return axiosClient.put(`/vehicles/${vehicleId}/images/reorder`, {
      imageOrders,
    });
  },

  // Update vehicle status
  updateVehicleStatus: async (vehicleId: string, status: string) => {
    return axiosClient.patch(`/vehicles/${vehicleId}/status`, { status });
  },
};
