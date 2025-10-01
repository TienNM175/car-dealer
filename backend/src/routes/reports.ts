import express from "express";

const router = express.Router();

// GET /api/reports - Get all reports
router.get("/", (req, res) => {
  res.json({ message: "Reports endpoint - Coming soon" });
});

// GET /api/reports/sales - Get sales report
router.get("/sales", (req, res) => {
  res.json({ message: "Sales report - Coming soon" });
});

// GET /api/reports/inventory - Get inventory report
router.get("/inventory", (req, res) => {
  res.json({ message: "Inventory report - Coming soon" });
});

// GET /api/reports/dealers - Get dealers report
router.get("/dealers", (req, res) => {
  res.json({ message: "Dealers report - Coming soon" });
});

export default router;

