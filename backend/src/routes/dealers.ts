import express from "express";

const router = express.Router();

// GET /api/dealers - Get all dealers
router.get("/", (req, res) => {
  res.json({ message: "Dealers endpoint - Coming soon" });
});

// GET /api/dealers/:id - Get dealer by ID
router.get("/:id", (req, res) => {
  res.json({ message: `Get dealer ${req.params.id} - Coming soon` });
});

// POST /api/dealers - Create new dealer
router.post("/", (req, res) => {
  res.json({ message: "Create dealer - Coming soon" });
});

// PUT /api/dealers/:id - Update dealer
router.put("/:id", (req, res) => {
  res.json({ message: `Update dealer ${req.params.id} - Coming soon` });
});

// DELETE /api/dealers/:id - Delete dealer
router.delete("/:id", (req, res) => {
  res.json({ message: `Delete dealer ${req.params.id} - Coming soon` });
});

export default router;

