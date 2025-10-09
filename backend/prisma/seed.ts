import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting 2025 database seeding...\n');

  // Helper để tạo ngày gần đây (random trong khoảng)
  const randomDateBetween = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  const recentStart = new Date('2025-07-01T00:00:00Z'); // Q3 2025 start
  const recentEnd = new Date('2025-10-15T23:59:59Z'); // mid Oct 2025

  // 1. REGIONS
  console.log('📍 Creating regions...');
  const northRegion = await prisma.region.upsert({
    where: { code: 'NORTH' },
    update: {},
    create: { name: 'Miền Bắc', code: 'NORTH' },
  });
  const centralRegion = await prisma.region.upsert({
    where: { code: 'CENTRAL' },
    update: {},
    create: { name: 'Miền Trung', code: 'CENTRAL' },
  });
  const southRegion = await prisma.region.upsert({
    where: { code: 'SOUTH' },
    update: {},
    create: { name: 'Miền Nam', code: 'SOUTH' },
  });
  console.log('✅ Created 3 regions\n');

  // 2. DEALERS
  console.log('🏢 Creating dealers...');
  const dealer1 = await prisma.dealer.upsert({
    where: { code: 'DL-HN-001' },
    update: {},
    create: {
      name: 'EV Hà Nội',
      code: 'DL-HN-001',
      regionId: northRegion.id,
      address: '123 Đường Láng, Đống Đa',
      city: 'Hà Nội',
      phone: '024 1234 5678',
      email: 'hanoi@evdealer.com',
      isActive: true,
    },
  });

  const dealer2 = await prisma.dealer.upsert({
    where: { code: 'DL-HCM-001' },
    update: {},
    create: {
      name: 'EV Sài Gòn',
      code: 'DL-HCM-001',
      regionId: southRegion.id,
      address: '456 Nguyễn Huệ, Quận 1',
      city: 'TP. Hồ Chí Minh',
      phone: '028 1234 5678',
      email: 'saigon@evdealer.com',
      isActive: true,
    },
  });

  const dealer3 = await prisma.dealer.upsert({
    where: { code: 'DL-DN-001' },
    update: {},
    create: {
      name: 'EV Đà Nẵng',
      code: 'DL-DN-001',
      regionId: centralRegion.id,
      address: '789 Trần Phú, Hải Châu',
      city: 'Đà Nẵng',
      phone: '0236 1234 567',
      email: 'danang@evdealer.com',
      isActive: true,
    },
  });

  console.log('✅ Created 3 dealers\n');

  // 3. DEALER CONTRACTS
  console.log('📄 Creating dealer contracts...');
  await prisma.dealerContract.upsert({
    where: { contractCode: 'DC-2025-001' },
    update: {},
    create: {
      contractCode: 'DC-2025-001',
      dealerId: dealer1.id,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      commissionRate: 5.5,
      status: 'ACTIVE',
      signedAt: new Date('2025-01-10'),
    },
  });

  await prisma.dealerContract.upsert({
    where: { contractCode: 'DC-2025-002' },
    update: {},
    create: {
      contractCode: 'DC-2025-002',
      dealerId: dealer2.id,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      commissionRate: 6.0,
      status: 'ACTIVE',
      signedAt: new Date('2025-01-12'),
    },
  });

  console.log('✅ Created dealer contracts\n');

  // 4. USERS (KEEP ACCOUNTS)
  console.log('👥 Creating users (kept original test accounts)...');
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);

  await prisma.user.upsert({
    where: { email: 'admin@evdealer.com' },
    update: {},
    create: {
      email: 'admin@evdealer.com',
      hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      phone: '0901234567',
      role: 'ADMIN',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'evm@evdealer.com' },
    update: {},
    create: {
      email: 'evm@evdealer.com',
      hashedPassword,
      firstName: 'EVM',
      lastName: 'Staff',
      phone: '0901234568',
      role: 'EVM_STAFF',
      isActive: true,
    },
  });

  const dealerManager1 = await prisma.user.upsert({
    where: { email: 'manager.hn@evdealer.com' },
    update: {},
    create: {
      email: 'manager.hn@evdealer.com',
      hashedPassword,
      firstName: 'Nguyễn Văn',
      lastName: 'Quản Lý',
      phone: '0901234569',
      role: 'DEALER_MANAGER',
      dealerId: dealer1.id,
      isActive: true,
    },
  });

  const dealerStaff1 = await prisma.user.upsert({
    where: { email: 'staff.hn@evdealer.com' },
    update: {},
    create: {
      email: 'staff.hn@evdealer.com',
      hashedPassword,
      firstName: 'Trần Thị',
      lastName: 'Nhân Viên',
      phone: '0901234570',
      role: 'DEALER_STAFF',
      dealerId: dealer1.id,
      isActive: true,
    },
  });

  const dealerManager2 = await prisma.user.upsert({
    where: { email: 'manager.hcm@evdealer.com' },
    update: {},
    create: {
      email: 'manager.hcm@evdealer.com',
      hashedPassword,
      firstName: 'Lê Văn',
      lastName: 'Giám Đốc',
      phone: '0907654321',
      role: 'DEALER_MANAGER',
      dealerId: dealer2.id,
      isActive: true,
    },
  });

  const dealerStaff2 = await prisma.user.upsert({
    where: { email: 'staff.hcm@evdealer.com' },
    update: {},
    create: {
      email: 'staff.hcm@evdealer.com',
      hashedPassword,
      firstName: 'Phạm Thị',
      lastName: 'Tư Vấn',
      phone: '0907654322',
      role: 'DEALER_STAFF',
      dealerId: dealer2.id,
      isActive: true,
    },
  });

  console.log('✅ Created 6 users\n');

  // 5. MANUFACTURERS (KEEP)
  console.log('🏭 Ensuring manufacturers exist...');
  const tesla = await prisma.manufacturer.upsert({
    where: { code: 'TESLA' },
    update: {},
    create: {
      name: 'Tesla',
      code: 'TESLA',
      country: 'USA',
      logo: 'https://example.com/tesla-logo.png',
      isActive: true,
    },
  });
  const vinfast = await prisma.manufacturer.upsert({
    where: { code: 'VINFAST' },
    update: {},
    create: {
      name: 'VinFast',
      code: 'VINFAST',
      country: 'Vietnam',
      logo: 'https://example.com/vinfast-logo.png',
      isActive: true,
    },
  });
  const byd = await prisma.manufacturer.upsert({
    where: { code: 'BYD' },
    update: {},
    create: {
      name: 'BYD',
      code: 'BYD',
      country: 'China',
      logo: 'https://example.com/byd-logo.png',
      isActive: true,
    },
  });
  const hyundai = await prisma.manufacturer.upsert({
    where: { code: 'HYUNDAI' },
    update: {},
    create: {
      name: 'Hyundai',
      code: 'HYUNDAI',
      country: 'South Korea',
      logo: 'https://example.com/hyundai-logo.png',
      isActive: true,
    },
  });
  console.log('✅ Ensured manufacturers\n');

  // 6. VEHICLES (NEW for 2025)
  console.log('🚗 Creating 2025 vehicles...');
  const vehicle1 = await prisma.vehicle.create({
    data: {
      manufacturerId: tesla.id,
      model: 'Model 3',
      variant: 'Standard Range Plus 2025',
      year: 2025,
      batteryCapacity: 62,
      range: 455,
      chargingTime: 29,
      motorPower: 215,
      topSpeed: 228,
      acceleration: 5.2,
      seats: 5,
      doors: 4,
      color: 'WHITE',
      bodyType: 'SEDAN',
      wholesalePrice: 36000,
      retailPrice: 41000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'Tesla Model 3 2025',
      specifications: JSON.stringify({ warranty: '8 years / 160,000 km', features: ['Autopilot', 'Glass Roof'] }),
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      manufacturerId: tesla.id,
      model: 'Model Y',
      variant: 'Long Range 2025',
      year: 2025,
      batteryCapacity: 77,
      range: 528,
      chargingTime: 31,
      motorPower: 328,
      topSpeed: 218,
      acceleration: 4.7,
      seats: 7,
      doors: 4,
      color: 'BLACK',
      bodyType: 'SUV',
      wholesalePrice: 47000,
      retailPrice: 54000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'Tesla Model Y 2025',
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      manufacturerId: vinfast.id,
      model: 'VF 8',
      variant: 'Eco 2025',
      year: 2025,
      batteryCapacity: 88,
      range: 425,
      chargingTime: 34,
      motorPower: 263,
      topSpeed: 202,
      acceleration: 5.3,
      seats: 5,
      doors: 4,
      color: 'RED',
      bodyType: 'SUV',
      wholesalePrice: 30500,
      retailPrice: 35500,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'VinFast VF 8 Eco 2025',
    },
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      manufacturerId: vinfast.id,
      model: 'VF 9',
      variant: 'Plus 2025',
      year: 2025,
      batteryCapacity: 125,
      range: 540,
      chargingTime: 38,
      motorPower: 305,
      topSpeed: 202,
      acceleration: 6.3,
      seats: 7,
      doors: 4,
      color: 'BLUE',
      bodyType: 'SUV',
      wholesalePrice: 43000,
      retailPrice: 49000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'VinFast VF 9 Plus 2025',
    },
  });

  const vehicle5 = await prisma.vehicle.create({
    data: {
      manufacturerId: byd.id,
      model: 'Atto 3',
      variant: 'Standard 2025',
      year: 2025,
      batteryCapacity: 61,
      range: 425,
      chargingTime: 28,
      motorPower: 152,
      topSpeed: 162,
      acceleration: 7.1,
      seats: 5,
      doors: 4,
      color: 'SILVER',
      bodyType: 'SUV',
      wholesalePrice: 22500,
      retailPrice: 26500,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'BYD Atto 3 2025',
    },
  });

  const vehicle6 = await prisma.vehicle.create({
    data: {
      manufacturerId: hyundai.id,
      model: 'IONIQ 5',
      variant: 'Long Range AWD 2025',
      year: 2025,
      batteryCapacity: 78,
      range: 488,
      chargingTime: 17,
      motorPower: 230,
      topSpeed: 188,
      acceleration: 5.0,
      seats: 5,
      doors: 4,
      color: 'GREY',
      bodyType: 'SUV',
      wholesalePrice: 39000,
      retailPrice: 45000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'Hyundai IONIQ 5 2025',
    },
  });

  console.log('✅ Created 6 vehicles\n');

  // 7. VEHICLE IMAGES
  console.log('🖼️  Creating vehicle images...');
  await prisma.vehicleImage.createMany({
    data: [
      { vehicleId: vehicle1.id, url: 'https://example.com/tesla-model3-2025-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle2.id, url: 'https://example.com/tesla-modely-2025-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle3.id, url: 'https://example.com/vinfast-vf8-2025-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle4.id, url: 'https://example.com/vinfast-vf9-2025-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle5.id, url: 'https://example.com/byd-atto3-2025-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle6.id, url: 'https://example.com/hyundai-ioniq5-2025-1.jpg', isMain: true, order: 1 },
    ],
  });
  console.log('✅ Created vehicle images\n');

  // 8. EVM INVENTORY
  console.log('📦 Creating EVM inventory (2025)...');
  await prisma.eVMInventory.createMany({
    data: [
      { vehicleId: vehicle1.id, quantity: 120, reserved: 10, available: 110, location: 'Warehouse A' },
      { vehicleId: vehicle2.id, quantity: 90, reserved: 8, available: 82, location: 'Warehouse A' },
      { vehicleId: vehicle3.id, quantity: 160, reserved: 12, available: 148, location: 'Warehouse B' },
      { vehicleId: vehicle4.id, quantity: 70, reserved: 5, available: 65, location: 'Warehouse B' },
      { vehicleId: vehicle5.id, quantity: 220, reserved: 20, available: 200, location: 'Warehouse C' },
      { vehicleId: vehicle6.id, quantity: 95, reserved: 7, available: 88, location: 'Warehouse A' },
    ],
  });
  console.log('✅ Created EVM inventory\n');

  // 9. DEALER INVENTORY
  console.log('🏬 Creating dealer inventory (2025)...');
  await prisma.inventory.createMany({
    data: [
      { dealerId: dealer1.id, vehicleId: vehicle1.id, quantity: 12, reserved: 2, sold: 4, available: 6, location: 'Showroom Floor 1' },
      { dealerId: dealer1.id, vehicleId: vehicle2.id, quantity: 10, reserved: 1, sold: 2, available: 7, location: 'Showroom Floor 1' },
      { dealerId: dealer1.id, vehicleId: vehicle3.id, quantity: 18, reserved: 3, sold: 6, available: 9, location: 'Showroom Floor 2' },
      { dealerId: dealer1.id, vehicleId: vehicle5.id, quantity: 25, reserved: 5, sold: 7, available: 13, location: 'Storage' },

      { dealerId: dealer2.id, vehicleId: vehicle1.id, quantity: 14, reserved: 3, sold: 5, available: 6, location: 'Showroom Main' },
      { dealerId: dealer2.id, vehicleId: vehicle3.id, quantity: 20, reserved: 4, sold: 8, available: 8, location: 'Showroom Main' },
      { dealerId: dealer2.id, vehicleId: vehicle4.id, quantity: 9, reserved: 1, sold: 3, available: 5, location: 'Showroom VIP' },
      { dealerId: dealer2.id, vehicleId: vehicle6.id, quantity: 11, reserved: 2, sold: 3, available: 6, location: 'Showroom Main' },

      { dealerId: dealer3.id, vehicleId: vehicle3.id, quantity: 11, reserved: 2, sold: 3, available: 6, location: 'Showroom' },
      { dealerId: dealer3.id, vehicleId: vehicle5.id, quantity: 18, reserved: 3, sold: 5, available: 10, location: 'Showroom' },
    ],
  });
  console.log('✅ Created dealer inventory\n');

  // 10. CUSTOMERS (new recent customers)
  console.log('👤 Creating customers (2025)...');

  const customer1 = await prisma.customer.create({
    data: {
      firstName: 'Nguyễn Văn',
      lastName: 'A',
      email: 'nguyenvana@example.com',
      phone: '0912345678',
      address: '123 Phố Huế',
      city: 'Hà Nội',
      identityCard: '001234567890',
      status: 'INTERESTED',
      createdAt: randomDateBetween(recentStart, recentEnd),
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      firstName: 'Trần Thị',
      lastName: 'B',
      email: 'tranthib@example.com',
      phone: '0923456789',
      address: '456 Lê Lợi',
      city: 'TP. Hồ Chí Minh',
      identityCard: '002345678901',
      status: 'CONTACTED',
      createdAt: randomDateBetween(recentStart, recentEnd),
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      firstName: 'Lê Văn',
      lastName: 'C',
      email: 'levanc@example.com',
      phone: '0934567890',
      address: '789 Hùng Vương',
      city: 'Hà Nội',
      identityCard: '003456789012',
      status: 'TEST_DRIVE',
      createdAt: randomDateBetween(recentStart, recentEnd),
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      firstName: 'Phạm Thị',
      lastName: 'D',
      email: 'phamthid@example.com',
      phone: '0945678901',
      address: '321 Trần Hưng Đạo',
      city: 'TP. Hồ Chí Minh',
      identityCard: '004567890123',
      status: 'PURCHASED',
      createdAt: randomDateBetween(recentStart, recentEnd),
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      firstName: 'Hoàng Văn',
      lastName: 'E',
      email: 'hoangvane@example.com',
      phone: '0956789012',
      address: '654 Hai Bà Trưng',
      city: 'Đà Nẵng',
      identityCard: '005678901234',
      status: 'QUOTED',
      createdAt: randomDateBetween(recentStart, recentEnd),
    },
  });

  const customer6 = await prisma.customer.create({
    data: {
      firstName: 'Ngô Thanh',
      lastName: 'F',
      email: 'ngothanhf@example.com',
      phone: '0961234567',
      address: '88 Nguyễn Trãi',
      city: 'Hà Nội',
      identityCard: '006123456789',
      status: 'INTERESTED',
      createdAt: randomDateBetween(recentStart, recentEnd),
    },
  });

  console.log('✅ Created 6 customers\n');

  // 11. CUSTOMER LIFECYCLE (recent)
  console.log('📊 Creating customer lifecycle...');
  await prisma.customerLifecycle.createMany({
    data: [
      { customerId: customer1.id, status: 'INTERESTED', notes: 'Quan tâm qua web', changedBy: dealerStaff1.id, createdAt: randomDateBetween(recentStart, recentEnd) },
      { customerId: customer2.id, status: 'CONTACTED', notes: 'Gọi tư vấn', changedBy: dealerStaff2.id, createdAt: randomDateBetween(recentStart, recentEnd) },
      { customerId: customer3.id, status: 'TEST_DRIVE', notes: 'Hoàn thành lái thử', changedBy: dealerStaff1.id, createdAt: randomDateBetween(recentStart, recentEnd) },
      { customerId: customer4.id, status: 'PURCHASED', notes: 'Ký hợp đồng', changedBy: dealerManager2.id, createdAt: randomDateBetween(recentStart, recentEnd) },
      { customerId: customer5.id, status: 'QUOTED', notes: 'Báo giá mẫu VF8', changedBy: dealerStaff1.id, createdAt: randomDateBetween(recentStart, recentEnd) },
      { customerId: customer6.id, status: 'INTERESTED', notes: 'Liên hệ qua sự kiện', changedBy: dealerStaff1.id, createdAt: randomDateBetween(recentStart, recentEnd) },
    ],
  });
  console.log('✅ Created customer lifecycle records\n');

  // 12. TEST DRIVES
  console.log('🏎️  Creating test drives (2025)...');
  await prisma.testDrive.createMany({
    data: [
      {
        customerId: customer3.id,
        vehicleId: vehicle1.id,
        staffId: dealerStaff1.id,
        scheduledDate: randomDateBetween(recentStart, recentEnd),
        status: 'COMPLETED',
        notes: 'Khách hài lòng',
        feedback: 'Tốt',
      },
      {
        customerId: customer5.id,
        vehicleId: vehicle3.id,
        staffId: dealerStaff1.id,
        scheduledDate: randomDateBetween(recentStart, recentEnd),
        status: 'SCHEDULED',
        notes: 'Hẹn lái thử VF8',
      },
      {
        customerId: customer2.id,
        vehicleId: vehicle6.id,
        staffId: dealerStaff2.id,
        scheduledDate: randomDateBetween(recentStart, recentEnd),
        status: 'CONFIRMED',
        notes: 'Đã xác nhận',
      },
    ],
  });
  console.log('✅ Created test drives\n');

  // 13. QUOTATIONS (2025)
  console.log('💰 Creating quotations (2025)...');
  await prisma.quotation.create({
    data: {
      quoteNumber: 'QT-2025-001',
      customerId: customer3.id,
      vehicleId: vehicle1.id,
      staffId: dealerStaff1.id,
      basePrice: 41000,
      discount: 2000,
      finalPrice: 39000,
      paymentType: 'FULL',
      validUntil: randomDateBetween(recentStart, recentEnd),
      status: 'SENT',
      notes: 'Ưu đãi Q3/2025',
    },
  });

  await prisma.quotation.create({
    data: {
      quoteNumber: 'QT-2025-002',
      customerId: customer5.id,
      vehicleId: vehicle3.id,
      staffId: dealerStaff1.id,
      basePrice: 35500,
      discount: 1500,
      finalPrice: 34000,
      paymentType: 'INSTALLMENT',
      installmentMonths: 60,
      monthlyPayment: 660,
      validUntil: randomDateBetween(recentStart, recentEnd),
      status: 'SENT',
      notes: 'Trả góp 60 tháng 2025',
    },
  });
  console.log('✅ Created quotations\n');

  // 14. CONTRACTS (2025)
  console.log('📝 Creating contracts (2025)...');
  const contract1 = await prisma.contract.create({
    data: {
      contractCode: 'CT-2025-001',
      customerId: customer4.id,
      staffId: dealerStaff2.id,
      vehicleId: vehicle1.id,
      basePrice: 41000,
      discount: 2500,
      finalPrice: 38500,
      paymentType: 'FULL',
      status: 'COMPLETED',
      signedAt: randomDateBetween(new Date('2025-08-01'), recentEnd),
      deliveryDate: randomDateBetween(new Date('2025-08-05'), recentEnd),
      deliveredAt: randomDateBetween(new Date('2025-08-05'), recentEnd),
      notes: 'Khách thanh toán đầy đủ 2025',
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      contractCode: 'CT-2025-002',
      customerId: customer2.id,
      staffId: dealerStaff2.id,
      vehicleId: vehicle6.id,
      basePrice: 45000,
      discount: 2000,
      finalPrice: 43000,
      paymentType: 'INSTALLMENT',
      installmentMonths: 48,
      monthlyPayment: 980,
      interestRate: 4.5,
      status: 'SIGNED',
      signedAt: randomDateBetween(new Date('2025-09-01'), recentEnd),
      deliveryDate: randomDateBetween(new Date('2025-09-05'), recentEnd),
      notes: 'Trả góp Q3-Q4 2025',
    },
  });
  console.log('✅ Created contracts\n');

  // 15. FEEDBACKS
  console.log('⭐ Creating feedbacks (2025)...');
  await prisma.feedback.createMany({
    data: [
      {
        customerId: customer4.id,
        contractId: contract1.id,
        rating: 5,
        comment: 'Dịch vụ tốt, giao xe đúng hẹn',
        category: 'SERVICE',
        createdAt: randomDateBetween(recentStart, recentEnd),
      },
      {
        customerId: customer3.id,
        rating: 4,
        comment: 'Tư vấn tận tâm',
        category: 'SERVICE',
        createdAt: randomDateBetween(recentStart, recentEnd),
      },
    ],
  });
  console.log('✅ Created feedbacks\n');

  // 16. CUSTOMER DEBTS
  console.log('💳 Creating customer debts (2025)...');
  await prisma.customerDebt.create({
    data: {
      customerId: customer2.id,
      contractId: contract2.id,
      totalDebt: 43000,
      paidAmount: 9800, // giả sử 10 tháng trả
      dueDate: new Date('2026-04-01'),
      status: 'PARTIAL',
    },
  });
  console.log('✅ Created customer debts\n');

  // 17. DEALER ORDERS
  console.log('📦 Creating dealer orders (2025)...');
  await prisma.dealerOrder.createMany({
    data: [
      {
        orderNumber: 'DO-2025-001',
        dealerId: dealer1.id,
        staffId: dealerManager1.id,
        vehicleId: vehicle1.id,
        quantity: 8,
        unitPrice: 36000,
        totalAmount: 288000,
        status: 'DELIVERED',
        orderedAt: randomDateBetween(new Date('2025-07-01'), recentEnd),
        confirmedAt: randomDateBetween(new Date('2025-07-02'), recentEnd),
        shippedAt: randomDateBetween(new Date('2025-07-05'), recentEnd),
        deliveredAt: randomDateBetween(new Date('2025-07-10'), recentEnd),
        notes: 'Lô nhập 2025 Q3',
      },
      {
        orderNumber: 'DO-2025-002',
        dealerId: dealer2.id,
        staffId: dealerManager2.id,
        vehicleId: vehicle6.id,
        quantity: 10,
        unitPrice: 39000,
        totalAmount: 390000,
        status: 'SHIPPED',
        orderedAt: randomDateBetween(new Date('2025-08-01'), recentEnd),
        confirmedAt: randomDateBetween(new Date('2025-08-02'), recentEnd),
        shippedAt: randomDateBetween(new Date('2025-08-05'), recentEnd),
        notes: 'Nhập IONIQ5 cho HCM',
      },
    ],
  });
  console.log('✅ Created dealer orders\n');

  // 18. DEALER DISCOUNTS (2025)
  console.log('🎁 Creating dealer discounts (2025)...');
  await prisma.dealerDiscount.createMany({
    data: [
      {
        dealerId: dealer1.id,
        name: 'Khuyến mãi mùa thu 2025',
        description: 'Giảm giá cho Model 3 2025',
        discountType: 'FIXED',
        discountValue: 2500,
        minPurchase: 36000,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-09-30'),
        isActive: true,
      },
      {
        dealerId: dealer2.id,
        name: 'Khuyến mãi Oktober 2025',
        description: 'Giảm 4% cho các mẫu chọn lọc',
        discountType: 'PERCENTAGE',
        discountValue: 4,
        minPurchase: 30000,
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-15'),
        isActive: true,
      },
    ],
  });
  console.log('✅ Created dealer discounts\n');

  // 19. TARGETS (2025)
  console.log('🎯 Creating sales targets (2025)...');
  await prisma.target.createMany({
    data: [
      { dealerId: dealer1.id, year: 2025, month: 7, targetAmount: 520000, achievedAmount: 480000 },
      { dealerId: dealer1.id, year: 2025, month: 8, targetAmount: 560000, achievedAmount: 540000 },
      { dealerId: dealer2.id, year: 2025, month: 7, targetAmount: 720000, achievedAmount: 700000 },
      { dealerId: dealer3.id, year: 2025, month: 9, targetAmount: 420000, achievedAmount: 350000 },
    ],
  });
  console.log('✅ Created sales targets\n');

  // 20. DEALER DEBTS (2025)
  console.log('💸 Creating dealer debts (2025)...');
  await prisma.dealerDebt.createMany({
    data: [
      { dealerId: dealer1.id, totalDebt: 360000, paidAmount: 360000, dueDate: new Date('2025-09-30'), status: 'PAID' },
      { dealerId: dealer2.id, totalDebt: 420000, paidAmount: 210000, dueDate: new Date('2025-10-28'), status: 'PARTIAL' },
    ],
  });
  console.log('✅ Created dealer debts\n');

  // 21. COMPLAINTS
  console.log('📢 Creating complaints (2025)...');
  await prisma.complaint.createMany({
    data: [
      {
        customerId: customer2.id,
        contractId: contract2.id,
        subject: 'Chậm trễ giao xe 2025',
        description: 'Giao trễ 2 ngày so với lịch',
        status: 'RESOLVED',
        resolution: 'Đã hỗ trợ phí giao và voucher',
        resolvedAt: randomDateBetween(recentStart, recentEnd),
        resolvedBy: dealerManager2.id,
      },
      {
        customerId: customer6.id,
        subject: 'Tư vấn cần cải thiện',
        description: 'Nhân viên cần training thêm',
        status: 'IN_PROGRESS',
      },
    ],
  });
  console.log('✅ Created complaints\n');

  // 22. SUMMARY OUTPUT
  console.log('\n🎉 2025 Database seeding completed successfully!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 SEEDING SUMMARY (2025)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✓ Regions: 3 (North, Central, South)');
  console.log('✓ Dealers: 3 (Hà Nội, HCM, Đà Nẵng)');
  console.log('✓ Dealer Contracts: 2');
  console.log('✓ Users: 6 (kept original test accounts)');
  console.log('✓ Manufacturers: 4 (Tesla, VinFast, BYD, Hyundai)');
  console.log('✓ Vehicles: 6 new 2025 models');
  console.log('✓ Vehicle Images: several');
  console.log('✓ Inventories (EVM & Dealer) created');
  console.log('✓ Customers: 6 recent customers');
  console.log('✓ Test Drives, Quotations, Contracts, Feedbacks, Orders, Discounts created for 2025');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📝 TEST ACCOUNTS (kept):');
  console.log('🔐 Admin: admin@evdealer.com / Admin@123456');
  console.log('🏭 EVM Staff: evm@evdealer.com / Admin@123456');
  console.log('👔 Dealer Manager (Hà Nội): manager.hn@evdealer.com / Admin@123456');
  console.log('👤 Dealer Staff (Hà Nội): staff.hn@evdealer.com / Admin@123456');
  console.log('👔 Dealer Manager (HCM): manager.hcm@evdealer.com / Admin@123456');
  console.log('👤 Dealer Staff (HCM): staff.hcm@evdealer.com / Admin@123456\n');

  console.log('🚀 Run server: npm run dev');
  console.log('📚 API docs: http://localhost:5000/api/v1');
  console.log('💾 Run Prisma Studio if needed');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed with error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('👋 Disconnected from database');
  });
