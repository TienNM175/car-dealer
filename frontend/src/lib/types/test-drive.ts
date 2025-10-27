// src/types/test-drive.ts
export type TestDriveStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface Dealer {
    id: string;
    name: string;
    code: string;
    address?: Address;
    city?: string;
    phone?: string;
    email?: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    // role: string;
    role?: string;
    dealer?: Dealer;
}

export interface VehicleImage {
    id: string;
    url: string;
    isMain: boolean;
}

export interface Manufacturer {
    id: string;
    name: string;
}

export interface Vehicle {
    id: string;
    model: string;
    variant: string;
    year: number;
    price: number;
    status: string;
    manufacturer: Manufacturer;
    images: VehicleImage[];
}

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    address?: string;
    city?: string;
    identityCard?: string;
    createdAt?: string;
    updatedAt?: string;

    _count?: {
        testDrives: number;
        quotations: number;
        contracts: number;
    };
}




export interface TestDrive {
    id: string;
    customerId: string;
    vehicleId: string;
    staffId: string;
    scheduledDate: string;
    status: TestDriveStatus;
    notes?: string;
    feedback?: string;
    createdAt: string;
    updatedAt: string;
    // customer: Customer;
    customer?: Customer;
    vehicle: Vehicle;
    staff: User;
}

export interface TestDriveFilters {
    search?: string;
    customerId?: string;
    vehicleId?: string;
    staffId?: string;
    status?: TestDriveStatus;
    fromDate?: string;
    toDate?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface TestDriveListResponse {
    data: TestDrive[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// cái này là thống kê Lái thử
export interface TestDriveStats {
    total: number;
    byStatus: { status: string; count: number }[];
    rates: {
        completionRate: number;
        noShowRate: number;
    };
    topVehicles: { vehicle: Vehicle; count: number }[];
}