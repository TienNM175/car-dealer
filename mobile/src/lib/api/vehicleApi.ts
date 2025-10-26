import axiosClient from '../utils/axiosClient';

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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const vehicleApi = {
  // Get all vehicles with filters
  getAllVehicles: (
    filters?: VehicleFilters,
    pagination?: PaginationParams
  ) => {
    const params: any = {};

    // Add pagination params
    if (pagination?.page) params.page = pagination.page.toString();
    if (pagination?.limit) params.limit = pagination.limit.toString();
    if (pagination?.sortBy) params.sortBy = pagination.sortBy;
    if (pagination?.sortOrder) params.sortOrder = pagination.sortOrder;

    // Add filter params
    if (filters?.search) params.search = filters.search;
    if (filters?.manufacturerId) params.manufacturerId = filters.manufacturerId;
    if (filters?.status) params.status = filters.status;
    if (filters?.minPrice) params.minPrice = filters.minPrice.toString();
    if (filters?.maxPrice) params.maxPrice = filters.maxPrice.toString();
    if (filters?.year) params.year = filters.year.toString();
    if (filters?.bodyType) params.bodyType = filters.bodyType;
    if (filters?.color) params.color = filters.color;

    return axiosClient.get('/vehicles', { params });
  },

  // Get dealer vehicles (vehicles available in dealer inventory)
  getDealerVehicles: (
    dealerId: string,
    filters?: VehicleFilters,
    pagination?: PaginationParams
  ) => {
    const params: any = {};

    // Add pagination params
    if (pagination?.page) params.page = pagination.page.toString();
    if (pagination?.limit) params.limit = pagination.limit.toString();
    if (pagination?.sortBy) params.sortBy = pagination.sortBy;
    if (pagination?.sortOrder) params.sortOrder = pagination.sortOrder;

    // Add filter params
    if (filters?.search) params.search = filters.search;
    if (filters?.manufacturerId) params.manufacturerId = filters.manufacturerId;
    if (filters?.status) params.status = filters.status;
    if (filters?.minPrice) params.minPrice = filters.minPrice.toString();
    if (filters?.maxPrice) params.maxPrice = filters.maxPrice.toString();
    if (filters?.year) params.year = filters.year.toString();
    if (filters?.bodyType) params.bodyType = filters.bodyType;
    if (filters?.color) params.color = filters.color;

    return axiosClient.get(`/vehicles/dealer/${dealerId}`, { params });
  },

  // Get vehicle by ID
  getVehicleById: (id: string) => {
    return axiosClient.get(`/vehicles/${id}`);
  },

  // Create vehicle
  createVehicle: (data: CreateVehicleInput) => {
    return axiosClient.post('/vehicles', data);
  },

  // Update vehicle
  updateVehicle: (id: string, data: UpdateVehicleInput) => {
    return axiosClient.put(`/vehicles/${id}`, data);
  },

  // Delete vehicle
  deleteVehicle: (id: string) => {
    return axiosClient.delete(`/vehicles/${id}`);
  },

  // Get all manufacturers
  getAllManufacturers: () => {
    return axiosClient.get('/vehicles/manufacturers');
  },

  // Get vehicles by manufacturer
  getVehiclesByManufacturer: (manufacturerId: string) => {
    return axiosClient.get(`/vehicles/manufacturer/${manufacturerId}`);
  },

  // Compare vehicles
  compareVehicles: (vehicleIds: string[]) => {
    return axiosClient.post('/vehicles/compare', { vehicleIds });
  },

  // Upload vehicle images (note: FormData handling might need adjustment for React Native)
  uploadImages: (vehicleId: string, formData: FormData) => {
    return axiosClient.post(`/vehicles/${vehicleId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete vehicle image
  deleteImage: (vehicleId: string, imageId: string) => {
    return axiosClient.delete(`/vehicles/${vehicleId}/images/${imageId}`);
  },

  // Set main image
  setMainImage: (vehicleId: string, imageId: string) => {
    return axiosClient.patch(`/vehicles/${vehicleId}/images/${imageId}/main`);
  },

  // Reorder images
  reorderImages: (
    vehicleId: string,
    imageOrders: { imageId: string; order: number }[]
  ) => {
    return axiosClient.put(`/vehicles/${vehicleId}/images/reorder`, {
      imageOrders,
    });
  },

  // Update vehicle status
  updateVehicleStatus: (vehicleId: string, status: string) => {
    return axiosClient.patch(`/vehicles/${vehicleId}/status`, { status });
  },

  // Get vehicle statistics (additional useful endpoint)
  getVehicleStatistics: () => {
    return axiosClient.get('/vehicles/statistics');
  },

  // Get featured vehicles (for homepage/dealer dashboard)
  getFeaturedVehicles: (limit?: number) => {
    const params: any = {};
    if (limit) params.limit = limit.toString();
    return axiosClient.get('/vehicles/featured', { params });
  },
};