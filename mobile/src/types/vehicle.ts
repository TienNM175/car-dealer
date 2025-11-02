// ============================================
// 2. src/types/vehicle.ts
// ============================================
export interface Manufacturer {
  id: string;
  name: string;
  code: string;
  country: string;
  logo?: string;
}

export interface VehicleImage {
  id: string;
  url: string;
  publicId?: string;
  alt?: string;
  isMain: boolean;
  order: number;
}

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
  manufacturer: Manufacturer;
  images: VehicleImage[];
  dealerInventories?: DealerInventory[];
}

export interface DealerInventory {
  available: number;
  dealer: {
    id: string;
    name: string;
    city: string;
  };
}