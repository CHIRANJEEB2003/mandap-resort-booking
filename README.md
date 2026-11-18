# Mandap & Resort Booking Platform

India's wedding venue marketplace — Mandaps, Marriage Halls, Resorts, Banquet Halls.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Tailwind CSS + Vite |
| State | Zustand + TanStack Query |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + Phone OTP |
| Payments | Razorpay |
| Storage | AWS S3 |
| Push | Firebase Cloud Messaging |

---

## Quick Start

### 1. Database (Docker)

```bash
docker compose up postgres -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # fill in secrets
npm install
npx prisma migrate dev --name init
npm run prisma:seed         # creates admin user + sample data
npm run dev                 # http://localhost:5000
```

Default admin login: `admin@mandapbooking.in` / `Admin@12345`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local  # add Razorpay key
npm install
npm run dev                 # http://localhost:3000
```

---

## Project Structure

```
backend/
  prisma/
    schema.prisma         ← Full 22-table PostgreSQL schema
    seed.js               ← Initial data (admin, states, resource types)
  src/
    controllers/          ← Business logic per domain
    middleware/           ← Auth, rate limit, upload, error handling
    routes/               ← Express route definitions
    utils/                ← Prisma client, JWT, OTP, audit

frontend/
  src/
    components/
      layout/             ← Customer, Owner, Admin layout shells
      ui/                 ← PropertyCard, StatCard, badges, spinners
    context/              ← Zustand auth store
    pages/
      public/             ← Home, Search, Property Detail, Login, Register
      customer/           ← Dashboard, Bookings, Booking flow, Payment, Profile
      owner/              ← Dashboard, Properties, Bookings, Revenue, Calendar, Staff, Resources
      admin/              ← Dashboard, Users, Verification queues, Finance, Reports, Audit, Locations
    services/             ← Axios API client with token refresh
```

---

## Open Questions (from brief — answer before dev)

1. **SMS provider** — Msg91 / Fast2SMS / Twilio? (configure in `src/utils/otp.js`)
2. **Razorpay account** — Add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to `.env`
3. **AWS S3** — Add bucket name and credentials; or swap `src/middleware/upload.js` for local disk storage during dev
4. **Firebase** — Add `FIREBASE_*` env vars for push notifications
5. **Google Maps** — Add `VITE_GOOGLE_MAPS_API_KEY` to frontend env for the map on the property detail page
6. **LGD location dataset** — Import official India location data into `states` / `location_nodes` tables via seed

---

## Key Design Decisions

- **Availability engine**: atomic PostgreSQL transactions + `booking_holds` with `expires_at` TTL prevent double-booking
- **Audit trail**: `audit_logs` (bigint PK, non-deletable, append-only)
- **Resource tracking**: `property_resources` + `resource_allocations` track team availability per booking
- **Multi-role RBAC**: single `users` table, role-specific profile tables (`customer_profiles`, `owner_profiles`, `admin_profiles`)
- **Owner gating**: properties can only be listed after owner is `APPROVED` by admin
