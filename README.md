# Smart Hostel Management Information System (MIS)

**Student:** Harsh Sharma | **Reg. No.:** 231070064  
**Course:** MIS Lab Project  
**Tech Stack:** React.js · Node.js · SQLite · REST APIs

---

## 📋 Overview

A web-based platform for educational institutions to manage hostel operations digitally. Covers 10 functional modules including authentication, student management, room allocation, fee tracking, maintenance workflows, and analytics dashboards.

> **Note:** Payment gateway and SMS/Email integrations are simulated in this prototype. Actual integration deferred to production deployment.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm (comes with Node.js)

### Setup & Run

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Start the backend API (port 5000)
node server.js

# 3. Open a new terminal — install client dependencies
cd client
npm install

# 4. Start the frontend dev server (port 3000)
npm run dev
```

Then open **http://localhost:3000** in your browser.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hostel.edu | demo1234 |
| Warden | warden@hostel.edu | demo1234 |
| Accounts | accounts@hostel.edu | demo1234 |
| Student | student@hostel.edu | demo1234 |
| SysAdmin | sysadmin@hostel.edu | demo1234 |

## 📦 Modules

| # | Module | Description |
|---|--------|-------------|
| M1 | Authentication & RBAC | JWT login, 5 roles, protected routes |
| M2 | Student Registration | CRUD, search, profile management |
| M3 | Room Allocation | Visual room grid, allocation workflow |
| M4 | Fee Payment | Payment recording, tracking, receipts |
| M5 | Maintenance Requests | Submit, assign, track, resolve |
| M6 | Occupancy Dashboard | Real-time stats, per-hostel charts |
| M7 | Disciplinary Records | Incident logging, severity tracking |
| M8 | Reports & Analytics | KPI dashboard, Chart.js visualizations |
| M9 | Notifications | In-app alerts, read/unread management |
| M10 | Admin Configuration | System settings, user management |

## 🏗️ Architecture

```
Client (React/Vite :3000)  →  API (Express :5000)  →  SQLite (file-based)
```

- **Frontend:** React 18, React Router, Axios, Chart.js, React Icons
- **Backend:** Express.js, JWT, bcryptjs, sql.js
- **Database:** SQLite via sql.js (portable, zero-config)

## 📁 Project Structure

```
├── client/          # React frontend
│   └── src/
│       ├── components/   # Sidebar, Header
│       ├── context/      # Auth context
│       ├── pages/        # 10 module pages
│       └── utils/        # API client
├── server/          # Node.js backend
│   ├── db/          # Schema, seed, connection
│   ├── middleware/   # JWT auth
│   └── routes/      # 10 API route files
└── README.md
```
