import { Request, Response, NextFunction } from "express";
import { VehicleExportDocumentService } from "./vehicle-export-document.service";
import { ResponseUtil } from "../../utils/response.util";
import { ExportDocumentStatus } from "@prisma/client";

const service = new VehicleExportDocumentService();

export class VehicleExportDocumentController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const statusQuery = req.query.status as string | undefined;
      const statusFilter = statusQuery as ExportDocumentStatus | undefined;
      const filters = {
        search: req.query.search as string,
        dealerId: req.query.dealerId as string,
        status: statusFilter,
        vehicleId: req.query.vehicleId as string,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
      };

      const result = await service.listExportDocuments(
        filters,
        pagination,
        req.user?.role,
        req.user?.dealerId
      );

      return ResponseUtil.success(
        res,
        result.data,
        "Export documents retrieved successfully",
        200,
        result.meta
      );
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await service.getExportDocumentById(
        id,
        req.user?.role,
        req.user?.dealerId
      );
      return ResponseUtil.success(
        res,
        document,
        "Export document retrieved successfully"
      );
    } catch (error: any) {
      if (error.message === "Export document not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("only access")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { buffer, fileName } = await service.generateExportDocumentPdf(
        id,
        req.user?.role,
        req.user?.dealerId
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"${fileName}\"`
      );
      res.setHeader("Content-Length", buffer.length);

      return res.status(200).send(buffer);
    } catch (error: any) {
      if (error.message === "Export document not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("only access")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await service.createExportDocument(
        req.body,
        req.user?.userId || "",
        req.user?.role,
        req.user?.dealerId
      );
      return ResponseUtil.created(
        res,
        document,
        "Export document created successfully"
      );
    } catch (error: any) {
      if (error.message.includes("required") || error.message.includes("not")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes("only create")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await service.approveExportDocument(
        id,
        req.user?.userId || "",
        req.user?.role,
        req.user?.dealerId
      );
      return ResponseUtil.success(
        res,
        document,
        "Export document approved successfully"
      );
    } catch (error: any) {
      if (error.message === "Export document not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Only draft")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes("only approve")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body as { reason?: string };
      const document = await service.cancelExportDocument(
        id,
        reason,
        req.user?.userId || "",
        req.user?.role,
        req.user?.dealerId
      );
      return ResponseUtil.success(
        res,
        document,
        "Export document cancelled successfully"
      );
    } catch (error: any) {
      if (error.message === "Export document not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Only draft")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes("only cancel")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }
}
