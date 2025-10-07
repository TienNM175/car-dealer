import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Handle Prisma connection
prisma
  .$connect()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((error: unknown) => {
    if (error instanceof Error) {
      console.error(" Database connection failed:", error.message);
    } else {
      console.error("Database connection failed:", error);
    }
    process.exit(1);
  });

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("Database disconnected");
});

export default prisma;
