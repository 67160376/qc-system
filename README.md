# 🏭 QC Manufacturing System

A Full-Stack Quality Control Management System for manufacturing operations.

ระบบนี้ถูกพัฒนาขึ้นเพื่อช่วยจัดการกระบวนการควบคุมคุณภาพสินค้าในโรงงาน ตั้งแต่การจัดการสินค้า การตรวจสอบคุณภาพในแต่ละขั้นตอน การติดตามประวัติการตรวจสอบ การจัดการ NCR การแจ้งเตือน และการดูข้อมูลสรุปผ่าน Dashboard

ระบบพัฒนาในรูปแบบ Full Stack โดยเชื่อมต่อ Frontend, Backend และ PostgreSQL Database ผ่าน REST API และสามารถรันทั้งระบบด้วย Docker Compose

---

# 📌 Project Overview

QC Manufacturing System เป็น Web Application สำหรับช่วยจัดการกระบวนการ Quality Control ภายในโรงงาน

ระบบรองรับกระบวนการตรวจสอบคุณภาพสินค้า 3 ขั้นตอน ได้แก่

- Incoming Quality Control
- In-process Quality Control
- Final Quality Control

ผู้ใช้งานสามารถเพิ่มสินค้า บันทึกผลการตรวจสอบ ตรวจสอบประวัติย้อนหลัง สร้าง NCR สำหรับสินค้าที่ไม่ผ่านการตรวจสอบ จัดการ Alerts และดูข้อมูลสรุปคุณภาพผ่าน Dashboard

---

# ✨ Features

## 📊 Dashboard

Dashboard แสดงข้อมูลสรุปคุณภาพจากข้อมูลจริงใน PostgreSQL Database

ข้อมูลที่แสดง เช่น

- Total Products
- Total Inspections
- Total Quantity Checked
- Total Passed Quantity
- Total Failed Quantity
- Pass Rate
- Open NCR
- Unacknowledged Alerts
- Recent Inspections
- Recent Alerts
- Quality Performance
- Inspection Summary by QC Type
- NCR Status Summary

ข้อมูลทั้งหมดดึงจาก API จริง ไม่มีการใช้ Mock Data

---

## 📦 Product Management

ระบบสามารถจัดการข้อมูลสินค้าได้

ฟังก์ชันหลัก

- Add Product
- View Product
- Edit Product
- Delete Product

ข้อมูลสินค้าประกอบด้วย

- Product Code
- Product Name
- Description
- Created Date

ตัวอย่างสินค้า

| Product Code | Product Name | Description |
|---|---|---|
| PRD-002 | Hydraulic Oil | Hydraulic system oil |
| PRD-003 | Industrial Lubricant | General-purpose industrial lubricant |
| PRD-004 | Steel Bolt | High-strength steel bolt |
| PRD-005 | Plastic Bottle | 500ml plastic bottle |

---

# 🔍 Quality Inspection

ระบบรองรับการตรวจสอบคุณภาพสินค้า 3 ประเภท

## 1. Incoming Quality Control

ใช้สำหรับตรวจสอบวัตถุดิบหรือสินค้าก่อนเข้าสู่กระบวนการผลิต

ข้อมูลที่บันทึก

- Product
- Lot Number
- Quantity
- Passed Quantity
- Failed Quantity

ตัวอย่าง

```text
Product: Plastic Bottle
Lot Number: LOT-001
Quantity: 100
Passed Quantity: 95
Failed Quantity: 5
Status: FAILED
```

---

## 2. In-process Quality Control

ใช้สำหรับตรวจสอบคุณภาพสินค้าในระหว่างกระบวนการผลิต

สามารถบันทึกข้อมูล เช่น

- Product
- Lot Number
- Quantity
- Passed Quantity
- Failed Quantity
- Inspection Result

---

## 3. Final Quality Control

ใช้สำหรับตรวจสอบคุณภาพสินค้าก่อนส่งออกหรือส่งให้ลูกค้า

ระบบสามารถบันทึกผลการตรวจสอบและระบุสถานะ

- PASSED
- FAILED

---

# 📜 Inspection History

หน้าประวัติการตรวจสอบใช้สำหรับดูข้อมูลการตรวจสอบทั้งหมด

รองรับ

- Search by Lot Number
- Search by Product
- Search by Inspector
- Filter by QC Type
- Filter by Status

ข้อมูลที่แสดง

- Inspection ID
- Lot Number
- Product
- QC Type
- Inspector
- Quantity
- Passed Quantity
- Failed Quantity
- Status
- Created Date

ตัวอย่าง

| ID | Lot | Product | Type | Qty | Passed | Failed | Status |
|---|---|---|---|---:|---:|---:|---|
| 6 | LOT-001 | Plastic Bottle | Incoming | 100 | 95 | 5 | FAILED |
| 5 | LOT-001 | Plastic Bottle | Incoming | 100 | 95 | 5 | FAILED |

---

# 📄 NCR Tracking

NCR ย่อมาจาก

**Non-Conformance Report**

ระบบสามารถสร้าง NCR จาก Inspection ที่มีจำนวนสินค้าที่ไม่ผ่านการตรวจสอบ

เงื่อนไขสำคัญ

```text
failed_quantity > 0
```

หากสินค้าผ่านทั้งหมด ระบบจะไม่อนุญาตให้สร้าง NCR

ระบบยังป้องกันการสร้าง NCR ซ้ำจาก Inspection เดียวกัน

ตัวอย่าง Flow

```text
Inspection
    ↓
Failed Quantity > 0
    ↓
Create NCR
    ↓
NCR Tracking
    ↓
Update NCR Status
```

หากมี NCR อยู่แล้ว ระบบจะแสดงสถานะ

```text
NCR exists
```

และป้องกันการสร้างซ้ำด้วย HTTP Status

```text
409 Conflict
```

---

# ⚠️ Alerts Management

ระบบรองรับการแจ้งเตือนเหตุการณ์สำคัญ

ตัวอย่าง

- Inspection Failed
- Daily QC Summary
- Quality Issue
- NCR Related Alert

ผู้ใช้ที่มีสิทธิ์สามารถกด

```text
Acknowledge
```

เพื่อรับทราบ Alert

สถานะ Alert สามารถเป็น

- Acknowledged
- Unacknowledged

---

# 🔐 Authentication

ระบบมีระบบ Login และ Authentication

ใช้

- JWT
- bcrypt

Password จะไม่ถูกเก็บในรูปแบบ Plain Text

ตัวอย่าง Flow

```text
User Login
    ↓
Backend validates username and password
    ↓
bcrypt compares password
    ↓
JWT Token generated
    ↓
Frontend stores authentication state
    ↓
User accesses authorized pages
```

---

# 👥 Role-Based Access Control

ระบบรองรับผู้ใช้งาน 3 Role

- ADMIN
- QC
- PRODUCTION

การควบคุมสิทธิ์ทำงานทั้ง

- Backend Authorization
- Frontend Route Protection
- Role-based UI Actions

---

## 👑 ADMIN

ADMIN สามารถ

- Access Dashboard
- Manage Products
- Create Inspection
- Edit Inspection
- View Inspection History
- Create NCR
- Update NCR
- View Alerts
- Acknowledge Alerts
- Delete Product

---

## 🔍 QC

QC สามารถ

- Access Dashboard
- View Products
- Create Product
- Create Inspection
- Edit Inspection
- View Inspection History
- Create NCR
- Update NCR
- View Alerts
- Acknowledge Alerts

แต่ไม่สามารถ

- Delete Product

---

## 🏭 PRODUCTION

PRODUCTION สามารถดูข้อมูลได้แบบ Read-only

สามารถ

- View Dashboard
- View Products
- View Inspection History
- View Alerts
- View NCR

ไม่สามารถ

- Create Product
- Update Product
- Delete Product
- Create Inspection
- Edit Inspection
- Create NCR
- Update NCR
- Acknowledge Alert

หากเรียก API ที่ไม่มีสิทธิ์ ระบบจะตอบกลับ

```text
403 Forbidden
```

---

# 🧱 System Architecture

```text
┌───────────────────────────────┐
│           Frontend            │
│                               │
│        React + Vite           │
│        React Router           │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│           Backend             │
│                               │
│      Node.js + Express        │
│                               │
│ Authentication / RBAC         │
│ Business Logic                │
└───────────────┬───────────────┘
                │
                │ SQL
                ▼
┌───────────────────────────────┐
│         PostgreSQL            │
│                               │
│ Users                         │
│ Products                      │
│ Inspections                   │
│ NCR                           │
│ Alerts                        │
└───────────────────────────────┘
```

---

# 🛠 Technology Stack

## Frontend

- React
- Vite
- React Router
- JavaScript
- CSS

## Backend

- Node.js
- Express.js
- REST API
- JWT Authentication
- bcrypt

## Database

- PostgreSQL

## Containerization

- Docker
- Docker Compose

---

# 📁 Project Structure

```text
qc-system/
│
├── api/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── routes/
│   │   ├── services/
│   │   ├── server.js
│   │   └── index.js
│   │
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   └── init.sql
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── StatusBadge.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── InspectionPage.jsx
│   │   │   ├── InspectionHistoryPage.jsx
│   │   │   ├── NcrPage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   └── LoginPage.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── api.js
│   │
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
│
└── README.md
```

---

# 🗄 Database

ระบบใช้ PostgreSQL สำหรับจัดเก็บข้อมูลหลัก

ข้อมูลที่จัดการประกอบด้วย

- Users
- Products
- Inspections
- NCR
- Alerts

ความสัมพันธ์ของระบบโดยสรุป

```text
User
 │
 └── creates
       │
       ▼
  Inspection
       │
       ├── Product
       │
       └── Failed Quantity
               │
               ▼
              NCR

Inspection
       │
       ▼
     Alert
```

---

# 🔌 API

ระบบใช้ REST API สำหรับเชื่อมต่อระหว่าง Frontend และ Backend

ตัวอย่าง Endpoint

## Authentication

```text
POST /api/v1/register
POST /api/v1/login
POST /api/v1/logout
```

---

## Products

```text
GET    /api/v1/products
POST   /api/v1/products
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
```

---

## Inspections

```text
GET  /api/v1/inspections
POST /api/v1/inspections
PUT  /api/v1/inspections/:id
```

---

## Dashboard

```text
GET /api/v1/dashboard/summary
```

ตัวอย่าง Response

```json
{
  "total_products": 3,
  "total_inspections": 3,
  "total_quantity": 300,
  "total_passed_quantity": 285,
  "total_failed_quantity": 15,
  "pass_rate": 95,
  "open_ncrs": 2,
  "unacknowledged_alerts": 0
}
```

---

## NCR

```text
GET  /api/v1/ncrs
POST /api/v1/ncrs
PUT  /api/v1/ncrs/:id
```

---

## Alerts

```text
GET /api/v1/alerts
PUT /api/v1/alerts/:id/acknowledge
```

---

# 🔐 Authorization Example

Backend ใช้ Role Authorization Middleware

แนวคิดการทำงาน

```text
Request
   ↓
Authentication Middleware
   ↓
JWT Validation
   ↓
Check User Role
   ↓
authorizeRoles()
   ↓
Allow / Deny Request
```

ตัวอย่าง

```text
ADMIN
   │
   ├── Full Access
   │
QC
   │
   ├── QC Management Access
   │
PRODUCTION
   │
   └── Read-only Access
```

---

# 👤 Default Users

ระบบมี User สำหรับทดสอบ 3 Role

| Role | Username | Password |
|---|---|---|
| ADMIN | admin | admin123 |
| QC | qc_user | qc123 |
| PRODUCTION | production_user | production123 |

> Password ในฐานข้อมูลถูกจัดเก็บด้วย bcrypt hash ไม่ใช่ Plain Text

---

# 🐳 Running with Docker Compose

## 1. Clone Project

```bash
git clone <your-repository-url>
```

เข้าสู่โฟลเดอร์โปรเจกต์

```bash
cd qc-system
```

---

## 2. Build and Start

```bash
docker compose up --build -d
```

คำสั่งนี้จะทำการ

- Build Frontend
- Build Backend
- Start PostgreSQL
- Start API Server
- Start Frontend Server

---

## 3. Check Container Status

```bash
docker compose ps
```

ตัวอย่าง Container

```text
qc-db
qc-api
qc-frontend
```

---

## 4. Stop Containers

```bash
docker compose down
```

---

## 5. Reset Database

หากต้องการลบข้อมูลและเริ่ม Database ใหม่

```bash
docker compose down -v
```

จากนั้นรันใหม่

```bash
docker compose up --build -d
```

> คำสั่งนี้จะลบ PostgreSQL Volume และข้อมูลทั้งหมด

---

# 🌐 Application URLs

เมื่อรัน Docker Compose สำเร็จ

## Frontend

```text
http://localhost:5173
```

## Backend API

```text
http://localhost:4000
```

## Health Check

```text
http://localhost:4000/api/v1/health
```

หากโปรเจกต์ตั้งค่า Health Endpoint เป็น root route สามารถตรวจสอบได้ที่

```text
http://localhost:4000/health
```

---

# 🧪 Testing

ระบบได้รับการทดสอบในส่วนสำคัญดังนี้

## Frontend

```bash
npm run build
```

ผลลัพธ์

```text
Vite build completed successfully
```

---

## Docker Compose

ตรวจสอบ

```text
PostgreSQL  → Healthy
API         → Running
Frontend    → Running
```

---

## Role-Based Access Test

มีการทดสอบสิทธิ์ของผู้ใช้งาน

### ADMIN

```text
Login Successful
Role: ADMIN
```

สามารถเข้าถึงฟังก์ชันทั้งหมดตามสิทธิ์

---

### QC

```text
Login Successful
Role: QC
```

สามารถ

- Create Inspection
- Update Inspection
- Create NCR
- Update NCR
- Acknowledge Alerts

---

### PRODUCTION

```text
Login Successful
Role: PRODUCTION
```

การทดสอบ Write API

```text
POST /products
```

ผลลัพธ์

```text
403 Forbidden
```

การ Acknowledge Alert

```text
403 Forbidden
```

---

# 🚫 NCR Validation

ระบบมี Validation เพื่อป้องกันข้อผิดพลาด

## Cannot create NCR when

```text
failed_quantity = 0
```

ตัวอย่าง

```text
Quantity: 100
Passed: 100
Failed: 0
```

ผลลัพธ์

```text
NCR cannot be created
```

---

## Duplicate NCR Prevention

Inspection เดียวกันไม่สามารถสร้าง NCR ซ้ำได้

หากพยายามสร้างซ้ำ

```text
HTTP 409 Conflict
```

---

# 📊 Dashboard Data Flow

```text
PostgreSQL Database
        │
        ▼
Dashboard Service
        │
        ▼
REST API
        │
        ▼
React Dashboard
        │
        ├── Summary Cards
        ├── Pass Rate
        ├── Recent Inspections
        ├── Recent Alerts
        ├── QC Type Summary
        └── NCR Status Summary
```

---

# 🔄 QC Workflow

กระบวนการทำงานของระบบ

```text
Create Product
      │
      ▼
Create Inspection
      │
      ▼
Select QC Type
      │
      ├── Incoming QC
      ├── In-process QC
      └── Final QC
      │
      ▼
Enter Inspection Result
      │
      ├── Passed
      │
      └── Failed
             │
             ▼
         Create NCR
             │
             ▼
        Track NCR Status
```

---

# 🎯 Key Features Summary

| Feature | Description |
|---|---|
| Authentication | Login ด้วย JWT |
| Security | Password Hash ด้วย bcrypt |
| RBAC | ADMIN / QC / PRODUCTION |
| Products | เพิ่ม แก้ไข ลบสินค้า |
| Incoming QC | ตรวจสอบสินค้าขาเข้า |
| In-process QC | ตรวจสอบระหว่างผลิต |
| Final QC | ตรวจสอบก่อนส่งออก |
| Inspection History | ดูและค้นหาประวัติ |
| NCR | สร้างและติดตาม NCR |
| Alerts | แจ้งเตือนเหตุการณ์ |
| Dashboard | วิเคราะห์ข้อมูลคุณภาพ |
| PostgreSQL | Database จริง |
| REST API | เชื่อมต่อ Frontend/Backend |
| Docker | รันระบบแบบ Container |

---

# 🚀 Future Improvements

ในอนาคตสามารถพัฒนาระบบเพิ่มเติมได้ เช่น

- 📈 เพิ่ม Charts และ Advanced Analytics
- 📊 Quality Trend Analysis
- 📧 Email Notification
- 🔔 Real-time Notification
- 📱 Mobile Responsive Improvement
- 📎 Upload Inspection Evidence
- 📄 Export Inspection Report PDF
- 📊 Export Excel Report
- 🤖 AI Quality Prediction
- 🔍 Advanced Search and Filtering
- 👥 User Management Page
- 📝 Audit Log

---

# 👨‍💻 Development

Developed as a Full-Stack Web Application project for managing manufacturing Quality Control processes.

Technology used

```text
React
Vite
Node.js
Express.js
PostgreSQL
JWT
bcrypt
Docker
Docker Compose
REST API
```

---

# 📝 License

This project is developed for educational and project purposes.

---

# 🎉 Conclusion

QC Manufacturing System เป็นระบบ Full-Stack สำหรับจัดการกระบวนการ Quality Control ภายในโรงงาน

ระบบสามารถจัดการตั้งแต่

```text
Product Management
        ↓
Quality Inspection
        ↓
Inspection History
        ↓
Failed Detection
        ↓
NCR Creation
        ↓
Alerts
        ↓
Dashboard Analytics
```

โดยระบบเชื่อมต่อกับ PostgreSQL Database จริง และมีระบบ Authentication และ Role-Based Access Control เพื่อควบคุมสิทธิ์ของผู้ใช้งาน

ระบบสามารถรันได้ง่ายผ่าน Docker Compose โดยมี Frontend, Backend และ Database ทำงานร่วมกันในรูปแบบ Containerized Application