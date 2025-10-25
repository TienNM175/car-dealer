# 1️⃣ Sử dụng Node.js 18 làm base image
FROM node:18

# 2️⃣ Đặt thư mục làm việc trong container
WORKDIR /usr/src/app

# 3️⃣ Copy file cấu hình package
COPY package*.json ./

# 4️⃣ Cài đặt dependencies
RUN npm install

# 5️⃣ Copy toàn bộ mã nguồn
COPY . .

# 6️⃣ Build TypeScript sang JavaScript
RUN npm run build

# 7️⃣ Mở cổng 500 (phải trùng với cổng server của bạn)
EXPOSE 5000

# 8️⃣ Chạy server sau khi build
CMD ["node", "dist/src/server.js"]
