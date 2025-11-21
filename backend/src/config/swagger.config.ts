import swaggerJsdoc from "swagger-jsdoc";
import config from "./environment";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Car Dealer API",
    version: "1.0.0",
    description: "API documentation for Car Dealer Management System",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}`,
      description: "Development server",
    },
    {
      url: "/api/v1",
      description: "API Base URL",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Error message",
          },
          errors: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
      Success: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Success message",
          },
          data: {
            type: "object",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "uuid",
          },
          email: {
            type: "string",
            example: "user@example.com",
          },
          firstName: {
            type: "string",
            example: "John",
          },
          lastName: {
            type: "string",
            example: "Doe",
          },
          role: {
            type: "string",
            enum: ["ADMIN", "EVM_STAFF", "DEALER_MANAGER", "DEALER_STAFF"],
          },
          dealerId: {
            type: "string",
            nullable: true,
            example: "uuid",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      Contract: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "uuid",
          },
          contractNumber: {
            type: "string",
            example: "CT-2024-001",
          },
          contractType: {
            type: "string",
            enum: ["SALES", "DEPOSIT"],
          },
          status: {
            type: "string",
            enum: [
              "DRAFT",
              "PENDING",
              "SIGNED",
              "DELIVERING",
              "COMPLETED",
              "CANCELLED",
            ],
          },
          customerId: {
            type: "string",
            example: "uuid",
          },
          vehicleId: {
            type: "string",
            example: "uuid",
          },
          dealerId: {
            type: "string",
            example: "uuid",
          },
          basePrice: {
            type: "number",
            example: 1000000000,
          },
          discount: {
            type: "number",
            example: 50000000,
          },
          finalPrice: {
            type: "number",
            example: 950000000,
          },
          depositAmount: {
            type: "number",
            nullable: true,
            example: 10000000,
          },
          customerSignature: {
            type: "string",
            nullable: true,
            description: "Base64 encoded signature image",
          },
          dealerSignature: {
            type: "string",
            nullable: true,
            description: "Base64 encoded signature image",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      Vehicle: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "uuid",
          },
          name: {
            type: "string",
            example: "Toyota Camry 2024",
          },
          manufacturerId: {
            type: "string",
            example: "uuid",
          },
          model: {
            type: "string",
            example: "Camry",
          },
          year: {
            type: "number",
            example: 2024,
          },
          price: {
            type: "number",
            example: 1000000000,
          },
          status: {
            type: "string",
            enum: ["ACTIVE", "INACTIVE", "DISCONTINUED"],
          },
        },
      },
      Customer: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "uuid",
          },
          email: {
            type: "string",
            example: "customer@example.com",
          },
          firstName: {
            type: "string",
            example: "Jane",
          },
          lastName: {
            type: "string",
            example: "Smith",
          },
          phone: {
            type: "string",
            example: "0123456789",
          },
          address: {
            type: "string",
            example: "123 Main St",
          },
          status: {
            type: "string",
            enum: ["ACTIVE", "INACTIVE", "BLACKLISTED"],
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Auth",
      description: "Authentication endpoints",
    },
    {
      name: "Contracts",
      description: "Contract management endpoints",
    },
    {
      name: "Vehicles",
      description: "Vehicle management endpoints",
    },
    {
      name: "Customers",
      description: "Customer management endpoints",
    },
    {
      name: "Dealers",
      description: "Dealer management endpoints",
    },
    {
      name: "Inventory",
      description: "Inventory management endpoints",
    },
    {
      name: "Orders",
      description: "Dealer order endpoints",
    },
    {
      name: "Test Drives",
      description: "Test drive endpoints",
    },
    {
      name: "Reports",
      description: "Report and statistics endpoints",
    },
    {
      name: "Quotations",
      description: "Quotation endpoints",
    },
    {
      name: "Promotions",
      description: "Promotion endpoints",
    },
    {
      name: "AI Admin",
      description: "AI-powered business intelligence endpoints",
    },
    {
      name: "Health",
      description: "Health check endpoint",
    },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    "./src/modules/**/*.routes.ts",
    "./src/modules/**/*.controller.ts",
    "./src/app.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
