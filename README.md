# Mandap & Resort Booking Platform

India's wedding venue marketplace — Mandaps, Marriage Halls, Resorts, Banquet Halls.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Tailwind CSS + Vite |
| State | Zustand + TanStack Query |
| Backend | Node.js + Express |
| Database | MongoDB (replica set) + Prisma ORM |
| Auth | JWT + Phone OTP |
| Payments | Razorpay |
| Storage | AWS S3 |
| Push | Firebase Cloud Messaging |

---

## Quick Start

### 1. Database (MongoDB)

Prisma needs MongoDB running as a **replica set** (for transactions and nested writes).
Pick one:

- **Local MongoDB installed on Windows** — `.\start-mongo-dev.ps1` starts a dev replica set on
  port 27018 (data in `.mongo-data/`). The first run also creates the collections and seeds data.
- **Docker** — `docker compose up mongo -d` (replica set on port 27017).
- **MongoDB Atlas** (free M0 cluster) — already a replica set; use its `mongodb+srv://…` URL.

### 2. Backend

```bash
cd backend
cp .env.example .env        # set DATABASE_URL + secrets
npm install
npx prisma db push          # creates collections + indexes (MongoDB has no migrations)
node prisma/ensure-indexes.js   # partial unique index on User.email
npm run prisma:seed         # creates admin user + reference data
node seed-demo.js           # optional: demo venues and owners
npm run dev                 # http://localhost:5000
```

`DATABASE_URL` examples:
- local script: `mongodb://127.0.0.1:27018/mandap_booking?replicaSet=rs0&directConnection=true`
- Docker: `mongodb://127.0.0.1:27017/mandap_booking?replicaSet=rs0&directConnection=true`
- Atlas: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mandap_booking?retryWrites=true&w=majority`

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
    schema.prisma         ← Full MongoDB schema (43 models)
    ensure-indexes.js     ← Indexes Prisma cannot express (partial unique email)
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

- **Availability engine**: date checks + MongoDB transactions (replica set) + `booking_holds` with `expires_at` TTL prevent double-booking
- **Audit trail**: `AuditLog` collection (append-only)
- **Resource tracking**: `property_resources` + `resource_allocations` track team availability per booking
- **Multi-role RBAC**: single `users` table, role-specific profile tables (`customer_profiles`, `owner_profiles`, `admin_profiles`)
- **Owner gating**: properties can only be listed after owner is `APPROVED` by admin

---

## Deploy (Render)

`render.yaml` deploys one web service: Express serves the API at `/api` and the built React app.
Render → **New → Blueprint** → select this repo, and paste a MongoDB Atlas connection string
as `DATABASE_URL` when prompted. In Atlas → Network Access, allow `0.0.0.0/0` (Render has no static IPs on the free plan).

Notes on the MongoDB schema: ids are UUID strings stored in `_id`; money fields are `Float`;
calendar dates (`eventDate`, `checkIn`, `checkOut`) are stored as UTC midnight (`src/utils/date.js`).
