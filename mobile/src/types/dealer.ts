// ============================================
// 3. src/types/dealer.ts
// ============================================
export interface Dealer {
  id: string;
  name: string;
  code: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  region?: {
    name: string;
  };
  inventories?: {
    available: number;
  }[];
}

export interface DealerAvailability {
  available: boolean;
  quantity: number;
  vehicle: {
    model: string;
    variant?: string;
    retailPrice: number;
  };
  dealer: {
    name: string;
    city: string;
    phone?: string;
  };
}