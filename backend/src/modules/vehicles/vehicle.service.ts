import prisma from '../../config/database';
import { Prisma, VehicleStatus } from '@prisma/client';

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
  sortOrder?: 'asc' | 'desc';
}

export class VehicleService {
  async getAllVehicles(filters: VehicleFilters, pagination: PaginationParams) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    // Build where clause
    const where: Prisma.VehicleWhereInput = {
      ...(filters.search && {
        OR: [
          { model: { contains: filters.search, mode: 'insensitive' } },
          { variant: { contains: filters.search, mode: 'insensitive' } },
          { manufacturer: { name: { contains: filters.search, mode: 'insensitive' } } },
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
          orderBy: { order: 'asc' },
        },
        evmInventories: {
          select: {
            quantity: true,
            reserved: true,
            available: true,
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

  async getVehicleById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        manufacturer: true,
        images: {
          orderBy: { order: 'asc' },
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
      throw new Error('Vehicle not found');
    }

    return vehicle;
  }

  async createVehicle(data: Prisma.VehicleCreateInput) {
    const vehicle = await prisma.vehicle.create({
      data,
      include: {
        manufacturer: true,
        images: true,
      },
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
        status: { in: ['PENDING', 'SIGNED', 'DELIVERING'] },
      },
    });

    if (activeContracts > 0) {
      throw new Error('Cannot delete vehicle with active contracts');
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    return { message: 'Vehicle deleted successfully' };
  }

  async compareVehicles(vehicleIds: string[]) {
    if (vehicleIds.length < 2 || vehicleIds.length > 4) {
      throw new Error('Please select 2-4 vehicles to compare');
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
      throw new Error('Some vehicles not found');
    }

    return vehicles;
  }

  async getVehiclesByManufacturer(manufacturerId: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        manufacturerId,
        status: 'ACTIVE',
      },
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return vehicles;
  }

  async updateVehicleStatus(id: string, status: VehicleStatus) {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { status },
    });

    return vehicle;
  }
}