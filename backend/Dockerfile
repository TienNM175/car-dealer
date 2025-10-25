# Sử dụng Node.js 18
FROM node:18

# Đặt thư mục làm việc bên trong container
WORKDIR /usr/src/app

# Sao chép file cấu hình và cài đặt dependencies
COPY package*.json ./

RUN npm install

# Sao chép toàn bộ code vào container
COPY . .

# Build TypeScript
RUN npm run build

# Expose cổng (phải trùng với PORT bạn dùng trong code, ví dụ 3000)
EXPOSE 3000

# Chạy file build (đường dẫn dist/src)
CMD ["node", "dist/src/index.js"]
