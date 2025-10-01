# Database Schema Documentation

## 📋 Tổng quan

Database schema cho **Electric Vehicle Dealer Management System** - Hệ thống quản lý bán xe điện qua kênh đại lý.

## 🏗️ Cấu trúc Database

### 1. USER & AUTHENTICATION (2 models)

#### User

Quản lý tài khoản người dùng trong hệ thống.

**Fields chính:**

- `email` - Email đăng nhập (unique)
- `role` - Vai trò: ADMIN, EVM_STAFF, DEALER_MANAGER, DEALER_STAFF
- `dealerId` - ID đại lý (nullable, chỉ có khi role là DEALER\_\*)

**Relationships:**

- Thuộc về 1 Dealer (nếu là nhân viên đại lý)
- Có nhiều Sessions
- Tạo được nhiều Contracts, Quotations, DealerOrders

#### Session

Quản lý phiên đăng nhập.

---

### 2. DEALER MANAGEMENT (5 models)

#### Region

Khu vực địa lý (miền Bắc, miền Nam, etc.)

#### Dealer

Đại lý bán xe.

**Fields chính:**

- `code` - Mã đại lý (unique)
- `regionId` - Thuộc khu vực nào
- `isActive` - Còn hoạt động không

**Relationships:**

- Thuộc 1 Region
- Có nhiều Users (nhân viên)
- Có nhiều Inventories (tồn kho)
- Có nhiều DealerOrders (đơn đặt hàng)
- Có nhiều Targets (chỉ tiêu)

#### DealerContract

Hợp đồng giữa Hãng xe và Đại lý.

**Fields chính:**

- `contractCode` - Mã hợp đồng
- `commissionRate` - % hoa hồng
- `status` - DRAFT, ACTIVE, EXPIRED, TERMINATED

#### Target

Chỉ tiêu doanh số hàng tháng của đại lý.

**Fields chính:**

- `year`, `month` - Tháng/năm
- `targetAmount` - Chỉ tiêu (VND/USD)
- `achievedAmount` - Đã đạt được

#### DealerDebt

Công nợ của đại lý với hãng xe.

**Fields chính:**

- `totalDebt` - Tổng nợ
- `paidAmount` - Đã trả
- `status` - UNPAID, PARTIAL, PAID, OVERDUE

---

### 3. VEHICLE MANAGEMENT (3 models)

#### Manufacturer

Hãng sản xuất xe điện (Tesla, BYD, VinFast, etc.)

**Fields chính:**

- `name` - Tên hãng
- `code` - Mã hãng (unique)
- `country` - Quốc gia

#### Vehicle

Xe điện mới.

**Fields chính - Thông số kỹ thuật:**

- `model` - Tên model (Model 3, i4, VF e34, etc.)
- `variant` - Phiên bản
- `batteryCapacity` - Dung lượng pin (kWh)
- `range` - Phạm vi hoạt động (km)
- `chargingTime` - Thời gian sạc (phút)
- `motorPower` - Công suất động cơ (kW)
- `acceleration` - Tăng tốc 0-100 km/h (giây)

**Fields chính - Giá:**

- `wholesalePrice` - Giá sỉ (EVM → Dealer)
- `retailPrice` - Giá lẻ (Dealer → Customer)
- `currency` - USD, VND, EUR, GBP

**Relationships:**

- Thuộc 1 Manufacturer
- Có nhiều Images
- Có trong EVMInventory (tồn kho hãng)
- Có trong Inventories (tồn kho các đại lý)

#### VehicleImage

Hình ảnh xe.

---

### 4. CUSTOMER MANAGEMENT (6 models)

#### Customer

Khách hàng mua xe.

**Fields chính:**

- `email`, `phone` - Liên hệ
- `identityCard` - CMND/CCCD
- `status` - INTERESTED, CONTACTED, TEST_DRIVE, QUOTED, PURCHASED, COLD

**Relationships:**

- Có nhiều Contracts (hợp đồng mua)
- Có nhiều Quotations (báo giá)
- Có nhiều TestDrives (lịch lái thử)
- Có nhiều Feedbacks, Complaints

#### CustomerLifecycle

Lịch sử thay đổi trạng thái khách hàng (tracking journey).

#### TestDrive

Lịch hẹn lái thử xe.

**Fields chính:**

- `scheduledDate` - Ngày giờ hẹn
- `status` - SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
- `feedback` - Phản hồi sau khi lái thử

**Use case:** Dealer Staff đặt lịch cho Customer lái thử Vehicle

#### Feedback

Phản hồi của khách hàng về dịch vụ, sản phẩm.

**Fields chính:**

- `rating` - 1-5 sao
- `category` - SERVICE, PRODUCT, DELIVERY, OTHER

#### Complaint

Khiếu nại của khách hàng.

**Fields chính:**

- `subject` - Tiêu đề
- `description` - Mô tả chi tiết
- `status` - OPEN, IN_PROGRESS, RESOLVED, CLOSED
- `resolution` - Cách giải quyết
- `resolvedBy` - User ID người giải quyết

#### CustomerDebt

Công nợ khách hàng (khi mua trả góp).

**Fields chính:**

- `totalDebt` - Tổng nợ
- `paidAmount` - Đã trả
- `status` - UNPAID, PARTIAL, PAID, OVERDUE

---

### 5. SALES & ORDERS (3 models)

#### Quotation

Báo giá cho khách hàng.

**Fields chính:**

- `quoteNumber` - Mã báo giá (unique)
- `basePrice` - Giá gốc
- `discount` - Chiết khấu
- `finalPrice` - Giá cuối
- `paymentType` - FULL (trả thẳng) hoặc INSTALLMENT (trả góp)
- `installmentMonths` - Số tháng trả góp
- `validUntil` - Có hiệu lực đến

**Flow:** Staff tạo Quotation → Gửi cho Customer → Customer accept/reject

#### Contract

Hợp đồng bán hàng (Dealer → Customer).

**Fields chính:**

- `contractCode` - Mã hợp đồng (unique)
- `paymentType` - FULL hoặc INSTALLMENT
- `installmentMonths` - Số tháng trả góp (12, 24, 36, 60, etc.)
- `monthlyPayment` - Số tiền trả hàng tháng
- `interestRate` - Lãi suất
- `deliveryDate` - Ngày hẹn giao xe
- `deliveredAt` - Ngày giao xe thực tế

**Flow:**

1. Quotation được accept → Tạo Contract
2. Contract SIGNED → Chuẩn bị giao xe (DELIVERING)
3. Giao xe xong → COMPLETED

#### DealerOrder

Đơn hàng đại lý đặt xe từ hãng.

**Fields chính:**

- `orderNumber` - Mã đơn hàng (unique)
- `quantity` - Số lượng đặt
- `unitPrice` - Giá sỉ/chiếc
- `totalAmount` - Tổng tiền
- `status` - PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED

**Flow:** Dealer Staff tạo order → EVM Staff confirm → Ship → Deliver

---

### 6. INVENTORY MANAGEMENT (2 models)

#### EVMInventory

Tồn kho tổng của hãng xe.

**Fields chính:**

- `quantity` - Tổng số lượng
- `reserved` - Đã đặt bởi dealers
- `available` - Còn lại = quantity - reserved

**Use case:**

- EVM Staff quản lý tồn kho tổng
- Khi Dealer đặt hàng → reserved tăng
- Khi giao hàng cho Dealer → quantity giảm, reserved giảm

#### Inventory

Tồn kho tại từng đại lý.

**Fields chính:**

- `quantity` - Tổng số xe tại đại lý
- `reserved` - Đã có khách đặt
- `sold` - Đã bán
- `available` - Còn lại = quantity - reserved - sold

**Use case:**

- Dealer nhận xe từ EVM → quantity tăng
- Customer đặt cọc → reserved tăng
- Giao xe cho customer → sold tăng, reserved giảm

---

### 7. PROMOTION (1 model)

#### DealerDiscount

Chính sách khuyến mãi/chiết khấu cho từng đại lý.

**Fields chính:**

- `discountType` - PERCENTAGE (%) hoặc FIXED (VND)
- `discountValue` - Giá trị chiết khấu
- `minPurchase` - Giá trị đơn hàng tối thiểu
- `startDate`, `endDate` - Thời gian áp dụng

---

## 🔐 PHÂN QUYỀN (Role-based Access)

### ADMIN

- Toàn quyền trên hệ thống
- Quản lý Users, Dealers, Manufacturers

### EVM_STAFF (Nhân viên hãng xe)

- ✅ Quản lý Vehicles (danh mục xe)
- ✅ Quản lý EVMInventory (tồn kho tổng)
- ✅ Xử lý DealerOrders (đơn hàng từ đại lý)
- ✅ Quản lý DealerContracts (hợp đồng với đại lý)
- ✅ Xem báo cáo tổng hợp
- ❌ KHÔNG thể tạo Contract (hợp đồng với customer)

### DEALER_MANAGER (Quản lý đại lý)

- ✅ Xem danh mục Vehicles
- ✅ Tạo DealerOrders (đặt xe từ hãng)
- ✅ Xem/Quản lý Inventory của đại lý mình
- ✅ Xem tất cả Contracts, Quotations của đại lý
- ✅ Xem báo cáo doanh số
- ✅ Quản lý Targets
- ❌ KHÔNG thể quản lý Dealers khác

### DEALER_STAFF (Nhân viên đại lý)

- ✅ Xem danh mục Vehicles
- ✅ Tạo Quotations (báo giá)
- ✅ Tạo Contracts (hợp đồng bán)
- ✅ Quản lý Customers
- ✅ Tạo TestDrives (lịch lái thử)
- ✅ Xử lý Feedbacks, Complaints
- ❌ KHÔNG thể tạo DealerOrders (chỉ Manager mới được)
- ❌ KHÔNG thể xem báo cáo tài chính

---

## 📊 BUSINESS FLOWS

### Flow 1: Khách hàng mua xe

```
1. Customer liên hệ → Tạo Customer record (status: INTERESTED)
2. Staff tư vấn → Update status: CONTACTED
3. Đặt lịch lái thử → Tạo TestDrive
4. Lái thử xong → Update TestDrive status: COMPLETED
5. Khách đồng ý → Staff tạo Quotation
6. Khách chấp nhận → Quotation status: ACCEPTED
7. Tạo Contract → Contract status: SIGNED
8. Giao xe → Contract status: DELIVERING → COMPLETED
9. Customer status: PURCHASED
```

### Flow 2: Đại lý đặt xe từ hãng

```
1. Dealer Manager/Staff tạo DealerOrder
2. DealerOrder status: PENDING
3. EVM Staff xác nhận → status: CONFIRMED
4. Chuẩn bị xe → status: PROCESSING
5. Giao hàng → status: SHIPPED
6. Nhận hàng → status: DELIVERED
7. Update Inventory tại Dealer (+quantity)
8. Update EVMInventory (-quantity, -reserved)
```

### Flow 3: Quản lý tồn kho

```
EVM Level:
- EVMInventory.quantity = Tổng xe trong kho hãng
- DealerOrder được tạo → EVMInventory.reserved tăng
- Giao xe cho Dealer → EVMInventory.quantity giảm

Dealer Level:
- Nhận xe từ EVM → Inventory.quantity tăng
- Customer đặt cọc → Inventory.reserved tăng
- Giao xe cho Customer → Inventory.sold tăng, reserved giảm
```

---

## 🔢 ENUMS

### UserRole

- `ADMIN` - Quản trị hệ thống
- `EVM_STAFF` - Nhân viên hãng xe
- `DEALER_MANAGER` - Quản lý đại lý
- `DEALER_STAFF` - Nhân viên đại lý

### CustomerStatus

- `INTERESTED` - Quan tâm
- `CONTACTED` - Đã liên hệ
- `TEST_DRIVE` - Đã lái thử
- `QUOTED` - Đã báo giá
- `PURCHASED` - Đã mua
- `COLD` - Không quan tâm

### ContractStatus

- `DRAFT` - Nháp
- `PENDING` - Chờ ký
- `SIGNED` - Đã ký
- `DELIVERING` - Đang giao xe
- `COMPLETED` - Hoàn thành
- `CANCELLED` - Hủy

### DealerOrderStatus

- `PENDING` - Chờ xác nhận từ EVM
- `CONFIRMED` - Đã xác nhận
- `PROCESSING` - Đang chuẩn bị
- `SHIPPED` - Đang giao
- `DELIVERED` - Đã giao
- `CANCELLED` - Hủy

### PaymentType

- `FULL` - Trả thẳng
- `INSTALLMENT` - Trả góp

---

## 📝 SƠ ĐỒ QUAN HỆ

```
Manufacturer (1) ←→ (n) Vehicle
Vehicle (1) ←→ (1) EVMInventory
Vehicle (1) ←→ (n) Inventory ←→ (1) Dealer
Dealer (1) ←→ (n) User
Dealer (1) ←→ (1) Region
Dealer (1) ←→ (n) DealerOrder → (1) Vehicle
User (1) ←→ (n) Contract → (1) Customer, (1) Vehicle
User (1) ←→ (n) Quotation → (1) Customer, (1) Vehicle
Customer (1) ←→ (n) TestDrive → (1) Vehicle, (1) User
Customer (1) ←→ (n) Feedback → (0..1) Contract
Customer (1) ←→ (n) Complaint → (0..1) Contract
```

---

## 🚀 Commands

### Generate Prisma Client

```bash
npx prisma generate
```

### Create Migration

```bash
npx prisma migrate dev --name init
```

### Push Schema (without migration)

```bash
npx prisma db push
```

### Seed Database

```bash
npm run db:seed
```

---

## 💡 Notes quan trọng

### 1. Pricing Strategy

- **wholesalePrice**: Giá sỉ (EVM bán cho Dealer)
- **retailPrice**: Giá lẻ (Dealer bán cho Customer)
- **Margin**: retailPrice - wholesalePrice = Lợi nhuận của Dealer
- **Discount**: Có thể giảm từ retailPrice, nhưng không thấp hơn wholesalePrice

### 2. Inventory Management

- **2-tier inventory**: EVMInventory (hãng) và Inventory (đại lý)
- **Reserved logic**:
  - EVM: reserved = tổng xe dealers đã đặt
  - Dealer: reserved = tổng xe customers đã đặt cọc
- **Available**: Tự động tính = quantity - reserved (- sold với Dealer)

### 3. Customer Lifecycle

- Mọi thay đổi status của Customer đều được log vào CustomerLifecycle
- Giúp tracking: Khách từ đâu → lái thử → mua → feedback

### 4. Payment & Debt

- **Trả thẳng (FULL)**: Customer trả hết ngay → CustomerDebt = 0
- **Trả góp (INSTALLMENT)**:
  - Contract có installmentMonths, monthlyPayment, interestRate
  - Tạo CustomerDebt với totalDebt = finalPrice - số tiền đã trả
  - Mỗi tháng trả → update paidAmount

### 5. Test Drive

- Chỉ Dealer Staff mới có thể tạo TestDrive
- Cần gắn với Vehicle cụ thể
- Sau lái thử, Staff có thể tạo Quotation ngay

---

## ⚠️ Lưu ý cho Developers

1. **Không sửa trực tiếp file `schema.prisma`** - Đây là file tổng hợp
2. **Sửa trong folder `schema/`** nếu cần (hiện tại đã merge hết vào 1 file)
3. **Luôn chạy `prisma generate`** sau khi sửa schema
4. **Test relationships** trước khi deploy
5. **Backup database** trước khi migrate

---

## 📞 Support

Nếu có thắc mắc về schema, liên hệ:

- Backend Lead
- Database Admin
