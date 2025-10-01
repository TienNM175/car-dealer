import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { bcryptPasswordCompare } from "../lib/bcrypt";
import { redis } from "../lib/redis";

const router = express.Router();

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z
    .enum(["ADMIN", "EVM_STAFF", "DEALER_MANAGER", "DEALER_STAFF"])
    .optional(),
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { data, error } = LoginSchema.safeParse(req.body);

    if (!data) {
      return res.status(400).json({
        error: "Invalid input",
        details: error?.errors,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { dealer: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcryptPasswordCompare(
      data.password,
      user.hashedPassword
    );

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        dealerId: user.dealerId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Store session in Redis
    await redis.set(`session:${user.id}`, token, { ex: 7 * 24 * 60 * 60 }); // 7 days

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        dealerId: user.dealerId,
        dealer: user.dealer,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { data, error } = RegisterSchema.safeParse(req.body);

    if (!data) {
      return res.status(400).json({
        error: "Invalid input",
        details: error?.errors,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const { bcryptPasswordHash } = await import("../lib/bcrypt");
    const hashedPassword = await bcryptPasswordHash(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || "DEALER_STAFF",
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      await redis.del(`session:${decoded.userId}`);
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify token endpoint
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Check if session exists in Redis
    const sessionExists = await redis.exists(`session:${decoded.userId}`);

    if (!sessionExists) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { dealer: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        dealerId: user.dealerId,
        dealer: user.dealer,
      },
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
