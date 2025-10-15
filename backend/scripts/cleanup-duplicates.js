// Quick cleanup script for duplicate vehicles
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanupDuplicates() {
  try {
    console.log("Cleaning up duplicate vehicles...");

    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "asc" },
    });

    console.log(`Total vehicles: ${vehicles.length}`);

    // Group by manufacturer + model + variant + year
    const groups = {};
    vehicles.forEach((v) => {
      const key = `${v.manufacturerId}-${v.model}-${v.variant || ""}-${v.year}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    });

    // Find and delete duplicates
    let deleted = 0;
    for (const [key, group] of Object.entries(groups)) {
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicates for: ${key}`);

        // Keep first, delete rest
        for (let i = 1; i < group.length; i++) {
          const vehicle = group[i];
          console.log(
            `Deleting duplicate: ${vehicle.model} ${vehicle.variant}`
          );

          // Delete related records
          await prisma.vehicleImage.deleteMany({
            where: { vehicleId: vehicle.id },
          });
          await prisma.eVMInventory.deleteMany({
            where: { vehicleId: vehicle.id },
          });
          await prisma.inventory.deleteMany({
            where: { vehicleId: vehicle.id },
          });
          await prisma.testDrive.deleteMany({
            where: { vehicleId: vehicle.id },
          });
          await prisma.quotation.deleteMany({
            where: { vehicleId: vehicle.id },
          });
          await prisma.contract.deleteMany({
            where: { vehicleId: vehicle.id },
          });
          await prisma.dealerOrder.deleteMany({
            where: { vehicleId: vehicle.id },
          });

          // Delete vehicle
          await prisma.vehicle.delete({ where: { id: vehicle.id } });
          deleted++;
        }
      }
    }

    console.log(`Deleted ${deleted} duplicate vehicles`);

    const finalCount = await prisma.vehicle.count();
    console.log(`Final count: ${finalCount} vehicles`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();
