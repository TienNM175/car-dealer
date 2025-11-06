import {
  PrismaClient,
  VehicleUnitStatus,
  VehicleUnitStorageType,
} from "@prisma/client";

const prisma = new PrismaClient();

const sanitizeCode = (value?: string | null) =>
  (value ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "GEN";

const buildVin = (prefix: string, vehicleId: string, index: number) => {
  const random = Math.floor(Math.random() * 9000) + 1000;
  const suffix = vehicleId.slice(-4).toUpperCase();
  return `${prefix}-${Date.now()}-${index}-${suffix}-${random}`;
};

async function createDealerUnits() {
  const inventories = await prisma.inventory.findMany({
    include: {
      dealer: true,
      vehicle: true,
    },
  });

  let created = 0;

  for (const inv of inventories) {
    const available = Math.max(inv.available, 0);
    if (available <= 0) continue;

    const existing = await prisma.vehicleUnit.count({
      where: {
        vehicleId: inv.vehicleId,
        dealerId: inv.dealerId,
        status: VehicleUnitStatus.IN_STOCK,
      },
    });

    const missing = available - existing;
    if (missing <= 0) continue;

    const dealerCode = sanitizeCode(inv.dealer?.code || inv.dealer?.name);

    for (let i = 0; i < missing; i += 1) {
      const vin = buildVin(dealerCode, inv.vehicleId, i + created);

      await prisma.vehicleUnit.create({
        data: {
          vehicleId: inv.vehicleId,
          vin,
          engineNumber: `ENG-${vin}`,
          batterySerial: `BAT-${vin}`,
          color: inv.vehicle?.color ?? null,
          status: VehicleUnitStatus.IN_STOCK,
          storageType: VehicleUnitStorageType.DEALER,
          dealerId: inv.dealerId,
          location: inv.location || inv.dealer?.name || null,
        },
      });
      created += 1;
    }
  }

  return created;
}

async function createEvmUnits() {
  const evmInventories = await prisma.eVMInventory.findMany({
    include: {
      vehicle: true,
    },
  });

  let created = 0;

  for (const inv of evmInventories) {
    const available = Math.max(inv.available, 0);
    if (available <= 0) continue;

    const existing = await prisma.vehicleUnit.count({
      where: {
        vehicleId: inv.vehicleId,
        dealerId: null,
        storageType: VehicleUnitStorageType.EVM,
        status: VehicleUnitStatus.IN_STOCK,
      },
    });

    const missing = available - existing;
    if (missing <= 0) continue;

    const prefix = "EVM";

    for (let i = 0; i < missing; i += 1) {
      const vin = buildVin(prefix, inv.vehicleId, i + created);

      await prisma.vehicleUnit.create({
        data: {
          vehicleId: inv.vehicleId,
          vin,
          engineNumber: `ENG-${vin}`,
          batterySerial: `BAT-${vin}`,
          color: inv.vehicle?.color ?? null,
          status: VehicleUnitStatus.IN_STOCK,
          storageType: VehicleUnitStorageType.EVM,
          dealerId: null,
          location: inv.location || "Kho tổng EVM",
        },
      });
      created += 1;
    }
  }

  return created;
}

async function main() {
  try {
    console.log("🚚 Generating available VINs for dealer inventories...");
    const dealerCreated = await createDealerUnits();
    console.log(`✅ Created ${dealerCreated} dealer VIN(s) in stock.`);

    console.log("🏭 Generating available VINs for EVM inventory...");
    const evmCreated = await createEvmUnits();
    console.log(`✅ Created ${evmCreated} EVM VIN(s) in stock.`);

    console.log("🎉 VIN generation completed.");
  } catch (error) {
    console.error("❌ Failed to generate VINs:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
