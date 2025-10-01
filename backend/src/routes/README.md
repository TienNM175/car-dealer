# API Routes Documentation

## Vehicle API - Truy vấn thông tin xe

### 1. GET /api/vehicles

**Lấy danh sách xe điện với filters**

**Query Parameters:**

- `manufacturerId` (optional): Filter theo hãng xe
- `minPrice` (optional): Giá tối thiểu
- `maxPrice` (optional): Giá tối đa
- `color` (optional): Màu sắc (BLACK, WHITE, RED, etc.)
- `bodyType` (optional): Kiểu dáng (SEDAN, SUV, etc.)
- `year` (optional): Năm sản xuất
- `minRange` (optional): Phạm vi hoạt động tối thiểu (km)
- `search` (optional): Tìm kiếm theo model, variant, description

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "manufacturerId": "clx...",
      "model": "Model 3",
      "variant": "Long Range",
      "year": 2024,
      "batteryCapacity": 75,
      "range": 580,
      "chargingTime": 30,
      "motorPower": 283,
      "topSpeed": 233,
      "acceleration": 4.4,
      "seats": 5,
      "doors": 4,
      "color": "WHITE",
      "bodyType": "SEDAN",
      "wholesalePrice": 40000,
      "retailPrice": 45000,
      "currency": "USD",
      "status": "ACTIVE",
      "description": "Premium electric sedan",
      "manufacturer": {
        "id": "clx...",
        "name": "Tesla",
        "code": "TESLA",
        "country": "USA"
      },
      "images": [...],
      "evmInventories": [
        {
          "quantity": 100,
          "reserved": 20,
          "available": 80
        }
      ]
    }
  ],
  "total": 1
}
```

**Example Request:**

```bash
# Lấy tất cả xe
GET /api/vehicles

# Lấy xe Tesla
GET /api/vehicles?manufacturerId=clx123

# Lấy xe SUV giá dưới $50k
GET /api/vehicles?bodyType=SUV&maxPrice=50000

# Tìm kiếm "Model 3"
GET /api/vehicles?search=Model%203

# Lấy xe range >= 500km
GET /api/vehicles?minRange=500
```

---

### 2. GET /api/vehicles/:id

**Lấy chi tiết xe điện theo ID**

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "model": "Model 3",
    "manufacturer": {...},
    "images": [...],
    "evmInventories": [...],
    "dealerInventories": [
      {
        "id": "clx...",
        "quantity": 5,
        "available": 3,
        "dealer": {
          "name": "AutoMax Dealer",
          "city": "New York",
          "region": {
            "name": "Northeast"
          }
        }
      }
    ]
  }
}
```

**Example Request:**

```bash
GET /api/vehicles/clx123abc456
```

---

### 3. POST /api/vehicles/compare

**So sánh nhiều xe điện**

**Request Body:**

```json
{
  "vehicleIds": ["clx123", "clx456", "clx789"]
}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx123",
      "model": "Model 3",
      "batteryCapacity": 75,
      "range": 580,
      "retailPrice": 45000,
      "costPerKm": 77.59,
      "costPerKwh": 600,
      "totalAvailable": 80,
      "manufacturer": {...}
    },
    {
      "id": "clx456",
      "model": "i4",
      "batteryCapacity": 80,
      "range": 590,
      "retailPrice": 52000,
      "costPerKm": 88.14,
      "costPerKwh": 650,
      "totalAvailable": 50,
      "manufacturer": {...}
    }
  ],
  "count": 2
}
```

**Metrics được tính:**

- `costPerKm`: Giá / phạm vi (USD/km)
- `costPerKwh`: Giá / dung lượng pin (USD/kWh)
- `totalAvailable`: Tổng số xe available trong kho hãng

**Example Request:**

```bash
POST /api/vehicles/compare
Content-Type: application/json

{
  "vehicleIds": ["clx123", "clx456"]
}
```

---

### 4. GET /api/manufacturers

**Lấy danh sách hãng xe**

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Tesla",
      "code": "TESLA",
      "country": "USA",
      "logo": "https://...",
      "isActive": true,
      "_count": {
        "vehicles": 5
      }
    }
  ]
}
```

---

### 5. GET /api/manufacturers/:id/vehicles

**Lấy tất cả xe của 1 hãng**

**Response:**

```json
{
  "success": true,
  "data": [...],
  "total": 5
}
```

**Example Request:**

```bash
GET /api/manufacturers/clx123/vehicles
```

---

### 6. POST /api/vehicles (Protected)

**Tạo xe điện mới**

**Authorization:** EVM_STAFF, ADMIN

**Request Body:**

```json
{
  "manufacturerId": "clx123",
  "model": "Model 3",
  "variant": "Long Range",
  "year": 2024,
  "batteryCapacity": 75,
  "range": 580,
  "chargingTime": 30,
  "motorPower": 283,
  "topSpeed": 233,
  "acceleration": 4.4,
  "seats": 5,
  "doors": 4,
  "color": "WHITE",
  "bodyType": "SEDAN",
  "wholesalePrice": 40000,
  "retailPrice": 45000,
  "currency": "USD",
  "description": "Premium electric sedan"
}
```

**Response:**

```json
{
  "success": true,
  "data": {...},
  "message": "Vehicle created successfully"
}
```

---

### 7. PUT /api/vehicles/:id (Protected)

**Update thông tin xe**

**Authorization:** EVM_STAFF, ADMIN

**Request Body:** (partial update)

```json
{
  "retailPrice": 46000,
  "range": 600,
  "description": "Updated description"
}
```

---

### 8. DELETE /api/vehicles/:id (Protected)

**Xóa xe (soft delete)**

**Authorization:** ADMIN only

**Response:**

```json
{
  "success": true,
  "data": {...},
  "message": "Vehicle deleted successfully"
}
```

---

## Use Cases

### Use Case 1: Customer xem danh mục xe

```bash
# Khách hàng vào website, xem tất cả xe
GET /api/vehicles

# Filter xe SUV
GET /api/vehicles?bodyType=SUV

# Tìm xe Tesla
GET /api/vehicles?search=Tesla
```

### Use Case 2: Customer xem chi tiết xe

```bash
# Khách click vào xe → xem chi tiết đầy đủ
GET /api/vehicles/clx123

# Response bao gồm:
# - Thông số kỹ thuật đầy đủ
# - Hình ảnh
# - Tồn kho tại các đại lý
# - Manufacturer info
```

### Use Case 3: Customer so sánh xe

```bash
# Khách chọn 2-3 xe để so sánh
POST /api/vehicles/compare
{
  "vehicleIds": ["clx123", "clx456", "clx789"]
}

# Response bao gồm tất cả specs để so sánh:
# - Battery capacity
# - Range
# - Price
# - Cost per km
# - Cost per kWh
# - Availability
```

### Use Case 4: EVM Staff thêm xe mới

```bash
# EVM Staff login → tạo xe mới
POST /api/vehicles
Authorization: Bearer <jwt_token>
{
  "manufacturerId": "clx123",
  "model": "VF 8",
  "year": 2024,
  ...
}

# Hệ thống tự động tạo EVMInventory với quantity = 0
```

---

## Error Handling

### 400 Bad Request

```json
{
  "error": "Failed to get vehicles",
  "message": "Validation error details"
}
```

### 401 Unauthorized

```json
{
  "error": "Access token required"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "Vehicle not found",
  "message": "Vehicle with ID clx123 not found"
}
```

---

## Testing Examples

### Using cURL

```bash
# Get all vehicles
curl http://localhost:3001/api/vehicles

# Get vehicle by ID
curl http://localhost:3001/api/vehicles/clx123

# Compare vehicles
curl -X POST http://localhost:3001/api/vehicles/compare \
  -H "Content-Type: application/json" \
  -d '{"vehicleIds": ["clx123", "clx456"]}'

# Create vehicle (with auth)
curl -X POST http://localhost:3001/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "manufacturerId": "clx123",
    "model": "Model 3",
    ...
  }'
```

### Using Postman

1. Import collection
2. Set base URL: `http://localhost:3001`
3. Add auth token in Headers
4. Test endpoints
