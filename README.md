# Lost and Found Portal 🔍

A full-stack MERN application for managing lost and found items in educational institutions. Students and staff can report found items, browse all listed items, and manage item statuses.

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Database Schema](#-database-schema)
- [Installation](#-installation)
- [API Endpoints](#-api-endpoints)
- [Security Features](#-security-features)

## ✨ Features

### Authentication
- 🔐 Secure login with email and password
- 👨‍🎓 **Student Registration**: Name, Email, Student ID, Semester, Password
- 👨‍🏫 **Staff Registration**: Name, Email, Department, Password
- 🔑 JWT-based authentication with token persistence

### Found Items Management
- 📸 Upload found items with images
- 📝 Add detailed descriptions, categories, and locations
- 🗓️ Record date, time, and deposit location
- 🏷️ Categorize items (Electronics, Documents, Accessories, Clothing, Books, Others)

### Item Browsing
- 🔍 Search items by name, description, or location
- 🎯 Filter by category and status
- 📄 Pagination support
- 📱 Responsive card-based layout

### Status Management
- ✅ **Available**: Item is waiting to be claimed
- 🔔 **Claimed**: Someone has claimed the item
- ↩️ **Returned**: Item has been returned to owner

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Library
- **React Router v6** - Navigation
- **React Bootstrap** - UI Components
- **Axios** - HTTP Client
- **React Toastify** - Notifications
- **Bootstrap Icons** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt.js** - Password Hashing
- **Multer** - File Upload

## 📁 Directory Structure

```
lost-and-found-portal/
├── backend/                          # Node.js Express Backend
│   ├── middleware/
│   │   ├── auth.js                   # JWT authentication middleware
│   │   └── upload.js                 # Multer file upload configuration
│   ├── models/
│   │   ├── User.js                   # Base User schema (discriminator pattern)
│   │   ├── Student.js                # Student schema (extends User)
│   │   ├── Staff.js                  # Staff schema (extends User)
│   │   └── FoundItem.js              # Found item schema
│   ├── routes/
│   │   ├── auth.js                   # Authentication routes
│   │   └── items.js                  # Item CRUD routes
│   ├── uploads/                      # Uploaded images directory
│   ├── .env                          # Environment variables
│   ├── package.json                  # Backend dependencies
│   └── server.js                     # Express server entry point
│
├── frontend/                         # React Frontend
│   ├── public/
│   │   ├── index.html                # HTML template
│   │   └── manifest.json             # PWA manifest
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              # Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── Navbar.js             # Navigation component
│   │   │   └── PrivateRoute.js       # Route protection component
│   │   ├── context/
│   │   │   └── AuthContext.js        # Authentication context provider
│   │   ├── pages/
│   │   │   ├── Home.js               # Landing page with items grid
│   │   │   ├── Login.js              # Login page
│   │   │   ├── Signup.js             # Registration page (Student/Staff)
│   │   │   ├── UploadItem.js         # Upload found item form
│   │   │   ├── ItemList.js           # Items listing with filters
│   │   │   ├── ItemDetail.js         # Single item detail view
│   │   │   └── MyItems.js            # User's uploaded items
│   │   ├── App.js                    # Main app component with routing
│   │   ├── index.js                  # React entry point
│   │   └── index.css                 # Global styles
│   └── package.json                  # Frontend dependencies
│
└── README.md                         # Project documentation
```

## 🗄️ Database Schema

### DBMS Normalization Applied

The database follows **Third Normal Form (3NF)** principles:

- **1NF**: All columns contain atomic values
- **2NF**: No partial dependencies (all non-key attributes depend on entire primary key)
- **3NF**: No transitive dependencies (non-key attributes don't depend on other non-key attributes)

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS (Base)                                │
├─────────────────────────────────────────────────────────────────────────┤
│ _id          │ ObjectId   │ PRIMARY KEY                                  │
│ email        │ String     │ UNIQUE, NOT NULL                             │
│ password     │ String     │ NOT NULL (hashed with bcrypt)                │
│ name         │ String     │ NOT NULL                                     │
│ userType     │ Enum       │ 'student' | 'staff' (discriminator)          │
│ createdAt    │ Date       │ DEFAULT: now()                               │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────┐   ┌───────────────────────────────┐
│         STUDENTS                  │   │           STAFF               │
├───────────────────────────────────┤   ├───────────────────────────────┤
│ + studentId │ String │ UNIQUE     │   │ + department │ String │ REQ   │
│ + semester  │ Number │ 1-8        │   │                               │
└───────────────────────────────────┘   └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            FOUND_ITEMS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId    │ PRIMARY KEY                              │
│ itemName        │ String      │ NOT NULL                                 │
│ description     │ String      │ NOT NULL                                 │
│ imageUrl        │ String      │ NOT NULL                                 │
│ foundLocation   │ String      │ NOT NULL                                 │
│ foundDate       │ Date        │ NOT NULL                                 │
│ foundTime       │ String      │ NOT NULL                                 │
│ depositLocation │ String      │ NOT NULL                                 │
│ uploadedBy      │ ObjectId    │ FOREIGN KEY -> Users._id                 │
│ status          │ Enum        │ 'available' | 'claimed' | 'returned'     │
│ category        │ Enum        │ 'electronics' | 'documents' | etc.       │
│ createdAt       │ Date        │ DEFAULT: now()                           │
│ updatedAt       │ Date        │ AUTO-UPDATE                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Collections Structure (MongoDB)

#### Users Collection (Discriminator Pattern)
```javascript
// Student document example
{
  _id: ObjectId("..."),
  email: "student@example.com",
  password: "$2a$10$...",  // bcrypt hashed
  name: "John Doe",
  userType: "student",
  studentId: "STU2024001",
  semester: 6,
  createdAt: ISODate("2024-01-15T10:30:00Z")
}

// Staff document example
{
  _id: ObjectId("..."),
  email: "staff@example.com",
  password: "$2a$10$...",  // bcrypt hashed
  name: "Jane Smith",
  userType: "staff",
  department: "Computer Science",
  createdAt: ISODate("2024-01-15T10:30:00Z")
}
```

#### FoundItems Collection
```javascript
{
  _id: ObjectId("..."),
  itemName: "Blue Backpack",
  description: "Navy blue JanSport backpack with laptop compartment",
  imageUrl: "/uploads/item-1234567890.jpg",
  foundLocation: "Library 2nd Floor",
  foundDate: ISODate("2024-01-20T00:00:00Z"),
  foundTime: "14:30",
  depositLocation: "Security Office - Main Gate",
  uploadedBy: ObjectId("..."),  // Reference to User
  status: "available",
  category: "accessories",
  createdAt: ISODate("2024-01-20T15:00:00Z"),
  updatedAt: ISODate("2024-01-20T15:00:00Z")
}
```

### Database Indexes
```javascript
// FoundItems collection indexes for optimized queries
{ status: 1, createdAt: -1 }  // For filtering by status with sorting
{ category: 1 }               // For filtering by category
```

## 🚀 Installation

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (running locally or MongoDB Atlas)
- **npm** or **yarn**
- **MongoDB Compass** (optional, for database visualization)

### Backend Setup

1. Navigate to backend directory:
```bash
cd lost-and-found-portal/backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/lost_found_portal
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
```

4. Start the server:
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server runs on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd lost-and-found-portal/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open http://localhost:3000 in your browser

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/signup/student` | Register new student | ❌ |
| `POST` | `/api/auth/signup/staff` | Register new staff | ❌ |
| `POST` | `/api/auth/login` | User login | ❌ |
| `GET` | `/api/auth/me` | Get current user info | ✅ |

### Items

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/items` | Get all items (with filters) | ❌ |
| `GET` | `/api/items/:id` | Get single item details | ❌ |
| `POST` | `/api/items` | Upload new found item | ✅ |
| `PUT` | `/api/items/:id` | Update item status | ✅ |
| `DELETE` | `/api/items/:id` | Delete item | ✅ |
| `GET` | `/api/items/user/my-items` | Get user's uploaded items | ✅ |

### Query Parameters for `GET /api/items`

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in name, description, location |
| `category` | string | Filter by category |
| `status` | string | Filter by status |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 12) |

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token authentication
- ✅ Protected routes with middleware
- ✅ File upload validation (images only, 5MB max)
- ✅ Input validation and sanitization
- ✅ CORS enabled for cross-origin requests

## 📱 Responsive Design

The application is fully responsive and works on:
- 📱 Mobile devices
- 📟 Tablets
- 💻 Desktops
- 🖥️ Large screens

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributors

- Built for **Symbiosis Institute of Technology, Nagpur**
- Krish Dahake , Karan Deshmukh

---

Made with ❤️ using MERN Stack
