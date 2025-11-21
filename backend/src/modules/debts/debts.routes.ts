import { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";


const router = Router();

// DEBUG: Kiểm tra import controller
let DebtsController;
let debtsController;

try {
  console.log(" Attempting to import DebtsController...");
  const module = require("./debts.controller");
  DebtsController = module.DebtsController;
  console.log(" DebtsController imported successfully");
} catch (error) {
  console.error(" Failed to import DebtsController:", error);
  class TempDebtsController {
    constructor() {
      console.log(" TempDebtsController initialized");
    }
    
    async getCustomerDebts(req, res, next) {
      return res.status(500).json({ error: "DebtsController import failed" });
    }
    
    async getDealerDebts(req, res, next) {
      return res.status(500).json({ error: "DebtsController import failed" });
    }
    
    async getDebtOverview(req, res, next) {
      return res.status(500).json({ error: "DebtsController import failed" });
    }
    
    async getDealerDebtsDetail(req, res, next) {
      return res.json({
        success: true,
        message: "This is a temporary response - DebtsController import failed",
        data: {
          dealerDebts: [],
          detailedDebts: [],
          summary: {
            totalDebt: 0,
            totalOrders: 0,
            unpaidOrders: 0,
            overdueOrders: 0,
            totalPaid: 0
          }
        }
      });
    }
  }
  DebtsController = TempDebtsController;
}

try {
  console.log(" Attempting to initialize DebtsController...");
  debtsController = new DebtsController();
  console.log(" DebtsController initialized successfully");
} catch (error) {
  console.error(" Failed to initialize DebtsController:", error);
  // Fallback để server không crash
  debtsController = {
    getCustomerDebts: (req, res, next) => res.status(500).json({ error: "Controller init failed" }),
    getDealerDebts: (req, res, next) => res.status(500).json({ error: "Controller init failed" }),
    getDebtOverview: (req, res, next) => res.status(500).json({ error: "Controller init failed" }),
    getDealerDebtsDetail: (req, res, next) => {
      console.log(" Fallback getDealerDebtsDetail called");
      return res.json({
        success: true,
        message: "Fallback response - check server logs",
        data: { test: true }
      });
    }
  };
}


//  ROUTE TEST - KHÔNG CẦN AUTH
router.get("/test", (req, res) => {
  console.log(" /debts/test route called!");
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

router.get(
  "/dealers/detail",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  debtsController.getDealerDebtsDetail
);

// Thêm route mới cho dealer debts summary
router.get(
  "/dealers",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  debtsController.getDealerDebts
);

console.log("✅ Debts routes defined");

export default router;