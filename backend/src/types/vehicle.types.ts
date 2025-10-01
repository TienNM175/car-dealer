import type {
  Vehicle,
  Manufacturer,
  VehicleImage,
  EVMInventory,
} from "@prisma/client";

// Vehicle với relationships
export type VehicleWithRelations = Vehicle & {
  manufacturer: Manufacturer;
  images: VehicleImage[];
  evmInventories: EVMInventory[];
};

// Vehicle comparison result
export type VehicleComparison = VehicleWithRelations & {
  costPerKm: number;
  costPerKwh: number;
  totalAvailable: number;
};

// Manufacturer với vehicle count
export type ManufacturerWithCount = Manufacturer & {
  _count: {
    vehicles: number;
  };
};

// Filter options cho vehicle search
export interface VehicleFilters {
  manufacturerId?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  bodyType?: string;
  status?: string;
  year?: number;
  minRange?: number;
  search?: string;
}
