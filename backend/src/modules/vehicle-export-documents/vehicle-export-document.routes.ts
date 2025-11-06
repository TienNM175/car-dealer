import { Router } from "express";
import { VehicleExportDocumentController } from "./vehicle-export-document.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import {
  createExportDocumentValidation,
  exportDocumentIdValidation,
  listExportDocumentsValidation,
  cancelExportDocumentValidation,
} from "./vehicle-export-document.validation";

const router = Router();
const controller = new VehicleExportDocumentController();

router.get(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  listExportDocumentsValidation,
  ValidationMiddleware.validate,
  controller.list
);

router.get(
  "/:id/pdf",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  exportDocumentIdValidation,
  ValidationMiddleware.validate,
  controller.downloadPdf
);

router.get(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  exportDocumentIdValidation,
  ValidationMiddleware.validate,
  controller.getById
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  createExportDocumentValidation,
  ValidationMiddleware.validate,
  controller.create
);

router.patch(
  "/:id/approve",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  exportDocumentIdValidation,
  ValidationMiddleware.validate,
  controller.approve
);

router.patch(
  "/:id/cancel",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  cancelExportDocumentValidation,
  ValidationMiddleware.validate,
  controller.cancel
);

export default router;
