import { prisma } from "../lib/prisma";
import type {
  VehicleColor,
  VehicleBodyType,
  VehicleStatus,
  CurrencyCode,
} from "@prisma/client";

interface GetVehiclesFilters {
  manufacturerId?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: VehicleColor;
  bodyType?: VehicleBodyType;
  status?: VehicleStatus;
  year?: number;
  minRange?: number; // km
  search?: string;
}

interface VehicleCreateInput {
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
  color: VehicleColor;
  bodyType: VehicleBodyType;
  wholesalePrice: number;
  retailPrice: number;
  currency?: CurrencyCode;
  description?: string;
  specifications?: string;
}

export class VehicleService {
  /**
   * Lấy danh sách xe điện với filters
   * @param filters - Bộ lọc tìm kiếm
   * @returns Danh sách vehicles
   */
  static async getVehicles(filters: GetVehiclesFilters = {}) {
    const {
      manufacturerId,
      minPrice,
      maxPrice,
      color,
      bodyType,
      status = "ACTIVE",
      year,
      minRange,
      search,
    } = filters;

    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(manufacturerId && { manufacturerId }),
        ...(color && { color }),
        ...(bodyType && { bodyType }),
        ...(status && { status }),
        ...(year && { year }),
        ...(minRange && { range: { gte: minRange } }),
        ...(minPrice && { retailPrice: { gte: minPrice } }),
        ...(maxPrice && { retailPrice: { lte: maxPrice } }),
        ...(search && {
          OR: [
            { model: { contains: search, mode: "insensitive" } },
            { variant: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        manufacturer: true,
        images: {
          orderBy: { order: "asc" },
        },
        evmInventories: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return vehicles;
  }

  /**
   * Lấy chi tiết xe điện theo ID
   * @param id - Vehicle ID
   * @returns Vehicle details
   */
  static async getVehicleById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        manufacturer: true,
        images: {
          orderBy: { order: "asc" },
        },
        evmInventories: true,
        dealerInventories: {
          include: {
            dealer: {
              include: {
                region: true,
              },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    return vehicle;
  }

  /**
   * So sánh nhiều xe điện
   * @param vehicleIds - Array of vehicle IDs
   * @returns Comparison data
   */
  static async compareVehicles(vehicleIds: string[]) {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
      },
      include: {
        manufacturer: true,
        images: {
          where: { isMain: true },
        },
        evmInventories: true,
      },
    });

    if (vehicles.length === 0) {
      throw new Error("No vehicles found");
    }

    // Tính toán thêm một số metrics để so sánh
    const comparison = vehicles.map((vehicle) => ({
      ...vehicle,
      // Tính chi phí/km (cost per km range)
      costPerKm: Number(vehicle.retailPrice) / vehicle.range,
      // Tính chi phí/kWh
      costPerKwh: Number(vehicle.retailPrice) / vehicle.batteryCapacity,
      // Available inventory
      totalAvailable: vehicle.evmInventories.reduce(
        (sum, inv) => sum + inv.available,
        0
      ),
    }));

    return comparison;
  }

  /**
   * Tạo xe điện mới (chỉ EVM Staff & Admin)
   * @param data - Vehicle data
   * @returns Created vehicle
   */
  static async createVehicle(data: VehicleCreateInput) {
    // Validate manufacturer exists
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id: data.manufacturerId },
    });

    if (!manufacturer) {
      throw new Error("Manufacturer not found");
    }

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        manufacturerId: data.manufacturerId,
        model: data.model,
        variant: data.variant,
        year: data.year,
        batteryCapacity: data.batteryCapacity,
        range: data.range,
        chargingTime: data.chargingTime,
        motorPower: data.motorPower,
        topSpeed: data.topSpeed,
        acceleration: data.acceleration,
        seats: data.seats || 5,
        doors: data.doors || 4,
        color: data.color,
        bodyType: data.bodyType,
        wholesalePrice: data.wholesalePrice,
        retailPrice: data.retailPrice,
        currency: data.currency || "USD",
        description: data.description,
        specifications: data.specifications,
        status: "ACTIVE",
      },
      include: {
        manufacturer: true,
      },
    });

    // Tự động tạo EVMInventory với quantity = 0
    await prisma.eVMInventory.create({
      data: {
        vehicleId: vehicle.id,
        quantity: 0,
        reserved: 0,
        available: 0,
      },
    });

    return vehicle;
  }

  /**
   * Update thông tin xe
   * @param id - Vehicle ID
   * @param data - Update data
   * @returns Updated vehicle
   */
  static async updateVehicle(id: string, data: Partial<VehicleCreateInput>) {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
      include: {
        manufacturer: true,
        images: true,
      },
    });

    return vehicle;
  }

  /**
   * Xóa xe (soft delete bằng cách set status = INACTIVE)
   * @param id - Vehicle ID
   * @returns Deleted vehicle
   */
  static async deleteVehicle(id: string) {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return vehicle;
  }

  /**
   * Lấy danh sách manufacturers
   * @returns List of manufacturers
   */
  static async getManufacturers() {
    const manufacturers = await prisma.manufacturer.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return manufacturers;
  }

  /**
   * Lấy vehicles theo manufacturer
   * @param manufacturerId - Manufacturer ID
   * @returns Vehicles of manufacturer
   */
  static async getVehiclesByManufacturer(manufacturerId: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        manufacturerId,
        status: "ACTIVE",
      },
      include: {
        manufacturer: true,
        images: {
          orderBy: { order: "asc" },
        },
        evmInventories: true,
      },
    });

    return vehicles;
  }
}
