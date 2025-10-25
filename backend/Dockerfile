# Sử dụng image Node.js chính thức
FROM node:18

# Đặt thư mục làm việc trong container
WORKDIR /usr/src/app

# Copy file package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install --production

# Copy toàn bộ mã nguồn vào container
COPY . .

# Expose port mà app sử dụng (ví dụ 8080)
EXPOSE 8080

# Lệnh chạy ứng dụng
CMD ["npm", "start"]
