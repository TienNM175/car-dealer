// ============================================
// INVENTORY TYPES
// ============================================

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
