# ==============================
# Stage 1: Build TypeScript
# ==============================
FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Cài đặt dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript -> JavaScript
RUN npm run build

# ==============================
# Stage 2: Run production
# ==============================
FROM node:18-slim

WORKDIR /app

# Copy package files để cài prod deps
COPY package*.json ./

RUN npm install --production

# Copy file build từ stage builder
COPY --from=builder /app/dist ./dist

# Expose port (Back4App sẽ set PORT env)
EXPOSE 3000

# Lệnh khởi chạy server
CMD ["node", "dist/index.js"]
