import { Router } from "express";
import { ReportsController } from "./reports.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";

const router = Router();
const reportsController = new ReportsController();

// ============================================
// DASHBOARD & OVERVIEW
// ============================================

/**
 * @swagger
 * /api/v1/reports/dashboard:
 *   get:
 *     summary: Get dashboard overview with key metrics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard overview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get(
  "/dashboard",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  reportsController.getDashboardOverview
);

/**
 * @route   GET /api/v1/reports/executive-summary
 * @desc    Get executive summary
 * @access  Private - EVM Staff, Admin
 */
router.get(
  "/executive-summary",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  reportsController.getExecutiveSummary
);

// ============================================
// DETAILED REPORTS
// ============================================

/**
 * @swagger
 * /api/v1/reports/sales:
 *   get:
 *     summary: Get detailed sales report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *     responses:
 *       200:
 *         description: Sales report data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get(
  "/sales",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  reportsController.getSalesReport
);

/**
 * @route   GET /api/v1/reports/customers
 * @desc    Get customer analysis report
 * @access  Private - Dealer Manager and above
 */
router.get(
  "/customers",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  reportsController.getCustomerReport
);

/**
 * @route   GET /api/v1/reports/inventory
 * @desc    Get inventory report
 * @access  Private - Dealer Manager and above
 */
router.get(
  "/inventory",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  reportsController.getInventoryReport
);

/**
 * @route   GET /api/v1/reports/dealer-performance
 * @desc    Get dealer performance comparison
 * @access  Private - EVM Staff, Admin
 */
router.get(
  "/dealer-performance",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  reportsController.getDealerPerformanceReport
);

/**
 * @route   GET /api/v1/reports/vehicles-by-dealer
 * @desc    Get vehicles with inventory and sales by dealer
 * @access  Private - EVM Staff, Admin
 */
router.get(
  "/vehicles-by-dealer",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  reportsController.getVehiclesByDealerReport
);

/**
 * @route   GET /api/v1/reports/vehicles/:vehicleId
 * @desc    Get vehicle detail report (inventory + contracts)
 * @access  Private - EVM Staff, Admin
 */
router.get(
  "/vehicles/:vehicleId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  reportsController.getVehicleDetailReport
);

export default router;
