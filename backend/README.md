# Backend API - EV Dealer Management System

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL
- npm hoặc yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp env.example .env
# Edit .env và update DATABASE_URL

# 3. Generate Prisma Client
npx prisma generate

# 4. Push database schema
npx prisma db push

# 5. (Optional) Seed database
npm run db:seed

# 6. Start development server
npm run dev
```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema chính
│   ├── README.md          # Database documentation
│   └── seed/              # Seed data
├── src/
│   ├── controllers/       # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, validation, etc.
│   ├── services/          # Service layer
│   ├── lib/               # Utilities (prisma, redis, s3, etc.)
│   ├── types/             # TypeScript types
│   └── index.ts           # Entry point
├── config.env             # Environment variables (KHÔNG commit)
├── env.example            # Environment template
└── package.json
```

## 🔑 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ev_dealer_db"

# JWT
JWT_SECRET="your-secret-key"

# Redis (optional for dev)
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# AWS S3 (for images)
S3_BUCKET_ACCESS_KEY="your-access-key"
S3_BUCKET_SECRET_KEY="your-secret-key"
S3_BUCKET_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket-name"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

## 📡 API Endpoints

### Health Check

```
GET /health
```

### Authentication

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Users

```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### Dealers

```
GET    /api/dealers
GET    /api/dealers/:id
POST   /api/dealers
PUT    /api/dealers/:id
DELETE /api/dealers/:id
```

### Vehicles

```
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles       [EVM_STAFF, ADMIN]
PUT    /api/vehicles/:id   [EVM_STAFF, ADMIN]
DELETE /api/vehicles/:id   [ADMIN]
```

### Customers

```
GET    /api/customers      [DEALER_STAFF+]
POST   /api/customers      [DEALER_STAFF+]
PUT    /api/customers/:id  [DEALER_STAFF+]
```

### Orders

```
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id
```

### Inventory

```
GET /api/inventory
GET /api/inventory/evm     [EVM_STAFF, ADMIN]
GET /api/inventory/dealer  [DEALER_STAFF+]
```

### Reports

```
GET /api/reports/sales
GET /api/reports/inventory
GET /api/reports/dealers
```

## 🔒 Authentication & Authorization

### JWT Token

```json
{
  "userId": "cuid",
  "email": "user@example.com",
  "role": "DEALER_STAFF",
  "dealerId": "dealer-cuid"
}
```

### Middleware Usage

```typescript
// Require authentication
router.get("/protected", authenticateToken, handler);

// Require specific roles
router.post("/admin", requireRole(["ADMIN"]), handler);

// Require dealer access (DEALER_* roles can only access their dealer)
router.get("/dealer-data", requireDealerAccess, handler);
```

## 📊 Database Models

Xem chi tiết tại: [prisma/README.md](prisma/README.md)

**Models chính:**

- User, Session (Auth)
- Dealer, Region, Target, DealerDebt (Dealer Management)
- Manufacturer, Vehicle, VehicleImage (Vehicle Management)
- Customer, TestDrive, Feedback, Complaint (Customer Management)
- Quotation, Contract, DealerOrder (Sales & Orders)
- EVMInventory, Inventory (Inventory Management)
- DealerDiscount (Promotions)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

## 📝 Development Guidelines

### Code Style

- TypeScript strict mode
- ESLint configuration
- Prettier formatting

### Naming Conventions

- Files: kebab-case (user-controller.ts)
- Classes: PascalCase (UserController)
- Functions: camelCase (getUserById)
- Constants: UPPER_SNAKE_CASE (JWT_SECRET)

### Error Handling

```typescript
try {
  // Business logic
} catch (error) {
  console.error(error);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}
```

### Response Format

```typescript
// Success
{
  success: true,
  data: {...}
}

// Error
{
  error: "Error message",
  details: {...}
}
```

## 🔧 Scripts

```bash
npm run dev          # Start development server với hot reload
npm run build        # Build TypeScript → JavaScript
npm start            # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:seed      # Seed database
npm test             # Run tests
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
```

## 📞 Support

Nếu có vấn đề, liên hệ:

- Backend Team Lead
- Database Administrator
