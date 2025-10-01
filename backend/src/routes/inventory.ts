import express from "express";

const router = express.Router();

// GET /api/inventory - Get all inventory
router.get("/", (req, res) => {
  res.json({ message: "Inventory endpoint - Coming soon" });
});

// GET /api/inventory/:id - Get inventory by ID
router.get("/:id", (req, res) => {
  res.json({ message: `Get inventory ${req.params.id} - Coming soon` });
});

// POST /api/inventory - Create new inventory
router.post("/", (req, res) => {
  res.json({ message: "Create inventory - Coming soon" });
});

// PUT /api/inventory/:id - Update inventory
router.put("/:id", (req, res) => {
  res.json({ message: `Update inventory ${req.params.id} - Coming soon` });
});

// DELETE /api/inventory/:id - Delete inventory
router.delete("/:id", (req, res) => {
  res.json({ message: `Delete inventory ${req.params.id} - Coming soon` });
});

export default router;

