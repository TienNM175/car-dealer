import cron from "node-cron";
import { PromotionsService } from "../modules/promotions/promotions.service";

const promotionsService = new PromotionsService();

/**
 * Initialize all scheduled cron jobs
 */
export const initScheduler = () => {
  console.log("Initializing cron jobs...");

  // Auto-expire promotions every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Running auto-expire promotions cron job...`);

    try {
      const result = await promotionsService.autoExpirePromotions();
      console.log(
        ` [${timestamp}] Successfully expired ${result.count} promotion(s)`
      );
    } catch (error: any) {
      console.error(
        ` [${timestamp}] Error in auto-expire cron:`,
        error.message
      );
    }
  });

  console.log(" Cron jobs initialized successfully");
  console.log("  Auto-expire promotions: Every day at 00:00 (midnight)");
};

/**
 * Stop all scheduled cron jobs (useful for graceful shutdown)
 */
export const stopScheduler = () => {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  console.log(" All cron jobs stopped");
};
