import { PrismaClient } from "@prisma/client";

// Khai báo biến toàn cục để lưu trữ PrismaClient
// Sử dụng 'global as unknown as' để truy cập vào biến toàn cục của Node.js
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Khởi tạo hoặc tái sử dụng Prisma Client
// Trong môi trường phát triển, nó sẽ lưu trữ instance vào globalForPrisma.prisma
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Nếu không phải môi trường production, lưu instance vào global để hot-reload không tạo instance mới
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Handle Prisma connection (giữ nguyên logic của bạn)
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
    // Không nên gọi process.exit(1) ở đây trong một ứng dụng web/server thực tế
    // mà nên ném lỗi hoặc có cơ chế retry/failover.
    // Giữ nguyên theo yêu cầu của bạn, nhưng cần lưu ý:
    // process.exit(1);
  });

// Graceful shutdown (giữ nguyên logic của bạn)
// Lưu ý: process.on("beforeExit") không hoạt động với async code,
// thường dùng 'SIGINT' hoặc 'SIGTERM' cho graceful shutdown.
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("Database disconnected");
});

export default prisma;
