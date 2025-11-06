import prisma from "../../config/database";
import {
  Prisma,
  VehicleColor,
  VehicleUnitStatus,
  VehicleUnitStorageType,
} from "@prisma/client";

interface VehicleUnitFilters {
  search?: string;
  vehicleId?: string;
  dealerId?: string;
  status?: VehicleUnitStatus | VehicleUnitStatus[];
  storageType?: VehicleUnitStorageType;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface CreateVehicleUnitInput {
  vehicleId: string;
  vin: string;
  engineNumber?: string;
  batterySerial?: string;
  color?: VehicleColor;
  status?: VehicleUnitStatus;
  storageType?: VehicleUnitStorageType;
  dealerId?: string;
  location?: string;
  manufacturedAt?: Date;
  importedAt?: Date;
}

interface UpdateVehicleUnitInput {
  engineNumber?: string | null;
  batterySerial?: string | null;
  color?: VehicleColor | null;
  status?: VehicleUnitStatus;
  storageType?: VehicleUnitStorageType;
  dealerId?: string | null;
  location?: string | null;
  manufacturedAt?: Date | null;
  importedAt?: Date | null;
  reservedAt?: Date | null;
  deliveredAt?: Date | null;
}

export class VehicleUnitService {
  private unitInclude = {
    vehicle: {
      include: {
        manufacturer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        images: {
          where: { isMain: true },
          take: 1,
        },
      },
    },
    dealer: {
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
      },
    },
    contract: {
      select: {
        id: true,
        contractCode: true,
        status: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
    exportDocuments: {
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        code: true,
        status: true,
        createdAt: true,
        approvedAt: true,
      },
    },
  } as const;

  private normalizeStatusFilter(
    status?: VehicleUnitStatus | VehicleUnitStatus[]
  ): VehicleUnitStatus | VehicleUnitStatus[] | undefined {
    if (!status) return undefined;
    if (Array.isArray(status)) return status;
    return status;
  }

  async listVehicleUnits(
    filters: VehicleUnitFilters,
    pagination: PaginationParams,
    userRole?: string,
    userDealerId?: string
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy ?? "createdAt";
    const sortOrder = pagination.sortOrder ?? "desc";

    const normalizedStatus = this.normalizeStatusFilter(filters.status);

    const where: Prisma.VehicleUnitWhereInput = {
      ...(filters.search && {
        OR: [
          { vin: { contains: filters.search, mode: "insensitive" } },
          { engineNumber: { contains: filters.search, mode: "insensitive" } },
          { batterySerial: { contains: filters.search, mode: "insensitive" } },
          {
            vehicle: {
              model: { contains: filters.search, mode: "insensitive" },
            },
          },
        ],
      }),
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.dealerId && { dealerId: filters.dealerId }),
      ...(normalizedStatus && {
        status: Array.isArray(normalizedStatus)
          ? { in: normalizedStatus }
          : normalizedStatus,
      }),
      ...(filters.storageType && { storageType: filters.storageType }),
      // Dealer staff only see their dealer units
      ...((userRole === "DEALER_MANAGER" || userRole === "DEALER_STAFF") &&
      userDealerId
        ? { dealerId: userDealerId }
        : {}),
    };

    const [total, units] = await prisma.$transaction([
      prisma.vehicleUnit.count({ where }),
      prisma.vehicleUnit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.unitInclude,
      }),
    ]);

    return {
      data: units,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVehicleUnitById(
    id: string,
    userRole?: string,
    userDealerId?: string
  ) {
    const vehicleUnit = await prisma.vehicleUnit.findUnique({
      where: { id },
      include: this.unitInclude,
    });

    if (!vehicleUnit) {
      throw new Error("Vehicle unit not found");
    }

    if (
      (userRole === "DEALER_MANAGER" || userRole === "DEALER_STAFF") &&
      vehicleUnit.dealerId !== userDealerId
    ) {
      throw new Error("You can only access vehicle units from your dealer");
    }

    return vehicleUnit;
  }

  async createVehicleUnit(data: CreateVehicleUnitInput, userId: string) {
    if (!data.vehicleId) {
      throw new Error("Vehicle ID is required");
    }
    if (!data.vin) {
      throw new Error("VIN is required");
    }

    const existingVin = await prisma.vehicleUnit.findUnique({
      where: { vin: data.vin },
    });

    if (existingVin) {
      throw new Error("VIN already exists in the system");
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    const storageType = data.storageType || (data.dealerId ? "DEALER" : "EVM");

    if (storageType === "DEALER" && !data.dealerId) {
      throw new Error("Dealer ID is required when storage type is DEALER");
    }

    if (data.dealerId) {
      const dealer = await prisma.dealer.findUnique({
        where: { id: data.dealerId },
      });
      if (!dealer) {
        throw new Error("Dealer not found");
      }
    }

    const vehicleUnit = await prisma.vehicleUnit.create({
      data: {
        vehicleId: data.vehicleId,
        vin: data.vin,
        engineNumber: data.engineNumber,
        batterySerial: data.batterySerial,
        color: data.color,
        status: data.status || "IN_STOCK",
        storageType,
        dealerId: data.dealerId,
        location: data.location,
        manufacturedAt: data.manufacturedAt,
        importedAt: data.importedAt ?? new Date(),
        createdById: userId,
      },
      include: this.unitInclude,
    });

    return vehicleUnit;
  }

  async updateVehicleUnit(
    id: string,
    data: UpdateVehicleUnitInput,
    userId: string,
    userRole?: string,
    userDealerId?: string
  ) {
    const vehicleUnit = await prisma.vehicleUnit.findUnique({
      where: { id },
    });

    if (!vehicleUnit) {
      throw new Error("Vehicle unit not found");
    }

    if (
      (userRole === "DEALER_MANAGER" || userRole === "DEALER_STAFF") &&
      vehicleUnit.dealerId !== userDealerId
    ) {
      throw new Error("You can only update vehicle units from your dealer");
    }

    if (data.dealerId) {
      const dealer = await prisma.dealer.findUnique({
        where: { id: data.dealerId },
      });
      if (!dealer) {
        throw new Error("Dealer not found");
      }
    }

    const nextStorageType = (() => {
      if (data.storageType) {
        return data.storageType;
      }
      if (data.dealerId === null) {
        return "EVM";
      }
      if (data.dealerId) {
        return "DEALER";
      }
      return vehicleUnit.storageType;
    })();

    const statusUpdate: Partial<UpdateVehicleUnitInput> = {};
    if (data.status && data.status !== vehicleUnit.status) {
      if (data.status === "IN_STOCK") {
        statusUpdate.reservedAt = null;
        statusUpdate.deliveredAt = null;
      }
      if (data.status === "RESERVED" && !vehicleUnit.reservedAt) {
        statusUpdate.reservedAt = new Date();
      }
      if (data.status === "DELIVERED") {
        statusUpdate.deliveredAt = new Date();
      }
    }

    const updated = await prisma.vehicleUnit.update({
      where: { id },
      data: {
        engineNumber: data.engineNumber ?? undefined,
        batterySerial: data.batterySerial ?? undefined,
        color: data.color ?? undefined,
        status: data.status ?? undefined,
        storageType: nextStorageType,
        dealerId: data.dealerId ?? undefined,
        location: data.location ?? undefined,
        manufacturedAt: data.manufacturedAt ?? undefined,
        importedAt: data.importedAt ?? undefined,
        deliveredAt: data.deliveredAt ?? statusUpdate.deliveredAt,
        reservedAt: statusUpdate.reservedAt ?? undefined,
        updatedById: userId,
      },
      include: this.unitInclude,
    });

    return updated;
  }

  async getAvailableUnits(vehicleId: string, dealerId: string) {
    const units = await prisma.vehicleUnit.findMany({
      where: {
        vehicleId,
        dealerId,
        status: "IN_STOCK",
      },
      orderBy: { createdAt: "asc" },
      include: this.unitInclude,
    });

    return units;
  }
}
