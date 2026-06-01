# EVM Dealer System 

An enterprise-grade, full-stack management system designed for Electric Vehicle Manufacturers (EVM) and their authorized dealership networks. This repository features a secure **Express REST API**, a high-performance **Next.js Web Dashboard** for admins and dealers, and a cross-platform **Expo React Native Mobile App** for customers, integrated with a smart **Gemini AI Chatbot Assistant**.

---

## Architectural Overview

The system is structured as a monorepo-style workspace comprising three main components:
1.  **[backend/](https://github.com/TienNM175/car-dealer/tree/dev/backend)**: RESTful API built on **Node.js (Express)**, **TypeScript**, and **Prisma ORM** with **PostgreSQL**. Features Role-Based Access Control (RBAC), Swagger API documentation, automatic PDF generation, and Google Gemini AI orchestration.
2.  **[frontend/](https://github.com/TienNM175/car-dealer/tree/dev/frontend)**: Enterprise Portal for manufacturers and dealers powered by **Next.js 15 (App Router)**, **React 19**, and **Tailwind CSS**.
3.  **[mobile/](https://github.com/TienNM175/car-dealer/tree/dev/mobile)**: Customer-facing app built with **Expo** and **React Native**, enabling vehicle exploration, comparison, test-drive booking, and an interactive Chatbot Assistant.

---

## Technology Stack

### Backend Services
*   **Core**: Node.js, Express, TypeScript, Nodemon
*   **Database & ORM**: PostgreSQL, Prisma Client
*   **AI Integration**: Google Gemini API (`@google/generative-ai`)
*   **Security & Optimization**: Helmet, CORS, Express Rate Limit, Bcryptjs, JSON Web Tokens (JWT)
*   **API Docs**: Swagger (`swagger-ui-express`, `swagger-jsdoc`)
*   **Utilities**: PDFKit (invoice & contract generation), SheetJS (`xlsx`) (Excel reporting), Cloudinary SDK (image hosting), Node-cron (background jobs)

### Web Frontend (Admin/Dealer Portal)
*   **Core**: Next.js 15.5.9, React 19, TypeScript
*   **State Management**: React Context API
*   **Form Validation**: React Hook Form, Zod (schema-based validation)
*   **Charts & Visualization**: Recharts (sales targets, revenue performance)
*   **HTTP Client**: Axios
*   **Styling**: Tailwind CSS, PostCSS

### Mobile Client App
*   **Core**: Expo ~51.0.0, React Native 0.74.5, TypeScript
*   **Navigation**: React Navigation (Bottom Tabs & Stack Navigators)
*   **UI Components**: React Native Paper, Expo Linear Gradient
*   **Polyfills**: React Native URL Polyfill (enables Gemini SDK compatibility)
*   **Persistence**: React Native Async Storage (session caching)

---

## Key Features & Business Workflows

### 1. Role-Based Access Control (RBAC)
*   **ADMIN**: Global system management, dealer onboarding, region configuration, and AI model parameters.
*   **EVM_STAFF**: Manufacturer operations, central inventory management, wholesale price setting, and approval of vehicle export documentation.
*   **DEALER_MANAGER**: Dealer branch administration, sales target setting, dealer inventory control, and contract approvals.
*   **DEALER_STAFF**: Sales representative workflows, customer relationship management, lead generation, quotations, and test-drive bookings.

### 2. CRM & Customer Lifecycle Management
Tracks the sales pipeline from initial contact to vehicle delivery.
```mermaid
graph TD
    A["INTERESTED"] --> B["CONTACTED"]
    B --> C["TEST_DRIVE"]
    C --> D["QUOTED"]
    D --> E["PURCHASED"]
    B --> F["COLD"]
    D --> F
```

### 3. Sales Contract & Delivery Workflow
Ensures tight integration between sales, finance, and logistics.
```mermaid
sequenceDiagram
    participant Staff as Dealer Sales Staff
    participant Manager as Dealer Manager
    participant EVM as EVM Central Staff
    
    Staff->>Staff: Generate Quotation & Draft Contract (Sales / Deposit)
    Staff->>Manager: Submit Contract for Approval
    Manager->>Staff: Approve and Sign Contract
    Staff->>EVM: Request Vehicle Release (VehicleExportDocument with specific VIN)
    EVM->>EVM: Verify Inventory & Approve Export Document
    EVM->>Staff: Deliver Vehicle to Dealer Storage / Customer Address
    Staff->>Staff: Complete Contract & Generate Signed PDF Invoice
```

### 4. Smart Gemini AI Chatbot
Integrates Google's **Gemini Pro** using a custom semantic routing system:
*   **Intent Detection**: Semantically categorizes messages into `vehicle_recommendation`, `vehicle_comparison`, `price_inquiry`, or `general_query` using JSON schemas.
*   **Dynamic Recommendations**: Evaluates user budget, seating capacity, and body type preference against live database records to recommend vehicles with scoring.
*   **Side-by-Side Comparisons**: Extracts specifications of multiple models and outputs structured pros/cons analysis.

---

## Project Directory Structure

```text
evm-dealer-system/
├── backend/
│   ├── prisma/             # Schema definitions, migrations, and seed scripts
│   └── src/
│       ├── config/         # Environment variables, database, and Swagger configs
│       ├── middlewares/    # Authentication, RBAC, error handling, rate limiting
│       ├── modules/        # Domain-driven modules (auth, vehicles, contracts, chatbot, etc.)
│       ├── utils/          # Gemini client, Cloudinary helper, PDF & Report generators
│       ├── app.ts          # Express application initialization
│       └── server.ts       # Server entrypoint
├── frontend/
│   ├── public/             # Static assets (logos, default illustrations)
│   └── src/
│       ├── app/            # Next.js App Router (pages and layouts)
│       ├── components/     # Reusable UI components (Tables, Charts, Forms)
│       ├── contexts/       # React Contexts (e.g., AuthContext for authentication)
│       └── utils/          # Axios HTTP clients and helpers
└── mobile/
    ├── assets/             # Images, icons, and custom fonts
    └── src/
        ├── api/            # API clients connecting to Backend endpoints
        ├── components/     # Mobile UI widgets (Chatbot interface, vehicle cards)
        ├── constants/      # App configurations, themes, and endpoint constants
        ├── navigation/     # React Navigation configuration (Tabs & Stacks)
        └── screens/        # Main screen controllers (Home, Catalog, Booking, Details)
```

---

## Environment Variables Config

### 1. Backend (`backend/.env`)
| Key | Purpose | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pwd@localhost:5432/evm` |
| `PORT` | Local port for Backend API server | `5000` |
| `NODE_ENV` | Running environment | `development` |
| `GEMINI_API_KEY_PRIMARY` | Google Gemini API Key | `AIzaSy...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary storage bucket name | `do5rj4...` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `796399...` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `nEEobf...` |
| `JWT_SECRET` | Encryption key for Access Tokens | `your_jwt_secret_key` |
| `JWT_REFRESH_SECRET` | Encryption key for Refresh Tokens | `your_refresh_secret` |
| `SMTP_USER` | Gmail address for system notifications | `your_email@gmail.com` |
| `SMTP_PASSWORD` | App-specific password for Gmail SMTP | `abcd efgh ijkl mnop` |

### 2. Frontend (`frontend/.env`)
| Key | Purpose | Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base endpoint of the Backend API | `http://localhost:5000/api/v1` |

### 3. Mobile (`mobile/src/constants/config.ts`)
Set the API address dynamically in the configuration script:
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://<YOUR_LOCAL_IP>:5000/api/v1', // Replace with machine local IP for LAN development
  TIMEOUT: 15000,
};
```

---

## Getting Started

### Prerequisites
*   **Node.js**: v18.x or higher
*   **PostgreSQL**: v14.x or higher
*   **Expo Go**: Installed on iOS/Android device for testing

---

### Step 1: Start Backend API Server
1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables in `backend/.env` copying from `.env.example`.
4.  Generate Prisma Client and push schemas to PostgreSQL:
    ```bash
    npm run prisma:generate
    npm run prisma:push
    ```
5.  Seed the database with default configurations, vehicle specs, and demo roles:
    ```bash
    npx prisma db seed
    ```
6.  Start development server:
    ```bash
    npm run dev
    ```
    *   **API Endpoint**: `http://localhost:5000`
    *   **Swagger Docs**: `http://localhost:5000/api-docs`
    *   **Health Check**: `http://localhost:5000/health`

---

### Step 2: Start Web Frontend Dashboard
1.  Open a new terminal and navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create `frontend/.env` based on `.env.example`.
4.  Run Next.js in development mode:
    ```bash
    npm run dev
    ```
    *   **Web Portal**: `http://localhost:3000`

---

### Step 3: Launch Mobile Client App
1.  Open a new terminal and navigate to the `mobile` folder:
    ```bash
    cd mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Modify `BASE_URL` in `src/constants/config.ts` to your machine's LAN IP address.
4.  Run the Expo development bundler:
    ```bash
    npm run start
    ```
5.  Scan the terminal's QR code using the **Expo Go** app on your physical device, or press `a` (Android Emulator) / `i` (iOS Simulator).

---

## Demo Credentials

To test the system across different authorization levels, log in with the seeded accounts below:

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@evdealer.com` | `Admin@123456` |
| **EVM Staff** | `evm@evdealer.com` | `Admin@123456` |
| **Dealer Manager (HN)** | `manager.hn@evdealer.com` | `Admin@123456` |
| **Dealer Staff (HN)** | `staff.hn@evdealer.com` | `Admin@123456` |
| **Dealer Manager (HCM)** | `manager.hcm@evdealer.com` | `Admin@123456` |
| **Dealer Staff (HCM)** | `staff.hcm@evdealer.com` | `Admin@123456` |

---

## License
This project is licensed under the **ISC License**.

