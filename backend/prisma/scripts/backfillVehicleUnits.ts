import { PrismaClient, VehicleUnitStatus, VehicleUnitStorageType, ContractStatus } from '@prisma/client';

const prisma = new PrismaClient();

type VehicleUnitRecord = {
  id: string;
  vehicleId: string;
  dealerId: string | null;
  status: VehicleUnitStatus;
  storageType: VehicleUnitStorageType;
  location: string | null;
  reservedAt: Date | null;
  deliveredAt: Date | null;
};

type DealerRecord = {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
};

const sanitizeCode = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

const mapContractStatusToUnitStatus = (status: ContractStatus): VehicleUnitStatus => {
  switch (status) {
    case 'COMPLETED':
      return VehicleUnitStatus.DELIVERED;
    case 'DELIVERING':
      return VehicleUnitStatus.IN_TRANSIT;
    case 'SIGNED':
      return VehicleUnitStatus.RESERVED;
    default:
      return VehicleUnitStatus.RESERVED;
  }
};

async function main() {
  console.log('🚗 Backfilling vehicle units for existing contracts...');

  const dealers = await prisma.dealer.findMany({
    select: { id: true, name: true, code: true, city: true },
  });
  const dealerMap = new Map<string, DealerRecord>(dealers.map((dealer) => [dealer.id, dealer]));

  const dealerUnitsMap = new Map<string, VehicleUnitRecord[]>();
  const evmUnitsMap = new Map<string, VehicleUnitRecord[]>();

  const inStockUnits = await prisma.vehicleUnit.findMany({
    where: { status: VehicleUnitStatus.IN_STOCK },
    select: {
      id: true,
      vehicleId: true,
      dealerId: true,
      status: true,
      storageType: true,
      location: true,
      reservedAt: true,
      deliveredAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  inStockUnits.forEach((unit) => {
    if (unit.storageType === VehicleUnitStorageType.DEALER && unit.dealerId) {
      const key = `${unit.dealerId}_${unit.vehicleId}`;
      if (!dealerUnitsMap.has(key)) {
        dealerUnitsMap.set(key, []);
      }
      dealerUnitsMap.get(key)!.push(unit);
    } else if (unit.storageType === VehicleUnitStorageType.EVM) {
      if (!evmUnitsMap.has(unit.vehicleId)) {
        evmUnitsMap.set(unit.vehicleId, []);
      }
      evmUnitsMap.get(unit.vehicleId)!.push(unit);
    }
  });

  const contractsToUpdate = await prisma.contract.findMany({
    where: { vehicleUnitId: null },
    include: {
      staff: { select: { id: true, dealerId: true } },
      customer: { select: { dealerId: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (contractsToUpdate.length === 0) {
    console.log('✅ All contracts already have vehicle units. Nothing to update.');
    return;
  }

  let assignedCount = 0;
  let createdUnitsCount = 0;

  const claimUnit = async (
    vehicleId: string,
    dealerId: string | null
  ): Promise<VehicleUnitRecord | null> => {
    if (dealerId) {
      const dealerKey = `${dealerId}_${vehicleId}`;
      const dealerUnits = dealerUnitsMap.get(dealerKey);
      if (dealerUnits?.length) {
        const unit = dealerUnits.shift()!;
        if (!dealerUnits.length) dealerUnitsMap.delete(dealerKey);
        return unit;
      }
    }

    const evmUnits = evmUnitsMap.get(vehicleId);
    if (evmUnits?.length) {
      const unit = evmUnits.shift()!;
      if (!evmUnits.length) evmUnitsMap.delete(vehicleId);

      if (dealerId) {
        const dealer = dealerMap.get(dealerId);
        const updatedUnit = await prisma.vehicleUnit.update({
          where: { id: unit.id },
          data: {
            dealerId,
            storageType: VehicleUnitStorageType.DEALER,
            location: dealer?.city ? `Kho/Showroom ${dealer.city}` : dealer?.name || 'Showroom',
          },
        });
        return updatedUnit;
      }

      return unit;
    }

    return null;
  };

  for (const contract of contractsToUpdate) {
    const dealerId = contract.staff?.dealerId || contract.customer?.dealerId || null;
    let unit = await claimUnit(contract.vehicleId, dealerId);

    if (!unit) {
      const dealer = dealerId ? dealerMap.get(dealerId) : null;
      const prefix = dealer ? sanitizeCode(dealer.code || dealer.name || 'DLR') : 'GEN';
      const fallbackVin = `${prefix}-${String(Date.now()).slice(-6)}-${Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, '0')}`;

      const createdUnit = await prisma.vehicleUnit.create({
        data: {
          vehicleId: contract.vehicleId,
          vin: fallbackVin,
          engineNumber: `ENG-${fallbackVin}`,
          batterySerial: `BAT-${fallbackVin}`,
          color: null,
          status: VehicleUnitStatus.IN_STOCK,
          storageType: dealerId ? VehicleUnitStorageType.DEALER : VehicleUnitStorageType.EVM,
          dealerId,
          location: dealer?.city ? `Kho/Showroom ${dealer.city}` : dealer?.name || 'Showroom',
        },
      });

      createdUnitsCount += 1;

      if (dealerId) {
        const dealerKey = `${dealerId}_${contract.vehicleId}`;
        if (!dealerUnitsMap.has(dealerKey)) {
          dealerUnitsMap.set(dealerKey, []);
        }
        dealerUnitsMap.get(dealerKey)!.push(createdUnit);
      } else {
        if (!evmUnitsMap.has(contract.vehicleId)) {
          evmUnitsMap.set(contract.vehicleId, []);
        }
        evmUnitsMap.get(contract.vehicleId)!.push(createdUnit);
      }

      unit = await claimUnit(contract.vehicleId, dealerId);
    }

    if (!unit) {
      console.warn('⚠️ Không tìm thấy hoặc tạo được VIN cho hợp đồng', contract.contractCode);
      continue;
    }

    const nextStatus = mapContractStatusToUnitStatus(contract.status);
    const reservedAt = contract.signedAt || new Date();
    const deliveredAt =
      nextStatus === VehicleUnitStatus.DELIVERED
        ? contract.deliveredAt || new Date(reservedAt.getTime() + 2 * 24 * 60 * 60 * 1000)
        : null;

    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        vehicleUnitId: unit.id,
      },
    });

    await prisma.vehicleUnit.update({
      where: { id: unit.id },
      data: {
        status: nextStatus,
        reservedAt: nextStatus === VehicleUnitStatus.IN_STOCK ? null : reservedAt,
        deliveredAt,
      },
    });

    assignedCount += 1;
  }

  console.log(`✅ Assigned VINs to ${assignedCount} contracts.`);
  if (createdUnitsCount > 0) {
    console.log(`ℹ️ Created ${createdUnitsCount} additional VIN(s) to satisfy demand.`);
  }
}

main()
  .catch((error) => {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
