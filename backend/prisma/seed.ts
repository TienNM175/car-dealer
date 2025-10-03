import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ============================================
  // 1. CREATE REGIONS
  // ============================================
  console.log('📍 Creating regions...');
  
  const northRegion = await prisma.region.upsert({
    where: { code: 'NORTH' },
    update: {},
    create: {
      name: 'Miền Bắc',
      code: 'NORTH',
    },
  });

  const centralRegion = await prisma.region.upsert({
    where: { code: 'CENTRAL' },
    update: {},
    create: {
      name: 'Miền Trung',
      code: 'CENTRAL',
    },
  });

  const southRegion = await prisma.region.upsert({
    where: { code: 'SOUTH' },
    update: {},
    create: {
      name: 'Miền Nam',
      code: 'SOUTH',
    },
  });

  console.log('✅ Created 3 regions\n');

  // ============================================
  // 2. CREATE DEALERS
  // ============================================
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

  // ============================================
  // 3. CREATE DEALER CONTRACTS
  // ============================================
  console.log('📄 Creating dealer contracts...');

  await prisma.dealerContract.upsert({
    where: { contractCode: 'DC-2024-001' },
    update: {},
    create: {
      contractCode: 'DC-2024-001',
      dealerId: dealer1.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      commissionRate: 5.5,
      status: 'ACTIVE',
      signedAt: new Date('2024-01-01'),
    },
  });

  await prisma.dealerContract.upsert({
    where: { contractCode: 'DC-2024-002' },
    update: {},
    create: {
      contractCode: 'DC-2024-002',
      dealerId: dealer2.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      commissionRate: 6.0,
      status: 'ACTIVE',
      signedAt: new Date('2024-01-01'),
    },
  });

  console.log('✅ Created dealer contracts\n');

  // ============================================
  // 4. CREATE USERS
  // ============================================
  console.log('👥 Creating users...');
  
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);
  
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

  // ============================================
  // 5. CREATE MANUFACTURERS
  // ============================================
  console.log('🏭 Creating manufacturers...');

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

  console.log('✅ Created 4 manufacturers\n');

  // ============================================
  // 6. CREATE VEHICLES
  // ============================================
  console.log('🚗 Creating vehicles...');

  const vehicle1 = await prisma.vehicle.create({
    data: {
      manufacturerId: tesla.id,
      model: 'Model 3',
      variant: 'Standard Range Plus',
      year: 2024,
      batteryCapacity: 60,
      range: 448,
      chargingTime: 30,
      motorPower: 211,
      topSpeed: 225,
      acceleration: 5.3,
      seats: 5,
      doors: 4,
      color: 'WHITE',
      bodyType: 'SEDAN',
      wholesalePrice: 35000,
      retailPrice: 40000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'Tesla Model 3 Standard Range Plus - Xe điện sedan hiệu suất cao với công nghệ tự lái tiên tiến.',
      specifications: JSON.stringify({
        warranty: '8 years / 160,000 km',
        features: ['Autopilot', 'Glass Roof', 'Premium Audio', '15-inch Touchscreen'],
        safety: ['5-star NCAP', 'Advanced Airbags', 'Stability Control'],
      }),
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      manufacturerId: tesla.id,
      model: 'Model Y',
      variant: 'Long Range',
      year: 2024,
      batteryCapacity: 75,
      range: 525,
      chargingTime: 32,
      motorPower: 324,
      topSpeed: 217,
      acceleration: 4.8,
      seats: 7,
      doors: 4,
      color: 'BLACK',
      bodyType: 'SUV',
      wholesalePrice: 45000,
      retailPrice: 52000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'Tesla Model Y Long Range - SUV điện 7 chỗ, hiệu suất cao và tiện nghi.',
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      manufacturerId: vinfast.id,
      model: 'VF 8',
      variant: 'Eco',
      year: 2024,
      batteryCapacity: 87.7,
      range: 420,
      chargingTime: 35,
      motorPower: 260,
      topSpeed: 200,
      acceleration: 5.5,
      seats: 5,
      doors: 4,
      color: 'RED',
      bodyType: 'SUV',
      wholesalePrice: 30000,
      retailPrice: 35000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'VinFast VF 8 Eco - SUV điện Việt Nam với thiết kế hiện đại.',
    },
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      manufacturerId: vinfast.id,
      model: 'VF 9',
      variant: 'Plus',
      year: 2024,
      batteryCapacity: 123,
      range: 531,
      chargingTime: 40,
      motorPower: 300,
      topSpeed: 200,
      acceleration: 6.5,
      seats: 7,
      doors: 4,
      color: 'BLUE',
      bodyType: 'SUV',
      wholesalePrice: 42000,
      retailPrice: 48000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'VinFast VF 9 Plus - SUV điện cao cấp 7 chỗ.',
    },
  });

  const vehicle5 = await prisma.vehicle.create({
    data: {
      manufacturerId: byd.id,
      model: 'Atto 3',
      variant: 'Standard',
      year: 2024,
      batteryCapacity: 60.48,
      range: 420,
      chargingTime: 29,
      motorPower: 150,
      topSpeed: 160,
      acceleration: 7.3,
      seats: 5,
      doors: 4,
      color: 'SILVER',
      bodyType: 'SUV',
      wholesalePrice: 22000,
      retailPrice: 26000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'BYD Atto 3 - SUV điện giá tốt với công nghệ pin Blade.',
    },
  });

  const vehicle6 = await prisma.vehicle.create({
    data: {
      manufacturerId: hyundai.id,
      model: 'IONIQ 5',
      variant: 'Long Range AWD',
      year: 2024,
      batteryCapacity: 77.4,
      range: 481,
      chargingTime: 18,
      motorPower: 225,
      topSpeed: 185,
      acceleration: 5.2,
      seats: 5,
      doors: 4,
      color: 'GREY',
      bodyType: 'SUV',
      wholesalePrice: 38000,
      retailPrice: 44000,
      currency: 'USD',
      status: 'ACTIVE',
      description: 'Hyundai IONIQ 5 - SUV điện với thiết kế tương lai và sạc siêu nhanh.',
    },
  });

  console.log('✅ Created 6 vehicles\n');

  // ============================================
  // 7. CREATE VEHICLE IMAGES
  // ============================================
  console.log('🖼️  Creating vehicle images...');

  await prisma.vehicleImage.createMany({
    data: [
      { vehicleId: vehicle1.id, url: 'https://example.com/tesla-model3-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle1.id, url: 'https://example.com/tesla-model3-2.jpg', isMain: false, order: 2 },
      { vehicleId: vehicle2.id, url: 'https://example.com/tesla-modely-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle3.id, url: 'https://example.com/vinfast-vf8-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle4.id, url: 'https://example.com/vinfast-vf9-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle5.id, url: 'https://example.com/byd-atto3-1.jpg', isMain: true, order: 1 },
      { vehicleId: vehicle6.id, url: 'https://example.com/hyundai-ioniq5-1.jpg', isMain: true, order: 1 },
    ],
  });

  console.log('✅ Created vehicle images\n');

  // ============================================
  // 8. CREATE EVM INVENTORY
  // ============================================
  console.log('📦 Creating EVM inventory...');

  await prisma.eVMInventory.createMany({
    data: [
      { vehicleId: vehicle1.id, quantity: 100, reserved: 15, available: 85, location: 'Warehouse A' },
      { vehicleId: vehicle2.id, quantity: 80, reserved: 10, available: 70, location: 'Warehouse A' },
      { vehicleId: vehicle3.id, quantity: 150, reserved: 20, available: 130, location: 'Warehouse B' },
      { vehicleId: vehicle4.id, quantity: 60, reserved: 8, available: 52, location: 'Warehouse B' },
      { vehicleId: vehicle5.id, quantity: 200, reserved: 30, available: 170, location: 'Warehouse C' },
      { vehicleId: vehicle6.id, quantity: 90, reserved: 12, available: 78, location: 'Warehouse A' },
    ],
  });

  console.log('✅ Created EVM inventory\n');

  // ============================================
  // 9. CREATE DEALER INVENTORY
  // ============================================
  console.log('🏬 Creating dealer inventory...');

  await prisma.inventory.createMany({
    data: [
      // Dealer 1 (Hà Nội)
      { dealerId: dealer1.id, vehicleId: vehicle1.id, quantity: 10, reserved: 2, sold: 3, available: 5, location: 'Showroom Floor 1' },
      { dealerId: dealer1.id, vehicleId: vehicle2.id, quantity: 8, reserved: 1, sold: 2, available: 5, location: 'Showroom Floor 1' },
      { dealerId: dealer1.id, vehicleId: vehicle3.id, quantity: 15, reserved: 3, sold: 5, available: 7, location: 'Showroom Floor 2' },
      { dealerId: dealer1.id, vehicleId: vehicle5.id, quantity: 20, reserved: 4, sold: 6, available: 10, location: 'Storage' },
      
      // Dealer 2 (HCM)
      { dealerId: dealer2.id, vehicleId: vehicle1.id, quantity: 12, reserved: 3, sold: 4, available: 5, location: 'Showroom Main' },
      { dealerId: dealer2.id, vehicleId: vehicle3.id, quantity: 18, reserved: 4, sold: 6, available: 8, location: 'Showroom Main' },
      { dealerId: dealer2.id, vehicleId: vehicle4.id, quantity: 7, reserved: 1, sold: 2, available: 4, location: 'Showroom VIP' },
      { dealerId: dealer2.id, vehicleId: vehicle6.id, quantity: 10, reserved: 2, sold: 3, available: 5, location: 'Showroom Main' },
      
      // Dealer 3 (Đà Nẵng)
      { dealerId: dealer3.id, vehicleId: vehicle3.id, quantity: 10, reserved: 2, sold: 3, available: 5, location: 'Showroom' },
      { dealerId: dealer3.id, vehicleId: vehicle5.id, quantity: 15, reserved: 3, sold: 4, available: 8, location: 'Showroom' },
    ],
  });

  console.log('✅ Created dealer inventory\n');

  // ============================================
  // 10. CREATE CUSTOMERS
  // ============================================
  console.log('👤 Creating customers...');

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
    },
  });

  console.log('✅ Created 5 customers\n');

  // ============================================
  // 11. CREATE CUSTOMER LIFECYCLE
  // ============================================
  console.log('📊 Creating customer lifecycle...');

  await prisma.customerLifecycle.createMany({
    data: [
      { customerId: customer1.id, status: 'INTERESTED', notes: 'Khách hàng quan tâm qua website', changedBy: dealerStaff1.id },
      { customerId: customer2.id, status: 'INTERESTED', notes: 'Walk-in customer', changedBy: dealerStaff2.id },
      { customerId: customer2.id, status: 'CONTACTED', notes: 'Đã gọi điện tư vấn', changedBy: dealerStaff2.id },
      { customerId: customer3.id, status: 'INTERESTED', notes: 'Liên hệ qua hotline', changedBy: dealerStaff1.id },
      { customerId: customer3.id, status: 'CONTACTED', notes: 'Đã hẹn lịch lái thử', changedBy: dealerStaff1.id },
      { customerId: customer3.id, status: 'TEST_DRIVE', notes: 'Hoàn thành lái thử', changedBy: dealerStaff1.id },
      { customerId: customer4.id, status: 'INTERESTED', notes: 'Quan tâm Tesla Model 3', changedBy: dealerStaff2.id },
      { customerId: customer4.id, status: 'CONTACTED', notes: 'Đã tư vấn chi tiết', changedBy: dealerStaff2.id },
      { customerId: customer4.id, status: 'QUOTED', notes: 'Đã báo giá', changedBy: dealerStaff2.id },
      { customerId: customer4.id, status: 'PURCHASED', notes: 'Đã ký hợp đồng', changedBy: dealerManager2.id },
    ],
  });

  console.log('✅ Created customer lifecycle records\n');

  // ============================================
  // 12. CREATE TEST DRIVES
  // ============================================
  console.log('🏎️  Creating test drives...');

  await prisma.testDrive.createMany({
    data: [
      {
        customerId: customer3.id,
        vehicleId: vehicle1.id,
        staffId: dealerStaff1.id,
        scheduledDate: new Date('2024-10-15T10:00:00'),
        status: 'COMPLETED',
        notes: 'Khách hàng hài lòng với trải nghiệm',
        feedback: 'Xe chạy êm, tăng tốc tốt',
      },
      {
        customerId: customer5.id,
        vehicleId: vehicle3.id,
        staffId: dealerStaff1.id,
        scheduledDate: new Date('2024-10-20T14:00:00'),
        status: 'SCHEDULED',
        notes: 'Khách muốn thử VF8',
      },
      {
        customerId: customer2.id,
        vehicleId: vehicle6.id,
        staffId: dealerStaff2.id,
        scheduledDate: new Date('2024-10-18T09:00:00'),
        status: 'CONFIRMED',
        notes: 'Đã xác nhận lịch hẹn',
      },
    ],
  });

  console.log('✅ Created test drives\n');

  // ============================================
  // 13. CREATE QUOTATIONS
  // ============================================
  console.log('💰 Creating quotations...');

  await prisma.quotation.create({
    data: {
      quoteNumber: 'QT-2024-001',
      customerId: customer3.id,
      vehicleId: vehicle1.id,
      staffId: dealerStaff1.id,
      basePrice: 40000,
      discount: 2000,
      finalPrice: 38000,
      paymentType: 'FULL',
      validUntil: new Date('2024-11-30'),
      status: 'SENT',
      notes: 'Ưu đãi đặc biệt tháng 10',
    },
  });

   await prisma.quotation.create({
    data: {
      quoteNumber: 'QT-2024-002',
      customerId: customer5.id,
      vehicleId: vehicle3.id,
      staffId: dealerStaff1.id,
      basePrice: 35000,
      discount: 1500,
      finalPrice: 33500,
      paymentType: 'INSTALLMENT',
      installmentMonths: 60,
      monthlyPayment: 650,
      validUntil: new Date('2024-11-15'),
      status: 'SENT',
      notes: 'Trả góp 60 tháng, lãi suất 5%',
    },
  });

  console.log('✅ Created quotations\n');

  // ============================================
  // 14. CREATE CONTRACTS
  // ============================================
  console.log('📝 Creating contracts...');

  const contract1 = await prisma.contract.create({
    data: {
      contractCode: 'CT-2024-001',
      customerId: customer4.id,
      staffId: dealerStaff2.id,
      vehicleId: vehicle1.id,
      basePrice: 40000,
      discount: 2500,
      finalPrice: 37500,
      paymentType: 'FULL',
      status: 'COMPLETED',
      signedAt: new Date('2024-09-15'),
      deliveryDate: new Date('2024-09-20'),
      deliveredAt: new Date('2024-09-20'),
      notes: 'Khách hàng hài lòng, thanh toán đầy đủ',
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      contractCode: 'CT-2024-002',
      customerId: customer2.id,
      staffId: dealerStaff2.id,
      vehicleId: vehicle6.id,
      basePrice: 44000,
      discount: 2000,
      finalPrice: 42000,
      paymentType: 'INSTALLMENT',
      installmentMonths: 48,
      monthlyPayment: 950,
      interestRate: 4.5,
      status: 'SIGNED',
      signedAt: new Date('2024-10-01'),
      deliveryDate: new Date('2024-10-25'),
      notes: 'Trả góp qua ngân hàng TPBank',
    },
  });

  console.log('✅ Created contracts\n');

  // ============================================
  // 15. CREATE FEEDBACKS
  // ============================================
  console.log('⭐ Creating feedbacks...');

  await prisma.feedback.createMany({
    data: [
      {
        customerId: customer4.id,
        contractId: contract1.id,
        rating: 5,
        comment: 'Dịch vụ tuyệt vời, xe chất lượng cao. Rất hài lòng!',
        category: 'SERVICE',
      },
      {
        customerId: customer4.id,
        contractId: contract1.id,
        rating: 5,
        comment: 'Giao xe đúng hẹn, nhân viên nhiệt tình',
        category: 'DELIVERY',
      },
      {
        customerId: customer3.id,
        rating: 4,
        comment: 'Nhân viên tư vấn nhiệt tình, showroom đẹp',
        category: 'SERVICE',
      },
    ],
  });

  console.log('✅ Created feedbacks\n');

  // ============================================
  // 16. CREATE CUSTOMER DEBTS
  // ============================================
  console.log('💳 Creating customer debts...');

  await prisma.customerDebt.create({
    data: {
      customerId: customer2.id,
      contractId: contract2.id,
      totalDebt: 42000,
      paidAmount: 5700, // 6 tháng đã trả
      dueDate: new Date('2025-04-01'),
      status: 'PARTIAL',
    },
  });

  console.log('✅ Created customer debts\n');

  // ============================================
  // 17. CREATE DEALER ORDERS (Đại lý đặt xe từ hãng)
  // ============================================
  console.log('📦 Creating dealer orders...');

  await prisma.dealerOrder.createMany({
    data: [
      {
        orderNumber: 'DO-2024-001',
        dealerId: dealer1.id,
        staffId: dealerManager1.id,
        vehicleId: vehicle1.id,
        quantity: 10,
        unitPrice: 35000,
        totalAmount: 350000,
        status: 'DELIVERED',
        orderedAt: new Date('2024-08-01'),
        confirmedAt: new Date('2024-08-02'),
        shippedAt: new Date('2024-08-10'),
        deliveredAt: new Date('2024-08-15'),
        notes: 'Đợt nhập đầu tiên Tesla Model 3',
      },
      {
        orderNumber: 'DO-2024-002',
        dealerId: dealer1.id,
        staffId: dealerManager1.id,
        vehicleId: vehicle3.id,
        quantity: 15,
        unitPrice: 30000,
        totalAmount: 450000,
        status: 'DELIVERED',
        orderedAt: new Date('2024-08-05'),
        confirmedAt: new Date('2024-08-06'),
        shippedAt: new Date('2024-08-15'),
        deliveredAt: new Date('2024-08-20'),
        notes: 'VinFast VF8 cho showroom Hà Nội',
      },
      {
        orderNumber: 'DO-2024-003',
        dealerId: dealer2.id,
        staffId: dealerManager2.id,
        vehicleId: vehicle1.id,
        quantity: 12,
        unitPrice: 35000,
        totalAmount: 420000,
        status: 'SHIPPED',
        orderedAt: new Date('2024-09-20'),
        confirmedAt: new Date('2024-09-21'),
        shippedAt: new Date('2024-09-28'),
        notes: 'Đang vận chuyển đến HCM',
      },
      {
        orderNumber: 'DO-2024-004',
        dealerId: dealer2.id,
        staffId: dealerManager2.id,
        vehicleId: vehicle6.id,
        quantity: 8,
        unitPrice: 38000,
        totalAmount: 304000,
        status: 'CONFIRMED',
        orderedAt: new Date('2024-10-01'),
        confirmedAt: new Date('2024-10-02'),
        notes: 'Hyundai IONIQ 5 cho showroom HCM',
      },
      {
        orderNumber: 'DO-2024-005',
        dealerId: dealer3.id,
        staffId: dealerManager1.id, // Tạm dùng manager1
        vehicleId: vehicle5.id,
        quantity: 15,
        unitPrice: 22000,
        totalAmount: 330000,
        status: 'PENDING',
        orderedAt: new Date('2024-10-05'),
        notes: 'Đơn hàng BYD Atto 3 cho Đà Nẵng',
      },
    ],
  });

  console.log('✅ Created dealer orders\n');

  // ============================================
  // 18. CREATE DEALER DISCOUNTS
  // ============================================
  console.log('🎁 Creating dealer discounts...');

  await prisma.dealerDiscount.createMany({
    data: [
      {
        dealerId: dealer1.id,
        name: 'Khuyến mãi tháng 10',
        description: 'Giảm giá đặc biệt cho Tesla Model 3',
        discountType: 'FIXED',
        discountValue: 2000,
        minPurchase: 35000,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-31'),
        isActive: true,
      },
      {
        dealerId: dealer2.id,
        name: 'Black Friday Sale',
        description: 'Giảm 5% cho tất cả các dòng xe',
        discountType: 'PERCENTAGE',
        discountValue: 5,
        minPurchase: 30000,
        startDate: new Date('2024-11-15'),
        endDate: new Date('2024-11-30'),
        isActive: true,
      },
      {
        dealerId: dealer1.id,
        name: 'VinFast VF8 Sale',
        description: 'Ưu đãi đặc biệt cho VF8',
        discountType: 'FIXED',
        discountValue: 1500,
        minPurchase: 30000,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-09-30'),
        isActive: false,
      },
    ],
  });

  console.log('✅ Created dealer discounts\n');

  // ============================================
  // 19. CREATE TARGETS (Chỉ tiêu doanh số)
  // ============================================
  console.log('🎯 Creating sales targets...');

  await prisma.target.createMany({
    data: [
      // Dealer 1 - Q3 2024
      {
        dealerId: dealer1.id,
        year: 2024,
        month: 7,
        targetAmount: 500000,
        achievedAmount: 450000,
      },
      {
        dealerId: dealer1.id,
        year: 2024,
        month: 8,
        targetAmount: 550000,
        achievedAmount: 520000,
      },
      {
        dealerId: dealer1.id,
        year: 2024,
        month: 9,
        targetAmount: 600000,
        achievedAmount: 580000,
      },
      {
        dealerId: dealer1.id,
        year: 2024,
        month: 10,
        targetAmount: 650000,
        achievedAmount: 150000,
      },
      
      // Dealer 2 - Q3 2024
      {
        dealerId: dealer2.id,
        year: 2024,
        month: 7,
        targetAmount: 700000,
        achievedAmount: 680000,
      },
      {
        dealerId: dealer2.id,
        year: 2024,
        month: 8,
        targetAmount: 750000,
        achievedAmount: 720000,
      },
      {
        dealerId: dealer2.id,
        year: 2024,
        month: 9,
        targetAmount: 800000,
        achievedAmount: 790000,
      },
      {
        dealerId: dealer2.id,
        year: 2024,
        month: 10,
        targetAmount: 850000,
        achievedAmount: 200000,
      },
      
      // Dealer 3 - Q3 2024
      {
        dealerId: dealer3.id,
        year: 2024,
        month: 7,
        targetAmount: 300000,
        achievedAmount: 280000,
      },
      {
        dealerId: dealer3.id,
        year: 2024,
        month: 8,
        targetAmount: 350000,
        achievedAmount: 320000,
      },
      {
        dealerId: dealer3.id,
        year: 2024,
        month: 9,
        targetAmount: 400000,
        achievedAmount: 380000,
      },
      {
        dealerId: dealer3.id,
        year: 2024,
        month: 10,
        targetAmount: 450000,
        achievedAmount: 100000,
      },
    ],
  });

  console.log('✅ Created sales targets\n');

  // ============================================
  // 20. CREATE DEALER DEBTS (Công nợ đại lý với hãng)
  // ============================================
  console.log('💸 Creating dealer debts...');

  await prisma.dealerDebt.createMany({
    data: [
      {
        dealerId: dealer1.id,
        totalDebt: 350000,
        paidAmount: 350000,
        dueDate: new Date('2024-09-15'),
        status: 'PAID',
      },
      {
        dealerId: dealer1.id,
        totalDebt: 450000,
        paidAmount: 450000,
        dueDate: new Date('2024-09-20'),
        status: 'PAID',
      },
      {
        dealerId: dealer2.id,
        totalDebt: 420000,
        paidAmount: 210000,
        dueDate: new Date('2024-10-28'),
        status: 'PARTIAL',
      },
      {
        dealerId: dealer2.id,
        totalDebt: 304000,
        paidAmount: 0,
        dueDate: new Date('2024-11-02'),
        status: 'UNPAID',
      },
    ],
  });

  console.log('✅ Created dealer debts\n');

  // ============================================
  // 21. CREATE COMPLAINTS (Khiếu nại)
  // ============================================
  console.log('📢 Creating complaints...');

  await prisma.complaint.createMany({
    data: [
      {
        customerId: customer2.id,
        contractId: contract2.id,
        subject: 'Chậm trễ giao xe',
        description: 'Xe giao chậm hơn so với hợp đồng 3 ngày',
        status: 'RESOLVED',
        resolution: 'Đã bồi thường phí giao xe và tặng voucher bảo dưỡng miễn phí',
        resolvedAt: new Date('2024-10-15'),
        resolvedBy: dealerManager2.id,
      },
      {
        customerId: customer3.id,
        subject: 'Tư vấn viên không nhiệt tình',
        description: 'Nhân viên không chuyên nghiệp trong quá trình tư vấn',
        status: 'IN_PROGRESS',
      },
    ],
  });

  console.log('✅ Created complaints\n');

  // ============================================
  // 22. SUMMARY
  // ============================================
  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 SEEDING SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✓ Regions: 3 (North, Central, South)');
  console.log('✓ Dealers: 3 (Hà Nội, HCM, Đà Nẵng)');
  console.log('✓ Dealer Contracts: 2');
  console.log('✓ Users: 6 (1 Admin, 1 EVM Staff, 2 Managers, 2 Staff)');
  console.log('✓ Manufacturers: 4 (Tesla, VinFast, BYD, Hyundai)');
  console.log('✓ Vehicles: 6 models');
  console.log('✓ Vehicle Images: 7 images');
  console.log('✓ EVM Inventory: 6 records');
  console.log('✓ Dealer Inventory: 10 records');
  console.log('✓ Customers: 5 customers');
  console.log('✓ Customer Lifecycle: 10 records');
  console.log('✓ Test Drives: 3 scheduled');
  console.log('✓ Quotations: 2 sent');
  console.log('✓ Contracts: 2 (1 completed, 1 signed)');
  console.log('✓ Feedbacks: 3 reviews');
  console.log('✓ Customer Debts: 1 partial payment');
  console.log('✓ Dealer Orders: 5 orders');
  console.log('✓ Dealer Discounts: 3 promotions');
  console.log('✓ Sales Targets: 12 monthly targets');
  console.log('✓ Dealer Debts: 4 records');
  console.log('✓ Complaints: 2 cases');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📝 TEST ACCOUNTS:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔐 Admin:');
  console.log('   Email: admin@evdealer.com');
  console.log('   Password: Admin@123456');
  console.log('   Role: ADMIN - Full system access\n');
  
  console.log('🏭 EVM Staff:');
  console.log('   Email: evm@evdealer.com');
  console.log('   Password: Admin@123456');
  console.log('   Role: EVM_STAFF - Manage products, dealers, reports\n');
  
  console.log('👔 Dealer Manager (Hà Nội):');
  console.log('   Email: manager.hn@evdealer.com');
  console.log('   Password: Admin@123456');
  console.log('   Role: DEALER_MANAGER - Manage dealer operations\n');
  
  console.log('👤 Dealer Staff (Hà Nội):');
  console.log('   Email: staff.hn@evdealer.com');
  console.log('   Password: Admin@123456');
  console.log('   Role: DEALER_STAFF - Sales and customer management\n');
  
  console.log('👔 Dealer Manager (HCM):');
  console.log('   Email: manager.hcm@evdealer.com');
  console.log('   Password: Admin@123456');
  console.log('   Role: DEALER_MANAGER - Manage dealer operations\n');
  
  console.log('👤 Dealer Staff (HCM):');
  console.log('   Email: staff.hcm@evdealer.com');
  console.log('   Password: Admin@123456');
  console.log('   Role: DEALER_STAFF - Sales and customer management');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('🚀 You can now start the server with: npm run dev');
  console.log('📚 API Documentation: http://localhost:5000/api/v1');
  console.log('💾 Prisma Studio: npm run prisma:studio\n');
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