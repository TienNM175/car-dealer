import { Router } from "express";
import { ContractController } from "./contract.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import {
  createContractValidation,
  updateContractValidation,
  updateContractStatusValidation,
  contractIdValidation,
  assignVehicleUnitValidation,
  createSalesFromDepositValidation,
} from "./contract.validation";

const router = Router();
const contractController = new ContractController();

// ============================================
// CONTRACT CRUD
// ============================================

/**
 * @route   GET /api/v1/contracts
 * @desc    Get all contracts with filters and pagination
 * @access  Private - Dealer Staff and above
 */
router.get(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  contractController.getAllContracts
);

/**
 * @route   GET /api/v1/contracts/by-status
 * @desc    Get contract count by status
 * @access  Private - EVM Staff, Admin, Dealer Manager
 */
router.get(
  "/by-status",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager, // ADMIN, EVM_STAFF, DEALER_MANAGER
  contractController.getContractsByStatus
);

/**
 * @route   GET /api/v1/contracts/statistics
 * @desc    Get contract statistics
 * @access  Private - Dealer Manager and above
 */
router.get(
  "/statistics",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  contractController.getStatistics
);

/**
 * @route   GET /api/v1/contracts/:id
 * @desc    Get contract by ID
 * @access  Private - Dealer Staff and above
 */
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  contractIdValidation,
  ValidationMiddleware.validate,
  contractController.getContractById
);

/**
 * @route   POST /api/v1/contracts
 * @desc    Create new contract
 * @access  Private - Dealer Staff and above
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  createContractValidation,
  ValidationMiddleware.validate,
  contractController.createContract
);

/**
 * @route   PUT /api/v1/contracts/:id
 * @desc    Update contract (only DRAFT/PENDING)
 * @access  Private - Dealer Staff and above
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  updateContractValidation,
  ValidationMiddleware.validate,
  contractController.updateContract
);

router.patch(
  "/:id/assign-vehicle-unit",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  assignVehicleUnitValidation,
  ValidationMiddleware.validate,
  contractController.assignVehicleUnit
);

/**
 * @route   PATCH /api/v1/contracts/:id/status
 * @desc    Update contract status
 * @access  Private - Dealer Staff and above
 */
router.patch(
  "/:id/status",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  updateContractStatusValidation,
  ValidationMiddleware.validate,
  contractController.updateContractStatus
);

/**
 * @route   DELETE /api/v1/contracts/:id
 * @desc    Delete contract (only DRAFT)
 * @access  Private - Dealer Manager and above
 */
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  contractIdValidation,
  ValidationMiddleware.validate,
  contractController.deleteContract
);

/**
 * @route   POST /api/v1/contracts/:id/create-sales
 * @desc    Create SALES contract from DEPOSIT contract
 * @access  Private - Dealer Staff and above
 */
router.post(
  "/:id/create-sales",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  createSalesFromDepositValidation,
  ValidationMiddleware.validate,
  contractController.createSalesFromDeposit
);

export default router;
