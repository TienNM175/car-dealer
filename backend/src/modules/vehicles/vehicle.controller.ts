import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { VehicleService } from "./vehicle.service";
import { ResponseUtil } from "../../utils/response.util";
import { CloudinaryService } from "./cloudinary.service";

const vehicleService = new VehicleService();
const cloudinaryService = new CloudinaryService();

export class VehicleController {
  async getAllVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        manufacturerId: req.query.manufacturerId as string,
        status: req.query.status as any,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        bodyType: req.query.bodyType as string,
        color: req.query.color as string,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
      };

      const result = await vehicleService.getAllVehicles(filters, pagination);
      return ResponseUtil.success(
        res,
        result.data,
        "Vehicles retrieved successfully",
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  async getDealerVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId } = req.params;
      const filters = {
        search: req.query.search as string,
        manufacturerId: req.query.manufacturerId as string,
        status: req.query.status as any,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        bodyType: req.query.bodyType as string,
        color: req.query.color as string,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
      };

      const result = await vehicleService.getDealerVehicles(
        dealerId,
        filters,
        pagination
      );
      return ResponseUtil.success(
        res,
        result.data,
        "Dealer vehicles retrieved successfully",
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  async getVehicleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.getVehicleById(id);
      return ResponseUtil.success(
        res,
        vehicle,
        "Vehicle retrieved successfully"
      );
    } catch (error: any) {
      if (error.message === "Vehicle not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  async createVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { initialStock, initialUnits, ...rest } = req.body || {};
      const vehicleData = rest as Prisma.VehicleCreateInput;

      const vehicle = await vehicleService.createVehicle(vehicleData, {
        createdById: req.user?.userId,
        initialStock:
          typeof initialStock !== "undefined"
            ? Number(initialStock)
            : typeof initialUnits !== "undefined"
            ? Number(initialUnits)
            : undefined,
      });
      return ResponseUtil.created(res, vehicle, "Vehicle created successfully");
    } catch (error: any) {
      return next(error);
    }
  }

  async updateVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      console.log("🚗 Update Vehicle Request:", {
        id,
        body: req.body,
        headers: req.headers.authorization ? "Token present" : "No token",
      });
      const vehicle = await vehicleService.updateVehicle(id, req.body);
      return ResponseUtil.success(res, vehicle, "Vehicle updated successfully");
    } catch (error: any) {
      console.error("❌ Update Vehicle Error:", error);
      return next(error);
    }
  }

  async deleteVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await vehicleService.deleteVehicle(id);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message.includes("Cannot delete")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  async compareVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleIds } = req.body;
      const vehicles = await vehicleService.compareVehicles(vehicleIds);
      return ResponseUtil.success(
        res,
        vehicles,
        "Vehicles comparison retrieved"
      );
    } catch (error: any) {
      if (error.message.includes("select")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  async getVehiclesByManufacturer(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { manufacturerId } = req.params;
      const vehicles =
        await vehicleService.getVehiclesByManufacturer(manufacturerId);
      return ResponseUtil.success(res, vehicles);
    } catch (error: any) {
      return next(error);
    }
  }

  async getAllManufacturers(_req: Request, res: Response, next: NextFunction) {
    try {
      const manufacturers = await vehicleService.getAllManufacturers();
      return ResponseUtil.success(
        res,
        manufacturers,
        "Manufacturers retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  async updateVehicleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const vehicle = await vehicleService.updateVehicleStatus(id, status);
      return ResponseUtil.success(res, vehicle, "Vehicle status updated");
    } catch (error: any) {
      return next(error);
    }
  }

  async uploadImages(req: Request, res: Response, _next: NextFunction) {
    try {
      const { id: vehicleId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return ResponseUtil.badRequest(res, "No images uploaded");
      }

      // Upload to Cloudinary
      const uploadedImages = await cloudinaryService.uploadMultiple(
        files,
        `vehicles/${vehicleId}`
      );

      // Prepare data for database
      const imageData = uploadedImages.map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        alt: `Vehicle image ${index + 1}`,
        isMain: index === 0,
        order: index,
      }));

      // Save to database
      const vehicle = await vehicleService.addVehicleImages(
        vehicleId,
        imageData
      );

      return ResponseUtil.success(
        res,
        {
          vehicle,
          images: vehicle.images,
          message: `${files.length} image(s) uploaded successfully`,
        },
        `${files.length} image(s) uploaded successfully`,
        201
      );
    } catch (error: any) {
      if (error.message === "Vehicle not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message || "Upload failed", 500);
    }
  }

  async deleteImage(req: Request, res: Response, _next: NextFunction) {
    try {
      const { vehicleId, imageId } = req.params;
      const result = await vehicleService.deleteVehicleImage(
        vehicleId,
        imageId
      );
      return ResponseUtil.success(res, result, "Image deleted successfully");
    } catch (error: any) {
      if (error.message === "Image not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message, 500);
    }
  }

  async setMainImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId, imageId } = req.params;
      const image = await vehicleService.setMainImage(vehicleId, imageId);
      return ResponseUtil.success(res, image, "Main image updated");
    } catch (error: any) {
      return next(error);
    }
  }

  async reorderImages(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params;
      const { imageOrders } = req.body;

      if (!Array.isArray(imageOrders)) {
        return ResponseUtil.badRequest(res, "imageOrders must be an array");
      }

      const result = await vehicleService.reorderImages(vehicleId, imageOrders);
      return ResponseUtil.success(res, result, "Images reordered");
    } catch (error: any) {
      return next(error);
    }
  }
}
