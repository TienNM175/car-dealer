import { Router } from "express";
import { DebtsController } from "./debts.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";

console.log("🔄 debts.routes.ts is being loaded...");

const router = Router();
const debtsController = new DebtsController();

console.log("🔧 Initializing debts routes...");

// ✅ ROUTE TEST - KHÔNG CẦN AUTH
router.get("/test", (req, res) => {
  console.log("🎯 /debts/test route called!");
  res.json({ 
    success: true, 
    message: "Debts routes are working!",
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/v1/debts/customers
 * @desc    Get customer debts report (installments)
 * @access  Private - Dealer Manager and above
 */
router.get(
  "/customers",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  debtsController.getCustomerDebts
);

/**
 * @route   GET /api/v1/debts/dealers
 * @desc    Get dealer debts to EVM
 * @access  Private - EVM Staff, Admin
 */
router.get(
  "/dealers",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  debtsController.getDealerDebts
);

/**
 * @route   GET /api/v1/debts/overview
 * @desc    Get debt overview
 * @access  Private - Dealer Manager and above
 */
router.get(
  "/overview",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  debtsController.getDebtOverview
);

console.log("✅ Debts routes defined");

export default router;