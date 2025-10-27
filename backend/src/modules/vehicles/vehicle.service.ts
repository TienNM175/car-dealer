import prisma from "../../config/database";
import { Prisma, VehicleStatus } from "@prisma/client";
import { CloudinaryService } from "./cloudinary.service";

interface VehicleFilters {
  search?: string;
  manufacturerId?: string;
  status?: VehicleStatus;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  bodyType?: string;
  color?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const cloudinaryService = new CloudinaryService();

export class VehicleService {
  async getAllVehicles(filters: VehicleFilters, pagination: PaginationParams) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";

    // Build where clause
    const where: Prisma.VehicleWhereInput = {
      ...(filters.search && {
        OR: [
          { model: { contains: filters.search, mode: "insensitive" } },
          { variant: { contains: filters.search, mode: "insensitive" } },
          {
            manufacturer: {
              name: { contains: filters.search, mode: "insensitive" },
            },
          },
        ],
      }),
      ...(filters.manufacturerId && { manufacturerId: filters.manufacturerId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.year && { year: filters.year }),
      ...(filters.bodyType && { bodyType: filters.bodyType as any }),
      ...(filters.color && { color: filters.color as any }),
      ...(filters.minPrice && { retailPrice: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { retailPrice: { lte: filters.maxPrice } }),
    };

    // Get total count
    const total = await prisma.vehicle.count({ where });

    // Get vehicles
    const vehicles = await prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        manufacturer: {
          select: {
            id: true,
            name: true,
            code: true,
            country: true,
            logo: true,
          },
        },
        images: {
          orderBy: { order: "asc" },
        },
        evmInventories: {
          select: {
            quantity: true,
            reserved: true,
            available: true,
          },
        },
        dealerInventories: {
          select: {
            quantity: true,
            reserved: true,
            available: true,
            dealer: {
              select: {
                name: true,
                city: true,
              },
            },
          },
        },
        _count: {
          select: {
            // evmInventories: true, // Removed - not a count relation (1-1 relation)
            dealerInventories: true,
            dealerOrders: true,
            quotations: true,
            contracts: true,
            testDrives: true,
          },
        },
      },
    });

    return {
      data: vehicles,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDealerVehicles(
    dealerId: string,
    filters: VehicleFilters,
    pagination: PaginationParams
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";

    const where: Prisma.VehicleWhereInput = {
      // For dealer: only show vehicles that have inventory at this dealer
      dealerInventories: {
        some: {
          dealerId: dealerId,
          quantity: { gt: 0 }, // Only vehicles with stock > 0
        },
      },
      ...(filters.search && {
        OR: [
          { model: { contains: filters.search, mode: "insensitive" } },
          { variant: { contains: filters.search, mode: "insensitive" } },
          {
            manufacturer: {
              name: { contains: filters.search, mode: "insensitive" },
            },
          },
        ],
      }),
      ...(filters.manufacturerId && { manufacturerId: filters.manufacturerId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.year && { year: filters.year }),
      ...(filters.bodyType && { bodyType: filters.bodyType as any }),
      ...(filters.color && { color: filters.color as any }),
      ...(filters.minPrice && { retailPrice: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { retailPrice: { lte: filters.maxPrice } }),
    };

    const total = await prisma.vehicle.count({ where });

    const vehicles = await prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        manufacturer: {
          select: {
            id: true,
            name: true,
            code: true,
            country: true,
          },
        },
        images: {
          where: { isMain: true },
          take: 1,
        },
        evmInventories: {
          select: {
            quantity: true,
            reserved: true,
            available: true,
          },
        },
        dealerInventories: {
          where: { dealerId },
          select: {
            quantity: true,
            available: true,
            reserved: true,
          },
        },
        _count: {
          select: {
            // evmInventories: true, // Removed - not a count relation (1-1 relation)
            dealerInventories: true,
            dealerOrders: true,
            quotations: true,
            contracts: true,
            testDrives: true,
          },
        },
      },
    });

    const meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return { data: vehicles, meta };
  }

  async getVehicleById(id: string) {
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
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
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

  async createVehicle(data: Prisma.VehicleCreateInput) {
    const vehicle = await prisma.$transaction(async (tx) => {
      // Create vehicle
      const newVehicle = await tx.vehicle.create({
        data,
        include: {
          manufacturer: true,
          images: true,
        },
      });

      // Automatically create EVM inventory for new vehicle
      await tx.eVMInventory.create({
        data: {
          vehicleId: newVehicle.id,
          quantity: 10, // Default stock for new vehicles
          reserved: 0,
          available: 10, // Same as quantity initially
          location: "EVM Warehouse",
        },
      });

      return newVehicle;
    });

    return vehicle;
  }

  async updateVehicle(id: string, data: Prisma.VehicleUpdateInput) {
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

  async deleteVehicle(id: string) {
    // Check if vehicle has active contracts
    const activeContracts = await prisma.contract.count({
      where: {
        vehicleId: id,
        status: { in: ["PENDING", "SIGNED"] },
      },
    });

    if (activeContracts > 0) {
      throw new Error("Cannot delete vehicle with active contracts");
    }

    // Use transaction to delete related records first
    await prisma.$transaction(async (tx) => {
      // Delete related records in correct order
      await tx.vehicleImage.deleteMany({
        where: { vehicleId: id },
      });

      await tx.eVMInventory.deleteMany({
        where: { vehicleId: id },
      });

      await tx.inventory.deleteMany({
        where: { vehicleId: id },
      });

      // Finally delete the vehicle
      await tx.vehicle.delete({
        where: { id },
      });
    });

    return { message: "Vehicle deleted successfully" };
  }

  async compareVehicles(vehicleIds: string[]) {
    if (vehicleIds.length < 2 || vehicleIds.length > 4) {
      throw new Error("Please select 2-4 vehicles to compare");
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
      },
      include: {
        manufacturer: {
          select: {
            name: true,
            country: true,
          },
        },
        images: {
          where: { isMain: true },
          take: 1,
        },
      },
    });

    if (vehicles.length !== vehicleIds.length) {
      throw new Error("Some vehicles not found");
    }

    return vehicles;
  }

  async getVehiclesByManufacturer(manufacturerId: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        manufacturerId,
        status: "ACTIVE",
      },
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return vehicles;
  }

  async getAllManufacturers() {
    const manufacturers = await prisma.manufacturer.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return manufacturers;
  }

  async updateVehicleStatus(id: string, status: VehicleStatus) {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { status },
    });

    return vehicle;
  }

  async addVehicleImages(
    vehicleId: string,
    images: Array<{
      url: string;
      publicId: string;
      alt?: string;
      isMain?: boolean;
      order: number;
    }>
  ) {
    // Check vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // If setting new main image, unset previous main
    const hasNewMain = images.some((img) => img.isMain);
    if (hasNewMain) {
      await prisma.vehicleImage.updateMany({
        where: { vehicleId, isMain: true },
        data: { isMain: false },
      });
    }

    // Create images
    await prisma.vehicleImage.createMany({
      data: images.map((img) => ({
        vehicleId,
        url: img.url,
        publicId: img.publicId,
        alt: img.alt,
        isMain: img.isMain || false,
        order: img.order,
      })),
    });

    // Return vehicle with images
    return this.getVehicleById(vehicleId);
  }

  async deleteVehicleImage(vehicleId: string, imageId: string) {
    const image = await prisma.vehicleImage.findFirst({
      where: { id: imageId, vehicleId },
    });

    if (!image) {
      throw new Error("Image not found");
    }

    // Delete from Cloudinary
    if (image.publicId) {
      try {
        await cloudinaryService.deleteImage(image.publicId);
      } catch (error) {
        console.error("Failed to delete from Cloudinary:", error);
      }
    }

    // Delete from database
    await prisma.vehicleImage.delete({
      where: { id: imageId },
    });

    return { message: "Image deleted successfully" };
  }

  async setMainImage(vehicleId: string, imageId: string) {
    // Unset current main
    await prisma.vehicleImage.updateMany({
      where: { vehicleId, isMain: true },
      data: { isMain: false },
    });

    // Set new main
    const image = await prisma.vehicleImage.update({
      where: { id: imageId },
      data: { isMain: true },
    });

    return image;
  }

  async reorderImages(
    _vehicleId: string,
    imageOrders: { imageId: string; order: number }[]
  ) {
    const updatePromises = imageOrders.map(({ imageId, order }) =>
      prisma.vehicleImage.update({
        where: { id: imageId },
        data: { order },
      })
    );

    await Promise.all(updatePromises);
    return { message: "Images reordered successfully" };
  }
}
