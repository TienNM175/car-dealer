import { PrismaClient } from "@prisma/client";
import { seedTaxonomy } from "./taxonomy.seed";
import { seedClassifieds } from "./classifieds.seed";
import { seedImages } from "./images.seed";

const prisma = new PrismaClient();

async function main() {
  try {
    // Kiểm tra xem có dữ liệu trong bảng makes không
    const existingMakes = await prisma.make.count();
    
    if (existingMakes === 0) {
      console.log("Seeding taxonomy data...");
      await seedTaxonomy(prisma);
    } else {
      console.log(`Found ${existingMakes} existing makes, skipping taxonomy seed.`);
    }

    console.log("Seeding classifieds...");
    await seedClassifieds(prisma);
    
    console.log("Seeding images...");
    await seedImages(prisma);
    
    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
