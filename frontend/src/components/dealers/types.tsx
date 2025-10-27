export interface Region {
    id: string;
    name: string;
    code: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface Dealer {
    id: string;
    name: string;
    code: string;
    regionId: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    taxId?: string;
    _count?: {
      users?: number;
      inventories?: number;
      dealerOrders?: number;
    };
  }
  
  // Staff interface
  export interface DealerStaff {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }
  
  // Target interface
  export interface DealerTarget {
    id: string;
    dealerId: string;
    year: number;
    month: number;
    targetAmount: number;
    achievedAmount?: number;
    productType?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    meta?: {
      pagination?: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
      };
    };
  }
  
  export interface DealerFilters {
    search?: string;
    status?: string;
    city?: string;
    isActive?: boolean;
    regionId?: string;
  }
  
  export interface CreateDealerInput {
    name: string;
    code: string;
    regionId: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
    taxId?: string;
    isActive?: boolean;
  }
  
  export interface UpdateDealerInput {
    name?: string;
    code?: string;
    regionId?: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
    taxId?: string;
    isActive?: boolean;
  }
  
  export interface DealerResponse {
    data: Dealer[];
    total: number;
    totalPages: number;
    currentPage: number;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    meta?: {
      pagination?: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
      };
    };
  }