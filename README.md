# odoo-hackathon-assetflow

# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is a centralized ERP-style platform for organizations to track, allocate, and manage physical assets and shared resources — replacing manual spreadsheets and paper logs with structured workflows, real-time visibility, and role-based access control.

Built for [Hackathon Name] 2026.

## 🚀 Features

- **Authentication & Roles** — JWT-based auth with 4 roles: Admin, Asset Manager, Department Head, Employee. Signup creates Employee accounts only; roles are promoted exclusively by Admin.
- **Organization Setup** — Manage departments (with hierarchy), asset categories (with dynamic custom fields), and the employee directory.
- **Asset Registry** — Register and track assets with auto-generated tags (`AF-0001`, `AF-0002`...), full lifecycle status (Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed), and searchable directory.
- **Allocation & Transfer** — Allocate assets to employees/departments with strict conflict handling: an already-allocated asset cannot be re-allocated — the system blocks it and offers a transfer request instead. Transfer requests go through an approval workflow before re-allocation.
- **Resource Booking** — Book shared/limited resources (rooms, vehicles, equipment) by time slot, with strict overlap validation (back-to-back bookings are allowed; overlapping ones are rejected).
- **Role-Aware Dashboard** — Real-time KPI cards, overdue/upcoming returns, and a personalized view for employees vs. org-wide analytics for admins/managers.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + React Router |
| Backend | Node.js + Express (REST API) |
| Database | SQLite + Prisma ORM |
| Auth | JWT + bcrypt |

## 📁 Project Structure


## ⚙️ Setup & Run

### Prerequisites
- Node.js 18+

### Steps

```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev        # runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
```

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@assetflow.com | admin123 |
| Employee | ravi@assetflow.com | password123 |
| Employee | priya@assetflow.com | password123 |

## 🧩 Core Business Logic Highlights

- **Allocation Conflict Rule**: Attempting to allocate an already-allocated asset is blocked with a clear "currently held by X" message and a Request Transfer option — never a silent overwrite.
- **Booking Overlap Rule**: Time-slot bookings for the same resource are validated on the backend; overlapping ranges are rejected, back-to-back ranges are permitted.

## 📌 Roadmap (Post-MVP)

- [ ] Maintenance request & approval workflow
- [ ] Structured audit cycles with discrepancy reports
- [ ] Reports & analytics (utilization trends, exportable reports)
- [ ] Notifications & activity logs

## 👥 Team

[Apna team ke naam yahan daalo]

## 📄 License

Built for hackathon evaluation purposes.
