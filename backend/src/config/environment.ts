// backend/src/config/environment.ts (cập nhật)
import dotenv from "dotenv";
import path from "path";

if (process.env.NODE_ENV !== "production") {
  const envPath = path.resolve(process.cwd(), ".env");
  dotenv.config({ path: envPath });
}

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string | number;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string | number;
  CORS_ORIGIN: string;
  BCRYPT_ROUNDS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_REPLY_TO?: string;
}

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
const missingEnvVars = requiredEnvVars.filter(
  (key) => !process.env[key] || process.env[key]?.trim() === ""
);

if (missingEnvVars.length > 0) {
  console.error("  Missing required environment variables:");
  console.error(missingEnvVars.join(", "));
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

const config: EnvironmentConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "10", 10),
  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    10
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "1000",
    10
  ),
  // Email config
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_REPLY_TO: process.env.SMTP_REPLY_TO,
};

// Warn nếu email không được cấu hình
if (!config.SMTP_USER || !config.SMTP_PASSWORD) {
  console.warn(" Email service not configured. Test drive confirmation emails will not be sent.");
  console.warn("ℹ  Set SMTP_USER and SMTP_PASSWORD in .env to enable email notifications");
} else {
  console.log(" Email service configured");
}


export default config;