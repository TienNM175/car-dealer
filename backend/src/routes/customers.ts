import express from "express";

const router = express.Router();

// GET /api/customers - Get all customers
router.get("/", (req, res) => {
  res.json({ message: "Customers endpoint - Coming soon" });
});

// GET /api/customers/:id - Get customer by ID
router.get("/:id", (req, res) => {
  res.json({ message: `Get customer ${req.params.id} - Coming soon` });
});

// POST /api/customers - Create new customer
router.post("/", (req, res) => {
  res.json({ message: "Create customer - Coming soon" });
});

// PUT /api/customers/:id - Update customer
router.put("/:id", (req, res) => {
  res.json({ message: `Update customer ${req.params.id} - Coming soon` });
});

// DELETE /api/customers/:id - Delete customer
router.delete("/:id", (req, res) => {
  res.json({ message: `Delete customer ${req.params.id} - Coming soon` });
});

export default router;

