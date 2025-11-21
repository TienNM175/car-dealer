import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import config from "./config/environment";
import { ErrorMiddleware } from "./middlewares/error.middleware";
import { swaggerSpec } from "./config/swagger.config";

// Import routes
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
import vehicleUnitRoutes from "./modules/vehicle-units/vehicle-unit.routes";
import vehicleExportDocumentRoutes from "./modules/vehicle-export-documents/vehicle-export-document.routes";
import debtsRoutes from "./modules/debts/debts.routes";

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

    // CORS
    this.app.use(
      cors({
        origin: true,
        credentials: true,
      })
    );

    // Rate limiting
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
    console.log("🔧 Setting up routes...");

    // ✅ SWAGGER DOCUMENTATION
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Car Dealer API Documentation",
      })
    );
    console.log("📚 Swagger docs available at /api-docs");

    // ✅ HEALTH CHECK - DIRECT ROUTE
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Server is healthy
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: OK
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                 environment:
     *                   type: string
     *                   example: development
     */
    this.app.get("/health", (_req, res) => {
      console.log(" /health route called");
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
      });
    });

    // ✅ TEST DIRECT ROUTE
    this.app.get("/api/v1/direct", (_req, res) => {
      console.log(" /api/v1/direct route called");
      res.json({
        success: true,
        message: "Direct route works!",
        timestamp: new Date().toISOString(),
      });
    });

    // ✅ CREATE API ROUTER
    const apiRouter = express.Router();

    // ✅ TEST ROUTE IN API ROUTER
    apiRouter.get("/test", (_req, res) => {
      console.log(" /api/v1/test route called");
      res.json({
        success: true,
        message: "API Router test route works!",
        timestamp: new Date().toISOString(),
      });
    });

    // ✅ MOUNT ALL MODULE ROUTES
    console.log("📦 Mounting module routes...");

    apiRouter.use("/auth", authRoutes);
    console.log(" /auth routes mounted");

    apiRouter.use("/vehicles", vehicleRoutes);
    console.log(" /vehicles routes mounted");

    apiRouter.use("/dealers", dealerRoutes);
    console.log(" /dealers routes mounted");

    apiRouter.use("/customers", customerRoutes);
    console.log(" /customers routes mounted");

    apiRouter.use("/orders", orderRoutes);
    console.log(" /orders routes mounted");

    apiRouter.use("/contracts", contractRoutes);
    console.log(" /contracts routes mounted");

    apiRouter.use("/inventory", inventoryRoutes);
    console.log(" /inventory routes mounted");

    apiRouter.use("/test-drives", testDriveRoutes);
    console.log(" /test-drives routes mounted");

    apiRouter.use("/reports", reportRoutes);
    console.log(" /reports routes mounted");

    apiRouter.use("/quotations", quotationRoutes);
    console.log(" /quotations routes mounted");

    apiRouter.use("/promotions", promotionRoutes);
    console.log(" /promotions routes mounted");

    apiRouter.use("/ai/admin", aiAdminRoutes);
    console.log(" /ai/admin routes mounted");

    apiRouter.use("/users", userRoutes);
    console.log(" /users routes mounted");

    apiRouter.use("/public", publicRoutes);
    apiRouter.use("/public/chatbot", chatbotRoutes);
    apiRouter.use("/vehicle-units", vehicleUnitRoutes);
    apiRouter.use("/vehicle-export-documents", vehicleExportDocumentRoutes);
    apiRouter.use("/export-documents", vehicleExportDocumentRoutes);
    console.log(" /public routes mounted");

    apiRouter.use("/debts", debtsRoutes);
    console.log(" /debts routes mounted");

    // ✅ MOUNT API ROUTER - ĐẶT TRƯỚC DEBUG MIDDLEWARE
    this.app.use("/api/v1", apiRouter);
    console.log("🚀 apiRouter mounted at /api/v1");

    // ✅ DEBUG MIDDLEWARE - ĐẶT SAU API ROUTER
    this.app.use("/api/v1", (req, res, next) => {
      console.log(`🎯 API REQUEST: ${req.method} ${req.originalUrl}`);
      next();
    });

    console.log("✅ All routes setup completed");
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(ErrorMiddleware.notFound);

    // Global error handler
    this.app.use(ErrorMiddleware.handle);
  }
}

export default new App().app;
