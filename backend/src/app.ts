import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import config from "./config/environment";
import { ErrorMiddleware } from "./middlewares/error.middleware";

import authRoutes from "./modules/auth/auth.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import customerRoutes from "./modules/customers/customer.routes";
import contractRoutes from "./modules/contracts/contract.routes";
import dealerRoutes from "./modules/dealers/dealer.routes";
import orderRoutes from "./modules/dealer-orders/dealer-order.routes";
import testDriveRoutes from "./modules/test-drives/test-drive.routes";
import reportRoutes from "./modules/reports/reports.routes";
import vehicleRoutes from "./modules/vehicles/vehicle.routes";
import quotationRoutes from "./modules/quotations/quotations.routes";
import promotionRoutes from "./modules/promotions/promotions.routes";
import aiAdminRoutes from "./modules/ai/ai-admin.routes";
import userRoutes from "./modules/users/users.routes";
import publicRoutes from "./modules/public/public.routes";
import chatbotRoutes from "./modules/chatbot/chatbot.routes";
// ... other routes

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    // Security
    this.app.use(helmet());

    // CORS - Temporarily allow all origins for debugging
    this.app.use(
      cors({
        origin: true, // Allow all origins temporarily
        credentials: true,
      })
    );

    // Rate limiting - Disable in development
    if (config.NODE_ENV !== "development") {
      const limiter = rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: config.RATE_LIMIT_MAX_REQUESTS,
        message: "Too many requests from this IP, please try again later",
      });
      this.app.use("/api/", limiter);
    }

    // Body parser
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging
    if (config.NODE_ENV === "development") {
      this.app.use(morgan("dev"));
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (_req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
      });
    });

    // API routes
    const apiRouter = express.Router();

    // Mount routes here
    apiRouter.use("/auth", authRoutes);
    apiRouter.use("/vehicles", vehicleRoutes);
    apiRouter.use("/dealers", dealerRoutes);
    apiRouter.use("/customers", customerRoutes);
    apiRouter.use("/orders", orderRoutes);
    apiRouter.use("/contracts", contractRoutes);
    apiRouter.use("/inventory", inventoryRoutes);
    apiRouter.use("/test-drives", testDriveRoutes);
    apiRouter.use("/reports", reportRoutes);
    apiRouter.use("/quotations", quotationRoutes);
    apiRouter.use("/promotions", promotionRoutes);
    apiRouter.use("/ai/admin", aiAdminRoutes);
    apiRouter.use("/users", userRoutes);
    apiRouter.use('/public', publicRoutes);
    apiRouter.use('/public/chatbot', chatbotRoutes);

    // Debug middleware
    this.app.use("/api/v1", (req, _res, next) => {
      console.log(`🔍 API Request: ${req.method} ${req.path}`);
      next();
    });

    this.app.use("/api/v1", apiRouter);
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(ErrorMiddleware.notFound);

    // Global error handler
    this.app.use(ErrorMiddleware.handle);
  }
}

export default new App().app;
