# 1️⃣ Base image
FROM node:18

# 2️⃣ Set working directory
WORKDIR /usr/src/app

# 3️⃣ Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# 4️⃣ Install dependencies
RUN npm install

# 5️⃣ Generate Prisma Client
RUN npx prisma generate

# 6️⃣ Copy source code
COPY . .

# 7️⃣ Build TypeScript
RUN npm run build

# 8️⃣ Expose port
EXPOSE 5000

# 9️⃣ Start server
CMD ["node", "dist/src/server.js"]