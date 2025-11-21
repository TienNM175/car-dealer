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
 * @swagger
 * /api/v1/contracts:
 *   get:
 *     summary: Get all contracts with filters and pagination
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, SIGNED, DELIVERING, COMPLETED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: contractType
 *         schema:
 *           type: string
 *           enum: [SALES, DEPOSIT]
 *         description: Filter by contract type
 *     responses:
 *       200:
 *         description: List of contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     contracts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Contract'
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/contracts/{id}:
 *   get:
 *     summary: Get contract by ID
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Contract details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       404:
 *         description: Contract not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/contracts:
 *   post:
 *     summary: Create new contract
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractType
 *               - customerId
 *               - vehicleId
 *               - basePrice
 *             properties:
 *               contractType:
 *                 type: string
 *                 enum: [SALES, DEPOSIT]
 *                 example: SALES
 *               customerId:
 *                 type: string
 *                 example: uuid
 *               vehicleId:
 *                 type: string
 *                 example: uuid
 *               basePrice:
 *                 type: number
 *                 example: 1000000000
 *               discount:
 *                 type: number
 *                 example: 50000000
 *               depositAmount:
 *                 type: number
 *                 nullable: true
 *                 example: 10000000
 *               customerSignature:
 *                 type: string
 *                 nullable: true
 *                 description: Base64 encoded signature image
 *               dealerSignature:
 *                 type: string
 *                 nullable: true
 *                 description: Base64 encoded signature image
 *     responses:
 *       201:
 *         description: Contract created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/contracts/{id}:
 *   put:
 *     summary: Update contract
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               basePrice:
 *                 type: number
 *                 example: 1000000000
 *               discount:
 *                 type: number
 *                 example: 50000000
 *               depositAmount:
 *                 type: number
 *                 nullable: true
 *               customerSignature:
 *                 type: string
 *                 nullable: true
 *               dealerSignature:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Contract updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/contracts/{id}/status:
 *   patch:
 *     summary: Update contract status
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PENDING, SIGNED, DELIVERING, COMPLETED, CANCELLED]
 *                 example: PENDING
 *     responses:
 *       200:
 *         description: Contract status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       400:
 *         description: Invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/contracts/{id}/create-sales:
 *   post:
 *     summary: Create SALES contract from DEPOSIT contract
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deposit contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               basePrice:
 *                 type: number
 *                 example: 1000000000
 *               discount:
 *                 type: number
 *                 example: 50000000
 *     responses:
 *       201:
 *         description: Sales contract created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       400:
 *         description: Deposit contract must be signed or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
