import {
  PrismaClient,
  Prisma,
  DebtStatus,
  QuotationStatus,
  FeedbackCategory,
  TestDriveStatus,
  CustomerStatus,
  ContractStatus,
  ComplaintStatus,
  PaymentType,
  DealerOrderStatus,
  VehicleUnitStatus,
  VehicleUnitStorageType,
  VehicleColor,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "🌱 Starting ENHANCED 2025 database seeding (Oct-Nov 2025)...\n"
  );

  // Helper functions
  const randomDateBetween = (start: Date, end: Date) => {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
  };

  const randomElement = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const randomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Date ranges for Oct 15 - Nov 10, 2025
  const recentStart = new Date("2025-10-15T00:00:00Z");
  const recentEnd = new Date("2025-11-10T23:59:59Z");

  // 1. REGIONS
  console.log("🌍 Creating regions...");
  const northRegion = await prisma.region.upsert({
    where: { code: "NORTH" },
    update: {},
    create: { name: "Miền Bắc", code: "NORTH" },
  });
  const centralRegion = await prisma.region.upsert({
    where: { code: "CENTRAL" },
    update: {},
    create: { name: "Miền Trung", code: "CENTRAL" },
  });
  const southRegion = await prisma.region.upsert({
    where: { code: "SOUTH" },
    update: {},
    create: { name: "Miền Nam", code: "SOUTH" },
  });
  console.log("✅ Created 3 regions\n");

  // 2. DEALERS
  console.log("🏢 Creating dealers...");
  const dealer1 = await prisma.dealer.upsert({
    where: { code: "DL-HN-001" },
    update: {},
    create: {
      name: "EV Hà Nội",
      code: "DL-HN-001",
      regionId: northRegion.id,
      address: "123 Đường Láng, Đống Đa",
      city: "Hà Nội",
      phone: "024 1234 5678",
      email: "hanoi@evdealer.com",
      isActive: true,
    },
  });

  const dealer2 = await prisma.dealer.upsert({
    where: { code: "DL-HCM-001" },
    update: {},
    create: {
      name: "EV Sài Gòn",
      code: "DL-HCM-001",
      regionId: southRegion.id,
      address: "456 Nguyễn Huệ, Quận 1",
      city: "TP. Hồ Chí Minh",
      phone: "028 1234 5678",
      email: "saigon@evdealer.com",
      isActive: true,
    },
  });

  const dealer3 = await prisma.dealer.upsert({
    where: { code: "DL-DN-001" },
    update: {},
    create: {
      name: "EV Đà Nẵng",
      code: "DL-DN-001",
      regionId: centralRegion.id,
      address: "789 Trần Phú, Hải Châu",
      city: "Đà Nẵng",
      phone: "0236 1234 567",
      email: "danang@evdealer.com",
      isActive: true,
    },
  });

  console.log("✅ Created 3 dealers\n");

  // 3. DEALER CONTRACTS
  console.log("📄 Creating dealer contracts...");
  await prisma.dealerContract.upsert({
    where: { contractCode: "DC-2025-001" },
    update: {},
    create: {
      contractCode: "DC-2025-001",
      dealerId: dealer1.id,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      commissionRate: 5.5,
      status: "ACTIVE",
      signedAt: new Date("2025-01-10"),
    },
  });

  await prisma.dealerContract.upsert({
    where: { contractCode: "DC-2025-002" },
    update: {},
    create: {
      contractCode: "DC-2025-002",
      dealerId: dealer2.id,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      commissionRate: 6.0,
      status: "ACTIVE",
      signedAt: new Date("2025-01-12"),
    },
  });

  await prisma.dealerContract.upsert({
    where: { contractCode: "DC-2025-003" },
    update: {},
    create: {
      contractCode: "DC-2025-003",
      dealerId: dealer3.id,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      commissionRate: 5.0,
      status: "ACTIVE",
      signedAt: new Date("2025-01-15"),
    },
  });

  console.log("✅ Created 3 dealer contracts\n");

  // 4. USERS
  console.log("👥 Creating users...");
  const hashedPassword = await bcrypt.hash("Admin@123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@evdealer.com" },
    update: {},
    create: {
      email: "admin@evdealer.com",
      hashedPassword,
      firstName: "Admin",
      lastName: "System",
      phone: "0901234567",
      role: "ADMIN",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "evm@evdealer.com" },
    update: {},
    create: {
      email: "evm@evdealer.com",
      hashedPassword,
      firstName: "EVM",
      lastName: "Staff",
      phone: "0901234568",
      role: "EVM_STAFF",
      isActive: true,
    },
  });

  const dealerManager1 = await prisma.user.upsert({
    where: { email: "manager.hn@evdealer.com" },
    update: {},
    create: {
      email: "manager.hn@evdealer.com",
      hashedPassword,
      firstName: "Nguyễn Văn",
      lastName: "Quản Lý",
      phone: "0901234569",
      role: "DEALER_MANAGER",
      dealerId: dealer1.id,
      isActive: true,
    },
  });

  const dealerStaff1 = await prisma.user.upsert({
    where: { email: "staff.hn@evdealer.com" },
    update: {},
    create: {
      email: "staff.hn@evdealer.com",
      hashedPassword,
      firstName: "Trần Thị",
      lastName: "Nhân Viên",
      phone: "0901234570",
      role: "DEALER_STAFF",
      dealerId: dealer1.id,
      isActive: true,
    },
  });

  const dealerManager2 = await prisma.user.upsert({
    where: { email: "manager.hcm@evdealer.com" },
    update: {},
    create: {
      email: "manager.hcm@evdealer.com",
      hashedPassword,
      firstName: "Lê Văn",
      lastName: "Giám Đốc",
      phone: "0907654321",
      role: "DEALER_MANAGER",
      dealerId: dealer2.id,
      isActive: true,
    },
  });

  const dealerStaff2 = await prisma.user.upsert({
    where: { email: "staff.hcm@evdealer.com" },
    update: {},
    create: {
      email: "staff.hcm@evdealer.com",
      hashedPassword,
      firstName: "Phạm Thị",
      lastName: "Tư Vấn",
      phone: "0907654322",
      role: "DEALER_STAFF",
      dealerId: dealer2.id,
      isActive: true,
    },
  });

  console.log("✅ Created 6 users\n");

  // 5. MANUFACTURERS
  console.log("🏭 Creating manufacturers...");
  const tesla = await prisma.manufacturer.upsert({
    where: { code: "TESLA" },
    update: {},
    create: {
      name: "Tesla",
      code: "TESLA",
      country: "USA",
      logo: "https://res.cloudinary.com/demo/image/upload/v1/manufacturers/tesla-logo.png",
      isActive: true,
    },
  });
  const vinfast = await prisma.manufacturer.upsert({
    where: { code: "VINFAST" },
    update: {},
    create: {
      name: "VinFast",
      code: "VINFAST",
      country: "Vietnam",
      logo: "https://res.cloudinary.com/demo/image/upload/v1/manufacturers/vinfast-logo.png",
      isActive: true,
    },
  });
  const byd = await prisma.manufacturer.upsert({
    where: { code: "BYD" },
    update: {},
    create: {
      name: "BYD",
      code: "BYD",
      country: "China",
      logo: "https://res.cloudinary.com/demo/image/upload/v1/manufacturers/byd-logo.png",
      isActive: true,
    },
  });
  const hyundai = await prisma.manufacturer.upsert({
    where: { code: "HYUNDAI" },
    update: {},
    create: {
      name: "Hyundai",
      code: "HYUNDAI",
      country: "South Korea",
      logo: "https://res.cloudinary.com/demo/image/upload/v1/manufacturers/hyundai-logo.png",
      isActive: true,
    },
  });
  console.log("✅ Created 4 manufacturers\n");

  // 6. VEHICLES
  console.log("🚗 Creating 10 vehicles for 2025...");
  const vehicles = [];

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: tesla.id,
        model: "Model 3",
        variant: "Standard Range Plus",
        year: 2025,
        batteryCapacity: 62,
        range: 455,
        chargingTime: 29,
        motorPower: 215,
        topSpeed: 228,
        acceleration: 5.2,
        seats: 5,
        doors: 4,
        color: "WHITE",
        bodyType: "SEDAN",
        wholesalePrice: 914400000,
        retailPrice: 1041400000,
        currency: "VND",
        status: "ACTIVE",
        description: "Tesla Model 3 2025 - Best selling EV sedan",
      },
    })
  );

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: tesla.id,
        model: "Model Y",
        variant: "Long Range",
        year: 2025,
        batteryCapacity: 77,
        range: 528,
        chargingTime: 31,
        motorPower: 328,
        topSpeed: 218,
        acceleration: 4.7,
        seats: 7,
        doors: 4,
        color: "BLACK",
        bodyType: "SUV",
        wholesalePrice: 1193800000,
        retailPrice: 1371600000,
        currency: "VND",
        status: "ACTIVE",
        description: "Tesla Model Y 2025 - Spacious family SUV",
      },
    })
  );

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: vinfast.id,
        model: "VF 8",
        variant: "Eco",
        year: 2025,
        batteryCapacity: 88,
        range: 425,
        chargingTime: 34,
        motorPower: 263,
        topSpeed: 202,
        acceleration: 5.3,
        seats: 5,
        doors: 4,
        color: "BLUE",
        bodyType: "SUV",
        wholesalePrice: 774700000,
        retailPrice: 901700000,
        currency: "VND",
        status: "ACTIVE",
        description: "VinFast VF 8 Eco 2025 - Vietnam pride",
      },
    })
  );

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: vinfast.id,
        model: "VF 9",
        variant: "Plus",
        year: 2025,
        batteryCapacity: 125,
        range: 540,
        chargingTime: 38,
        motorPower: 305,
        topSpeed: 202,
        acceleration: 6.3,
        seats: 7,
        doors: 4,
        color: "SILVER",
        bodyType: "SUV",
        wholesalePrice: 1092200000,
        retailPrice: 1244600000,
        currency: "VND",
        status: "ACTIVE",
        description: "VinFast VF 9 Plus - Premium 7-seater",
      },
    })
  );

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: byd.id,
        model: "Atto 3",
        variant: "Standard",
        year: 2025,
        batteryCapacity: 61,
        range: 425,
        chargingTime: 28,
        motorPower: 152,
        topSpeed: 162,
        acceleration: 7.1,
        seats: 5,
        doors: 4,
        color: "GREY",
        bodyType: "SUV",
        wholesalePrice: 571500000,
        retailPrice: 673100000,
        currency: "VND",
        status: "ACTIVE",
        description: "BYD Atto 3 2025 - Affordable quality SUV",
      },
    })
  );

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: byd.id,
        model: "Tang EV",
        variant: "AWD",
        year: 2025,
        batteryCapacity: 108,
        range: 505,
        chargingTime: 36,
        motorPower: 380,
        topSpeed: 190,
        acceleration: 4.6,
        seats: 7,
        doors: 4,
        color: "BLACK",
        bodyType: "SUV",
        wholesalePrice: 1143000000,
        retailPrice: 1320800000,
        currency: "VND",
        status: "ACTIVE",
        description: "BYD Tang EV - Powerful 7-seater",
      },
    })
  );

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: hyundai.id,
        model: "IONIQ 5",
        variant: "Long Range AWD",
        year: 2025,
        batteryCapacity: 78,
        range: 488,
        chargingTime: 17,
        motorPower: 230,
        topSpeed: 188,
        acceleration: 5.0,
        seats: 5,
        doors: 4,
        color: "WHITE",
        bodyType: "SUV",
        wholesalePrice: 990600000,
        retailPrice: 1143000000,
        currency: "VND",
        status: "ACTIVE",
        description: "Hyundai IONIQ 5 - Fast charging champion",
      },
    })
  );

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: hyundai.id,
        model: "IONIQ 6",
        variant: "Standard Range",
        year: 2025,
        batteryCapacity: 77,
        range: 614,
        chargingTime: 18,
        motorPower: 168,
        topSpeed: 185,
        acceleration: 7.4,
        seats: 5,
        doors: 4,
        color: "SILVER",
        bodyType: "SEDAN",
        wholesalePrice: 965200000,
        retailPrice: 1117600000,
        currency: "VND",
        status: "ACTIVE",
        description: "Hyundai IONIQ 6 - Aerodynamic efficiency",
      },
    })
  );

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: tesla.id,
        model: "Model S",
        variant: "Plaid",
        year: 2025,
        batteryCapacity: 100,
        range: 637,
        chargingTime: 35,
        motorPower: 750,
        topSpeed: 322,
        acceleration: 1.99,
        seats: 5,
        doors: 4,
        color: "RED",
        bodyType: "SEDAN",
        wholesalePrice: 2286000000,
        retailPrice: 2667000000,
        currency: "VND",
        status: "ACTIVE",
        description: "Tesla Model S Plaid - Ultimate performance sedan",
      },
    })
  );

  vehicles.push(
    await prisma.vehicle.create({
      data: {
        manufacturerId: vinfast.id,
        model: "VF 5",
        variant: "Standard",
        year: 2025,
        batteryCapacity: 38,
        range: 310,
        chargingTime: 25,
        motorPower: 130,
        topSpeed: 165,
        acceleration: 7.5,
        seats: 5,
        doors: 4,
        color: "WHITE",
        bodyType: "HATCHBACK",
        wholesalePrice: 457200000,
        retailPrice: 533400000,
        currency: "VND",
        status: "ACTIVE",
        description: "VinFast VF 5 - Compact city car",
      },
    })
  );

  console.log(`✅ Created ${vehicles.length} vehicles\n`);

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const dealerMap = new Map([
    [dealer1.id, dealer1],
    [dealer2.id, dealer2],
    [dealer3.id, dealer3],
  ]);

  // 7. VEHICLE IMAGES WITH PUBLICID
  console.log("🖼️ Creating vehicle images with publicId...");
  const imageData = vehicles.map((v) => {
    const modelSlug = v.model.toLowerCase().replace(/\s+/g, "-");
    return {
      vehicleId: v.id,
      url: `https://res.cloudinary.com/demo/image/upload/v1/vehicles/${modelSlug}-2025-main.jpg`,
      publicId: `vehicles/${modelSlug}-2025-main`,
      alt: `${v.model} ${v.variant} 2025 - Main Image`,
      isMain: true,
      order: 0,
    };
  });
  await prisma.vehicleImage.createMany({ data: imageData });
  console.log("✅ Created vehicle images with publicId\n");

  // 8. EVM INVENTORY
  console.log("📦 Creating EVM inventory...");
  const evmInventoryData = vehicles
    .map((v) => ({
      vehicleId: v.id,
      quantity: randomNumber(50, 200),
      reserved: randomNumber(5, 30),
      available: 0,
      location: randomElement(["Warehouse A", "Warehouse B", "Warehouse C"]),
    }))
    .map((inv) => ({
      ...inv,
      available: inv.quantity - inv.reserved,
    }));
  await prisma.eVMInventory.createMany({ data: evmInventoryData });
  console.log("✅ Created EVM inventory\n");

  // 9. DEALER INVENTORY
  console.log("🏬 Creating dealer inventory...");
  const dealerInventoryData = [];

  for (const dealer of [dealer1, dealer2, dealer3]) {
    const dealerVehicles = vehicles.slice(0, randomNumber(5, 8));

    for (const vehicle of dealerVehicles) {
      const quantity = randomNumber(3, 10);
      const sold = randomNumber(0, Math.floor(quantity * 0.3));
      const reserved = randomNumber(0, Math.floor((quantity - sold) * 0.2));

      dealerInventoryData.push({
        dealerId: dealer.id,
        vehicleId: vehicle.id,
        quantity,
        reserved,
        sold,
        available: quantity - reserved - sold,
        location: randomElement([
          "Showroom Floor 1",
          "Showroom Floor 2",
          "Storage",
        ]),
      });
    }
  }

  await prisma.inventory.createMany({ data: dealerInventoryData });
  console.log(
    `✅ Created ${dealerInventoryData.length} dealer inventory records\n`
  );

  console.log("🚙 Creating vehicle units (VIN)...");
  const dealerVehicleAvailableUnits = new Map<string, any[]>();
  const evmVehicleAvailableUnits = new Map<string, any[]>();
  let totalVehicleUnitsCreated = 0;
  let vinSequence = 1;

  const sanitizeCode = (value: string) =>
    value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  const generateVin = (vehicle: any, prefix: string) => {
    const base = `${sanitizeCode(vehicle.manufacturer?.name || "EVM").slice(0, 3)}${sanitizeCode(vehicle.model).slice(0, 4)}`;
    return `${base}-${prefix}-${String(vinSequence++).padStart(5, "0")}`;
  };

  const registerAvailableUnit = (unit: any) => {
    if (unit.status !== VehicleUnitStatus.IN_STOCK) return;

    if (unit.storageType === VehicleUnitStorageType.DEALER && unit.dealerId) {
      const key = `${unit.dealerId}_${unit.vehicleId}`;
      if (!dealerVehicleAvailableUnits.has(key)) {
        dealerVehicleAvailableUnits.set(key, []);
      }
      dealerVehicleAvailableUnits.get(key)!.push(unit);
    } else if (unit.storageType === VehicleUnitStorageType.EVM) {
      if (!evmVehicleAvailableUnits.has(unit.vehicleId)) {
        evmVehicleAvailableUnits.set(unit.vehicleId, []);
      }
      evmVehicleAvailableUnits.get(unit.vehicleId)!.push(unit);
    }
  };

  const claimVehicleUnitForContract = async (
    vehicleId: string,
    dealerId?: string | null
  ) => {
    let unit: any | undefined;

    if (dealerId) {
      const dealerKey = `${dealerId}_${vehicleId}`;
      const dealerUnits = dealerVehicleAvailableUnits.get(dealerKey);
      if (dealerUnits?.length) {
        unit = dealerUnits.shift();
        if (!dealerUnits.length) {
          dealerVehicleAvailableUnits.delete(dealerKey);
        }
      }
    }

    if (!unit) {
      const evmUnits = evmVehicleAvailableUnits.get(vehicleId);
      if (evmUnits?.length) {
        unit = evmUnits.shift();
        if (!evmUnits.length) {
          evmVehicleAvailableUnits.delete(vehicleId);
        }
      }

      if (unit && dealerId) {
        const dealer = dealerMap.get(dealerId);
        unit = await prisma.vehicleUnit.update({
          where: { id: unit.id },
          data: {
            dealerId,
            storageType: VehicleUnitStorageType.DEALER,
            location: dealer?.city
              ? `Kho/Showroom ${dealer.city}`
              : dealer?.name || "Showroom",
          },
        });
      }
    }

    return unit || null;
  };

  const createVehicleUnit = async (data: {
    vehicleId: string;
    vin: string;
    engineNumber?: string | null;
    batterySerial?: string | null;
    color?: VehicleColor | null;
    status: VehicleUnitStatus;
    storageType: VehicleUnitStorageType;
    dealerId?: string | null;
    location?: string | null;
    reservedAt?: Date | null;
    deliveredAt?: Date | null;
  }) => {
    const unit = await prisma.vehicleUnit.create({
      data,
    });
    totalVehicleUnitsCreated += 1;
    registerAvailableUnit(unit);
    return unit;
  };

  const evmLocations = ["Kho Tổng Bình Dương", "Kho Hải Phòng", "Kho Đà Nẵng"];

  for (const vehicle of vehicles) {
    for (let i = 0; i < 5; i++) {
      const vin = generateVin(vehicle, "EVM");
      await createVehicleUnit({
        vehicleId: vehicle.id,
        vin,
        engineNumber: `ENG-${vin}`,
        batterySerial: `BAT-${vin}`,
        color: vehicle.color,
        status: VehicleUnitStatus.IN_STOCK,
        storageType: VehicleUnitStorageType.EVM,
        dealerId: null,
        location: randomElement(evmLocations),
        reservedAt: null,
        deliveredAt: null,
      });
    }
  }

  for (const inventory of dealerInventoryData) {
    const vehicle = vehicleMap.get(inventory.vehicleId);
    const dealer = dealerMap.get(inventory.dealerId);
    if (!vehicle || !dealer) continue;

    const dealerCode = sanitizeCode(dealer.code || "DLR");
    const location = inventory.location || dealer.city || "Showroom";

    const createUnitsForStatus = async (
      count: number,
      status: VehicleUnitStatus
    ) => {
      for (let i = 0; i < count; i++) {
        const vin = generateVin(vehicle, dealerCode);
        const reservedAt =
          status === VehicleUnitStatus.RESERVED ||
          status === VehicleUnitStatus.IN_TRANSIT ||
          status === VehicleUnitStatus.DELIVERED
            ? randomDateBetween(recentStart, recentEnd)
            : null;
        const deliveredAt =
          status === VehicleUnitStatus.DELIVERED && reservedAt
            ? new Date(
                reservedAt.getTime() + randomNumber(1, 5) * 24 * 60 * 60 * 1000
              )
            : null;

        await createVehicleUnit({
          vehicleId: vehicle.id,
          vin,
          engineNumber: `ENG-${vin}`,
          batterySerial: `BAT-${vin}`,
          color: vehicle.color,
          status,
          storageType: VehicleUnitStorageType.DEALER,
          dealerId: inventory.dealerId,
          location,
          reservedAt,
          deliveredAt,
        });
      }
    };

    await createUnitsForStatus(inventory.available, VehicleUnitStatus.IN_STOCK);
    await createUnitsForStatus(inventory.reserved, VehicleUnitStatus.RESERVED);
    await createUnitsForStatus(inventory.sold, VehicleUnitStatus.DELIVERED);
  }

  console.log(`✅ Created ${totalVehicleUnitsCreated} vehicle units (VIN)\n`);

  // 10. CUSTOMERS (40 - Tăng gấp đôi)
  console.log("👤 Creating 40 customers with dealerId...");

  const firstNames = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Võ",
    "Phan",
  ];
  const middleNames = ["Văn", "Thị", "Minh", "Thanh", "Thu", "Hồng", "Anh"];
  const lastNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "K"];
  const cities = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng"];
  const statuses: CustomerStatus[] = [
    "INTERESTED",
    "CONTACTED",
    "TEST_DRIVE",
    "QUOTED",
    "PURCHASED",
  ];
  const staffMembers = [
    dealerStaff1,
    dealerStaff2,
    dealerManager1,
    dealerManager2,
  ];

  const customers = [];
  for (let i = 1; i <= 40; i++) {
    const firstName = randomElement(firstNames);
    const middleName = randomElement(middleNames);
    const lastName = randomElement(lastNames);

    let assignedDealer;
    if (i <= 14) {
      assignedDealer = dealer1;
    } else if (i <= 28) {
      assignedDealer = dealer2;
    } else {
      assignedDealer = dealer3;
    }

    const dealerStaffForCustomer =
      assignedDealer.id === dealer1.id
        ? randomElement([dealerStaff1, dealerManager1])
        : assignedDealer.id === dealer2.id
          ? randomElement([dealerStaff2, dealerManager2])
          : randomElement(staffMembers);

    const customer = await prisma.customer.create({
      data: {
        firstName: `${firstName} ${middleName}`,
        lastName: `${lastName}${i}`,
        email: `customer${i}@example.com`,
        phone: `09${String(10000000 + i).slice(1)}`,
        address: `${randomNumber(1, 999)} Đường ${randomNumber(1, 50)}`,
        city: randomElement(cities),
        identityCard: `00${String(100000000 + i).slice(1)}`,
        status: randomElement(statuses),
        dealerId: assignedDealer.id,
        createdBy: dealerStaffForCustomer.id,
        createdAt: randomDateBetween(recentStart, recentEnd),
      },
    });
    customers.push(customer);
  }

  console.log(`✅ Created ${customers.length} customers\n`);

  // 11. CUSTOMER LIFECYCLE
  console.log("📊 Creating customer lifecycle...");
  const lifecycleData = [];

  for (const customer of customers) {
    const dealerStaffForLifecycle =
      customer.dealerId === dealer1.id
        ? randomElement([dealerStaff1, dealerManager1])
        : customer.dealerId === dealer2.id
          ? randomElement([dealerStaff2, dealerManager2])
          : randomElement(staffMembers);

    const eventCount = randomNumber(1, 3);
    for (let i = 0; i < eventCount; i++) {
      lifecycleData.push({
        customerId: customer.id,
        status: randomElement(statuses),
        notes: randomElement([
          "Quan tâm qua website",
          "Gọi tư vấn",
          "Đã lái thử",
          "Yêu cầu báo giá",
          "Hoàn thành đơn hàng",
        ]),
        changedBy: dealerStaffForLifecycle.id,
        createdAt: randomDateBetween(customer.createdAt, recentEnd),
      });
    }
  }

  await prisma.customerLifecycle.createMany({ data: lifecycleData });
  console.log(`✅ Created ${lifecycleData.length} lifecycle records\n`);

  // 12. TEST DRIVES (60 - Tăng gấp đôi)
  console.log("🎯 Creating 60 test drives...");
  const testDriveData = [];
  const tdStatuses: TestDriveStatus[] = [
    "SCHEDULED",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ];

  for (let i = 0; i < 60; i++) {
    const customer = randomElement(customers);
    const vehicle = randomElement(vehicles);

    const staff =
      customer.dealerId === dealer1.id
        ? randomElement([dealerStaff1, dealerManager1])
        : customer.dealerId === dealer2.id
          ? randomElement([dealerStaff2, dealerManager2])
          : randomElement(staffMembers);

    const status = randomElement(tdStatuses);

    testDriveData.push({
      customerId: customer.id,
      vehicleId: vehicle.id,
      staffId: staff.id,
      scheduledDate: randomDateBetween(recentStart, recentEnd),
      status,
      notes:
        status === "COMPLETED"
          ? "Hoàn thành tốt"
          : status === "NO_SHOW"
            ? "Khách không đến"
            : "Đang chờ xử lý",
      feedback:
        status === "COMPLETED"
          ? randomElement(["Rất hài lòng", "Tốt", "Xuất sắc"])
          : null,
    });
  }

  await prisma.testDrive.createMany({ data: testDriveData });
  console.log("✅ Created 60 test drives\n");

  // 13. QUOTATIONS (50 - Tăng gấp đôi)
  console.log("💰 Creating 50 quotations...");
  const quotationStatuses: QuotationStatus[] = [
    "DRAFT",
    "SENT",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
  ];

  for (let i = 1; i <= 50; i++) {
    const customer = randomElement(customers);
    const vehicle = randomElement(vehicles);

    const staff =
      customer.dealerId === dealer1.id
        ? randomElement([dealerStaff1, dealerManager1])
        : customer.dealerId === dealer2.id
          ? randomElement([dealerStaff2, dealerManager2])
          : randomElement(staffMembers);

    const basePrice = Number(vehicle.retailPrice);
    const discount = randomNumber(0, Math.floor(basePrice * 0.08));
    const finalPrice = basePrice - discount;
    const paymentType: PaymentType = randomElement(["FULL", "INSTALLMENT"]);

    await prisma.quotation.create({
      data: {
        quoteNumber: `QT-2025-${String(i).padStart(3, "0")}`,
        customerId: customer.id,
        vehicleId: vehicle.id,
        staffId: staff.id,
        basePrice,
        discount,
        finalPrice,
        paymentType,
        installmentMonths:
          paymentType === "INSTALLMENT" ? randomElement([36, 48, 60]) : null,
        monthlyPayment:
          paymentType === "INSTALLMENT"
            ? Math.round(finalPrice / randomElement([36, 48, 60]))
            : null,
        validUntil: randomDateBetween(recentStart, new Date("2025-12-31")),
        status: randomElement(quotationStatuses),
        notes: `Báo giá ${vehicle.model}`,
        createdAt: randomDateBetween(recentStart, recentEnd),
      },
    });
  }

  console.log("✅ Created 50 quotations\n");

  // 14. CONTRACTS (30 - Tăng gấp đôi)
  console.log("📋 Creating 30 contracts...");
  const contracts = [];
  let assignedVehicleUnits = 0;
  let fallbackVehicleUnitsCreated = 0;

  const mapContractStatusToUnitStatus = (
    status: ContractStatus
  ): VehicleUnitStatus => {
    switch (status) {
      case "COMPLETED":
        return VehicleUnitStatus.DELIVERED;
      case "DELIVERING":
        return VehicleUnitStatus.IN_TRANSIT;
      case "SIGNED":
        return VehicleUnitStatus.RESERVED;
      case "PENDING":
      case "DRAFT":
        return VehicleUnitStatus.RESERVED;
      default:
        return VehicleUnitStatus.RESERVED;
    }
  };

  for (let i = 1; i <= 30; i++) {
    const customer = randomElement(customers);
    const vehicle = randomElement(vehicles);

    const staff =
      customer.dealerId === dealer1.id
        ? randomElement([dealerStaff1, dealerManager1])
        : customer.dealerId === dealer2.id
          ? randomElement([dealerStaff2, dealerManager2])
          : randomElement(staffMembers);

    const basePrice = Number(vehicle.retailPrice);
    const discount = randomNumber(25400000, Math.floor(basePrice * 0.1));
    const finalPrice = basePrice - discount;
    const paymentType: PaymentType = randomElement(["FULL", "INSTALLMENT"]);
    const status: ContractStatus =
      i <= 18
        ? "COMPLETED"
        : randomElement(["SIGNED", "DELIVERING", "PENDING"]);

    const signedDate = randomDateBetween(recentStart, recentEnd);
    const deliveryDate = new Date(
      signedDate.getTime() + randomNumber(3, 7) * 24 * 60 * 60 * 1000
    );

    const dealerIdForContract = staff.dealerId || customer.dealerId || null;

    let claimedVehicleUnit = await claimVehicleUnitForContract(
      vehicle.id,
      dealerIdForContract
    );

    if (!claimedVehicleUnit) {
      const dealer = dealerIdForContract
        ? dealerMap.get(dealerIdForContract)
        : null;
      const fallbackPrefix = dealer
        ? sanitizeCode(dealer.code || dealer.name || "DLR")
        : "GEN";
      const fallbackVin = generateVin(vehicle, fallbackPrefix);

      await createVehicleUnit({
        vehicleId: vehicle.id,
        vin: fallbackVin,
        engineNumber: `ENG-${fallbackVin}`,
        batterySerial: `BAT-${fallbackVin}`,
        color: vehicle.color,
        status: VehicleUnitStatus.IN_STOCK,
        storageType: dealerIdForContract
          ? VehicleUnitStorageType.DEALER
          : VehicleUnitStorageType.EVM,
        dealerId: dealerIdForContract || null,
        location: dealer?.city
          ? `Kho/Showroom ${dealer.city}`
          : dealer?.name || "Showroom",
        reservedAt: null,
        deliveredAt: null,
      });

      fallbackVehicleUnitsCreated += 1;
      claimedVehicleUnit = await claimVehicleUnitForContract(
        vehicle.id,
        dealerIdForContract
      );
    }

    const contractData: Prisma.ContractCreateInput = {
      contractCode: `CT-2025-${String(i).padStart(3, "0")}`,
      customer: { connect: { id: customer.id } },
      staff: { connect: { id: staff.id } },
      vehicle: { connect: { id: vehicle.id } },
      vehicleUnit: claimedVehicleUnit
        ? { connect: { id: claimedVehicleUnit.id } }
        : undefined,
      basePrice,
      discount,
      finalPrice,
      paymentType,
      installmentMonths:
        paymentType === "INSTALLMENT"
          ? randomElement([36, 48, 60])
          : null,
      monthlyPayment:
        paymentType === "INSTALLMENT"
          ? Math.round(finalPrice / randomElement([36, 48, 60]))
          : null,
      interestRate:
        paymentType === "INSTALLMENT" ? randomNumber(35, 60) / 10 : null,
      status,
      signedAt: signedDate,
      deliveryDate: deliveryDate,
      deliveredAt:
        status === "COMPLETED"
          ? new Date(
              deliveryDate.getTime() + randomNumber(1, 2) * 24 * 60 * 60 * 1000
            )
          : null,
      notes: `Hợp đồng ${vehicle.model}`,
      createdAt: randomDateBetween(recentStart, signedDate),
    };

    const createdContract = await prisma.contract.create({
      data: contractData,
    });
    contracts.push(createdContract);

    if (claimedVehicleUnit) {
      assignedVehicleUnits += 1;

      const nextStatus = mapContractStatusToUnitStatus(status);
      const reservedAt = createdContract.signedAt || signedDate;
      const deliveredAt =
        nextStatus === VehicleUnitStatus.DELIVERED
          ? createdContract.deliveredAt ||
            new Date(
              reservedAt.getTime() + randomNumber(1, 3) * 24 * 60 * 60 * 1000
            )
          : null;

      await prisma.vehicleUnit.update({
        where: { id: claimedVehicleUnit.id },
        data: {
          status: nextStatus,
          reservedAt:
            nextStatus === VehicleUnitStatus.IN_STOCK ? null : reservedAt,
          deliveredAt,
          dealerId: dealerIdForContract || claimedVehicleUnit.dealerId,
          storageType: dealerIdForContract
            ? VehicleUnitStorageType.DEALER
            : claimedVehicleUnit.storageType,
        },
      });
    }
  }

  console.log(
    `✅ Created 30 contracts (gán VIN cho ${assignedVehicleUnits} hợp đồng; thêm mới ${fallbackVehicleUnitsCreated} VIN dự phòng)\n`
  );

  // 15. FEEDBACKS (20 - Tăng)
  console.log("⭐ Creating 20 feedbacks...");
  const feedbackCategories: FeedbackCategory[] = [
    "SERVICE",
    "PRODUCT",
    "DELIVERY",
    "OTHER",
  ];
  const feedbackData = [];

  const completedContracts = contracts.filter((c) => c.status === "COMPLETED");

  for (let i = 0; i < 20; i++) {
    const contract =
      i < completedContracts.length
        ? completedContracts[i]
        : randomElement(completedContracts);
    const customer = contract
      ? await prisma.customer.findUnique({ where: { id: contract.customerId } })
      : randomElement(customers);

    feedbackData.push({
      customerId: customer!.id,
      contractId: contract?.id || null,
      rating: randomNumber(3, 5),
      comment: randomElement([
        "Dịch vụ tốt",
        "Tốt",
        "Hài lòng",
        "Chuyên nghiệp",
        "Rất tốt",
      ]),
      category: randomElement(feedbackCategories),
      createdAt: randomDateBetween(recentStart, recentEnd),
    });
  }

  await prisma.feedback.createMany({ data: feedbackData });
  console.log("✅ Created 20 feedbacks\n");

  // 16. COMPLAINTS (10 - Tăng)
  console.log("🔔 Creating 10 complaints...");
  const complaintStatuses: ComplaintStatus[] = [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
  ];
  const complaintData = [];

  for (let i = 0; i < 10; i++) {
    const customer = randomElement(customers);
    const contract =
      randomElement(contracts.filter((c) => c.customerId === customer.id)) ||
      null;
    const status = randomElement(complaintStatuses);
    const createdDate = randomDateBetween(recentStart, recentEnd);

    const resolver =
      customer.dealerId === dealer1.id
        ? dealerManager1.id
        : customer.dealerId === dealer2.id
          ? dealerManager2.id
          : dealerManager1.id;

    complaintData.push({
      customerId: customer.id,
      contractId: contract?.id || null,
      subject: randomElement([
        "Chậm trả giao xe",
        "Xe có lỗi kỹ thuật",
        "Tư vấn cần cải thiện",
        "Chất lượng dịch vụ",
        "Vấn đề về giá cả",
      ]),
      description: "Khách hàng báo cáo vấn đề",
      status,
      resolution:
        status === "RESOLVED" || status === "CLOSED" ? "Đã xử lý" : null,
      resolvedAt:
        status === "RESOLVED" || status === "CLOSED"
          ? randomDateBetween(createdDate, recentEnd)
          : null,
      resolvedBy:
        status === "RESOLVED" || status === "CLOSED" ? resolver : null,
      createdAt: createdDate,
    });
  }

  await prisma.complaint.createMany({ data: complaintData });
  console.log("✅ Created 10 complaints\n");

  // 17. CUSTOMER DEBTS
  console.log("💳 Creating customer debts...");
  const installmentContracts = contracts.filter(
    (c) => c.paymentType === "INSTALLMENT" && c.status === "COMPLETED"
  );
  const debtData: Prisma.CustomerDebtCreateManyInput[] = [];

  for (const contract of installmentContracts.slice(0, 15)) {
    const totalDebt = Number(contract.finalPrice);
    const monthsPaid = randomNumber(2, 12);
    const paidAmount = Number(contract.monthlyPayment!) * monthsPaid;

    debtData.push({
      customerId: contract.customerId,
      contractId: contract.id,
      totalDebt,
      paidAmount,
      dueDate: new Date(
        contract.signedAt!.getTime() +
          contract.installmentMonths! * 30 * 24 * 60 * 60 * 1000
      ),
      status: (paidAmount >= totalDebt
        ? "PAID"
        : paidAmount > 0
          ? "PARTIAL"
          : "UNPAID") as DebtStatus,
    });
  }

  await prisma.customerDebt.createMany({ data: debtData });
  console.log(`✅ Created ${debtData.length} customer debts\n`);

  // 18. DEALER ORDERS (20 - Tăng)
  console.log("📦 Creating 20 dealer orders...");
  const orderStatuses: DealerOrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  for (let i = 1; i <= 20; i++) {
    const dealer = randomElement([dealer1, dealer2, dealer3]);
    const manager =
      dealer.id === dealer1.id
        ? dealerManager1
        : dealer.id === dealer2.id
          ? dealerManager2
          : dealerManager1;
    const vehicle = randomElement(vehicles);
    const quantity = randomNumber(3, 8);
    const unitPrice = Number(vehicle.wholesalePrice);
    const status: DealerOrderStatus =
      i <= 12
        ? randomElement(["DELIVERED", "SHIPPED"])
        : randomElement(orderStatuses);

    const orderedDate = randomDateBetween(recentStart, recentEnd);
    const confirmedDate =
      status !== "PENDING" ? randomDateBetween(orderedDate, recentEnd) : null;
    const shippedDate =
      status === "SHIPPED" || status === "DELIVERED"
        ? randomDateBetween(confirmedDate || orderedDate, recentEnd)
        : null;
    const deliveredDate =
      status === "DELIVERED"
        ? randomDateBetween(shippedDate || orderedDate, recentEnd)
        : null;

    await prisma.dealerOrder.create({
      data: {
        orderNumber: `DO-2025-${String(i).padStart(3, "0")}`,
        dealerId: dealer.id,
        staffId: manager.id,
        vehicleId: vehicle.id,
        quantity,
        unitPrice,
        totalAmount: unitPrice * quantity,
        status,
        orderedAt: orderedDate,
        confirmedAt: confirmedDate,
        shippedAt: shippedDate,
        deliveredAt: deliveredDate,
        notes: `Đơn hàng ${vehicle.model}`,
      },
    });
  }

  console.log("✅ Created 20 dealer orders\n");

  // 19. DEALER DISCOUNTS (8 - Tăng)
  console.log("🎁 Creating 8 dealer discounts...");
  const discountData: Prisma.DealerDiscountCreateManyInput[] = [
    {
      dealerId: dealer1.id,
      name: "Khuyến mãi Tết 2025",
      description: "Giảm giá mùa Tết",
      discountType: "PERCENTAGE",
      discountValue: 8,
      minPurchase: 889000000,
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-02-15"),
      isActive: false,
    },
    {
      dealerId: dealer1.id,
      name: "Khuyến mãi tháng 10/2025",
      description: "Ưu đãi cuối năm",
      discountType: "PERCENTAGE",
      discountValue: 5,
      minPurchase: 762000000,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-11-30"),
      isActive: true,
    },
    {
      dealerId: dealer1.id,
      name: "Khuyến mãi tháng 11",
      description: "Flash sale tháng 11",
      discountType: "PERCENTAGE",
      discountValue: 7,
      minPurchase: 800000000,
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-11-30"),
      isActive: true,
    },
    {
      dealerId: dealer2.id,
      name: "Flash Sale Q1 2025",
      description: "Giảm 10% cho đơn hàng đầu quý",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minPurchase: 1016000000,
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-03-31"),
      isActive: false,
    },
    {
      dealerId: dealer2.id,
      name: "Ưu đãi tháng 10-11",
      description: "Giảm 6% cho tất cả mẫu xe",
      discountType: "PERCENTAGE",
      discountValue: 6,
      minPurchase: 762000000,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-11-15"),
      isActive: true,
    },
    {
      dealerId: dealer2.id,
      name: "Ưu đãi Model Y - Tháng 11",
      description: "Giảm 12% cho Model Y",
      discountType: "PERCENTAGE",
      discountValue: 12,
      minPurchase: 1200000000,
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-11-30"),
      isActive: true,
    },
    {
      dealerId: dealer3.id,
      name: "Mid-year sale 2025",
      description: "Giảm giá giữa năm",
      discountType: "PERCENTAGE",
      discountValue: 6,
      minPurchase: 762000000,
      startDate: new Date("2025-06-15"),
      endDate: new Date("2025-07-15"),
      isActive: false,
    },
    {
      dealerId: dealer3.id,
      name: "Ưu đãi mùa thu đông",
      description: "Giảm 5% cho tất cả xe",
      discountType: "PERCENTAGE",
      discountValue: 5,
      minPurchase: 700000000,
      startDate: new Date("2025-10-15"),
      endDate: new Date("2025-12-31"),
      isActive: true,
    },
  ];

  await prisma.dealerDiscount.createMany({ data: discountData });
  console.log("✅ Created 8 dealer discounts\n");

  // 20. TARGETS (18 - Tăng)
  console.log("🎯 Creating sales targets for 2025...");
  const targetData = [];

  for (const dealer of [dealer1, dealer2, dealer3]) {
    for (let month = 1; month <= 6; month++) {
      const baseTarget =
        dealer.id === dealer2.id
          ? 17780000000
          : dealer.id === dealer1.id
            ? 13970000000
            : 10160000000;
      const targetAmount = baseTarget + randomNumber(-1270000000, 1270000000);
      const achievedAmount = randomNumber(
        Math.floor(targetAmount * 0.7),
        Math.floor(targetAmount * 1.1)
      );

      targetData.push({
        dealerId: dealer.id,
        year: 2025,
        month,
        targetAmount,
        achievedAmount,
      });
    }
  }

  await prisma.target.createMany({ data: targetData });
  console.log(`✅ Created ${targetData.length} sales targets\n`);

  // 21. DEALER DEBTS (8 - Tăng)
  console.log("💸 Creating dealer debts...");
  const dealerDebtData: Prisma.DealerDebtCreateManyInput[] = [
    {
      dealerId: dealer1.id,
      totalDebt: 9144000000,
      paidAmount: 9144000000,
      dueDate: new Date("2025-09-30"),
      status: "PAID",
    },
    {
      dealerId: dealer1.id,
      totalDebt: 11430000000,
      paidAmount: 5715000000,
      dueDate: new Date("2025-11-30"),
      status: "PARTIAL",
    },
    {
      dealerId: dealer1.id,
      totalDebt: 8600000000,
      paidAmount: 0,
      dueDate: new Date("2025-12-31"),
      status: "UNPAID",
    },
    {
      dealerId: dealer2.id,
      totalDebt: 13208000000,
      paidAmount: 13208000000,
      dueDate: new Date("2025-08-31"),
      status: "PAID",
    },
    {
      dealerId: dealer2.id,
      totalDebt: 17272000000,
      paidAmount: 8636000000,
      dueDate: new Date("2025-10-28"),
      status: "PARTIAL",
    },
    {
      dealerId: dealer2.id,
      totalDebt: 12000000000,
      paidAmount: 4000000000,
      dueDate: new Date("2025-11-30"),
      status: "PARTIAL",
    },
    {
      dealerId: dealer3.id,
      totalDebt: 9000000000,
      paidAmount: 9000000000,
      dueDate: new Date("2025-09-15"),
      status: "PAID",
    },
    {
      dealerId: dealer3.id,
      totalDebt: 7500000000,
      paidAmount: 0,
      dueDate: new Date("2025-12-15"),
      status: "UNPAID",
    },
  ];

  await prisma.dealerDebt.createMany({ data: dealerDebtData });
  console.log("✅ Created 8 dealer debts\n");

  // 22. FINAL SUMMARY
  console.log("\n🎉 Enhanced 2025 Database seeding completed!\n");
  console.log(
    "┌─────────────────────────────────────────────────────────────┐"
  );
  console.log("📊 EXTENDED DATA (Oct 15 - Nov 10, 2025)");
  console.log(
    "└─────────────────────────────────────────────────────────────┘"
  );
  console.log("✓ Regions: 3");
  console.log("✓ Dealers: 3");
  console.log("✓ Dealer Contracts: 3");
  console.log("✓ Users: 6");
  console.log("✓ Manufacturers: 4");
  console.log("✓ Vehicles: 10");
  console.log("✓ Vehicle Images: 10 (with publicId)");
  console.log("✓ EVM Inventory: 10");
  console.log(`✓ Dealer Inventory: ${dealerInventoryData.length}`);
  console.log("✓ Customers: 40 (tăng từ 20)");
  console.log(`✓ Customer Lifecycle: ${lifecycleData.length}`);
  console.log("✓ Test Drives: 60 (tăng từ 30)");
  console.log("✓ Quotations: 50 (tăng từ 25)");
  console.log("✓ Contracts: 30 (tăng từ 15)");
  console.log("✓ Feedbacks: 20 (tăng từ 10)");
  console.log("✓ Complaints: 10 (tăng từ 5)");
  console.log(`✓ Customer Debts: ${debtData.length}`);
  console.log("✓ Dealer Orders: 20 (tăng từ 10)");
  console.log("✓ Dealer Discounts: 8 (tăng từ 5)");
  console.log(`✓ Sales Targets: ${targetData.length}`);
  console.log("✓ Dealer Debts: 8 (tăng từ 4)");
  console.log("✓ Vehicle Units: " + totalVehicleUnitsCreated);
  console.log(
    "─────────────────────────────────────────────────────────────\n"
  );

  console.log("👥 TEST ACCOUNTS:");
  console.log("🔐 Admin: admin@evdealer.com / Admin@123456");
  console.log("🏭 EVM Staff: evm@evdealer.com / Admin@123456");
  console.log("🏢 Manager HN: manager.hn@evdealer.com / Admin@123456");
  console.log("👤 Staff HN: staff.hn@evdealer.com / Admin@123456");
  console.log("🏢 Manager HCM: manager.hcm@evdealer.com / Admin@123456");
  console.log("👤 Staff HCM: staff.hcm@evdealer.com / Admin@123456\n");

  console.log("📅 Date Range: 15/10/2025 - 10/11/2025");
  console.log("🚀 Ready to use!\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Seeding failed with error:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("👋 Disconnected from database");
  });