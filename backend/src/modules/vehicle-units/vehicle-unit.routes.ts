import { Router } from "express";
import { VehicleUnitController } from "./vehicle-unit.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import {
  createVehicleUnitValidation,
  updateVehicleUnitValidation,
  getAvailableVehicleUnitsValidation,
} from "./vehicle-unit.validation";

const router = Router();
const controller = new VehicleUnitController();

router.get(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireRole(
    "ADMIN",
    "EVM_STAFF",
    "DEALER_MANAGER",
    "DEALER_STAFF"
  ),
  controller.getVehicleUnits
);

router.get(
  "/available",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireRole(
    "ADMIN",
    "EVM_STAFF",
    "DEALER_MANAGER",
    "DEALER_STAFF"
  ),
  getAvailableVehicleUnitsValidation,
  ValidationMiddleware.validate,
  controller.getAvailableVehicleUnits
);

router.get(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  controller.getVehicleUnitById
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  createVehicleUnitValidation,
  ValidationMiddleware.validate,
  controller.createVehicleUnit
);

router.patch(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  updateVehicleUnitValidation,
  ValidationMiddleware.validate,
  controller.updateVehicleUnit
);

export default router;
