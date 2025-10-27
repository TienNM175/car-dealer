import axios from "axios";
import * as SecureStore from 'expo-secure-store';

// ✅ Types
export interface InventoryFilters {
    vehicleId?: string;
    dealerId?: string;
    lowStock?: boolean;
    minQuantity?: number;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface UpdateEVMInventoryInput {
    quantity?: number;
    reserved?: number;
    location?: string;
}

export interface UpdateDealerInventoryInput {
    quantity?: number;
    reserved?: number;
    sold?: number;
    location?: string;
}

export interface TransferInventoryInput {
    vehicleId: string;
    fromDealerId: string;
    toDealerId: string;
    quantity: number;
    notes?: string;
}

export interface ReserveInventoryInput {
    quantity?: number;
}

export interface CompleteSaleInput {
    quantity?: number;
}

export interface CancelReservationInput {
    quantity?: number;
}

export interface EVMInventory {
    id: string;
    vehicleId: string;
    quantity: number;
    reserved: number;
    available: number;
    location?: string;
    vehicle: {
        id: string;
        model: string;
        manufacturer: {
            id: string;
            name: string;
            code: string;
        };
        images: { url: string; isMain: boolean }[];
    };
    createdAt: string;
    updatedAt: string;
}

export interface DealerInventory {
    id: string;
    dealerId: string;
    vehicleId: string;
    quantity: number;
    reserved: number;
    sold: number;
    available: number;
    location?: string;
    dealer: {
        id: string;
        name: string;
        code: string;
        city?: string;
    };
    vehicle: {
        id: string;
        model: string;
        manufacturer: {
            id: string;
            name: string;
            code: string;
        };
        images: { url: string; isMain: boolean }[];
    };
    createdAt: string;
    updatedAt: string;
}

export interface TransferInventoryResponse {
    from: DealerInventory;
    to: DealerInventory;
    transferDetails: {
        vehicleId: string;
        fromDealerId: string;
        toDealerId: string;
        quantity: number;
        notes?: string;
        transferredAt: string;
    };
}

export interface LowStockAlerts {
    evm: EVMInventory[];
    dealers: DealerInventory[];
    summary: {
        evmCount: number;
        dealerCount: number;
        totalAffected: number;
    };
}

export interface InventorySummary {
    evm: {
        totalQuantity: number;
        totalReserved: number;
        totalAvailable: number;
        vehicleTypes: number;
    };
    dealers: {
        totalQuantity: number;
        totalReserved: number;
        totalSold: number;
        totalAvailable: number;
        vehicleTypes: number;
    };
    byDealer: {
        dealer: {
            id: string;
            name: string;
            code: string;
            city?: string;
        };
        totalQuantity: number;
        totalReserved: number;
        totalSold: number;
        totalAvailable: number;
        vehicleTypes: number;
    }[];
}

// ✅ API Base URL
const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.3:5000/api/v1";

// ✅ Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// ✅ Add token to requests
apiClient.interceptors.request.use(async (config) => {
    try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Error getting token from SecureStore:", error);
    }
    return config;
});

// ✅ Handle 401 errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                await SecureStore.deleteItemAsync("auth_token");
                await SecureStore.deleteItemAsync("refresh_token");
                console.log("Token expired, cleared tokens");
            } catch (clearErr) {
                console.error("Error clearing tokens:", clearErr);
            }
        }
        return Promise.reject(error);
    }
);

export const inventoryApi = {
    getEVMInventory: (filters?: InventoryFilters, pagination?: PaginationParams) => {
        const params = new URLSearchParams();

        if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
        if (filters?.lowStock !== undefined) params.append('lowStock', String(filters.lowStock));
        if (filters?.minQuantity !== undefined) params.append('minQuantity', String(filters.minQuantity));

        if (pagination?.page) params.append('page', String(pagination.page));
        if (pagination?.limit) params.append('limit', String(pagination.limit));
        if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
        if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

        return apiClient.get<{ data: EVMInventory[] }>(`/inventory/evm?${params.toString()}`);
    },

    getEVMInventoryByVehicle: (vehicleId: string) =>
        apiClient.get<{ data: EVMInventory }>(`/inventory/evm/vehicle/${vehicleId}`),

    updateEVMInventory: (vehicleId: string, data: UpdateEVMInventoryInput) =>
        apiClient.put<{ data: EVMInventory }>(`/inventory/evm/${vehicleId}`, data),

    getAllDealerInventories: (filters?: InventoryFilters, pagination?: PaginationParams) => {
        const params = new URLSearchParams();

        if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
        if (filters?.dealerId) params.append('dealerId', filters.dealerId);
        if (filters?.lowStock !== undefined) params.append('lowStock', String(filters.lowStock));
        if (filters?.minQuantity !== undefined) params.append('minQuantity', String(filters.minQuantity));

        if (pagination?.page) params.append('page', String(pagination.page));
        if (pagination?.limit) params.append('limit', String(pagination.limit));
        if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
        if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

        return apiClient.get<{ data: DealerInventory[] }>(`/inventory/dealers?${params.toString()}`);
    },

    getDealerInventory: (dealerId: string, filters?: InventoryFilters) => {
        const params = new URLSearchParams();

        if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
        if (filters?.lowStock !== undefined) params.append('lowStock', String(filters.lowStock));

        return apiClient.get<{ data: DealerInventory[] }>(`/inventory/dealers/${dealerId}?${params.toString()}`);
    },

    getDealerInventoryItem: (dealerId: string, vehicleId: string) =>
        apiClient.get<{ data: DealerInventory }>(`/inventory/dealers/${dealerId}/vehicle/${vehicleId}`),

    updateDealerInventory: (dealerId: string, vehicleId: string, data: UpdateDealerInventoryInput) =>
        apiClient.put<{ data: DealerInventory }>(`/inventory/dealers/${dealerId}/${vehicleId}`, data),

    transferInventory: (data: TransferInventoryInput) =>
        apiClient.post<{ data: TransferInventoryResponse }>(`/inventory/transfer`, data),

    reserveInventory: (dealerId: string, vehicleId: string, data: ReserveInventoryInput) =>
        apiClient.post<{ data: DealerInventory }>(`/inventory/dealers/${dealerId}/${vehicleId}/reserve`, data),

    completeSale: (dealerId: string, vehicleId: string, data: CompleteSaleInput) =>
        apiClient.post<{ data: DealerInventory }>(`/inventory/dealers/${dealerId}/${vehicleId}/complete-sale`, data),

    cancelReservation: (dealerId: string, vehicleId: string, data: CancelReservationInput) =>
        apiClient.post<{ data: DealerInventory }>(`/inventory/dealers/${dealerId}/${vehicleId}/cancel-reservation`, data),

    getLowStockAlerts: (threshold?: number) => {
        const params = new URLSearchParams();

        if (threshold !== undefined) params.append('threshold', String(threshold));

        return apiClient.get<{ data: LowStockAlerts }>(`/inventory/low-stock?${params.toString()}`);
    },

    getInventorySummary: () =>
        apiClient.get<{ data: InventorySummary }>(`/inventory/summary`),
};

export default inventoryApi;
