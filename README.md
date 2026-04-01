# ServeFlow

ServeFlow is a production-minded multi-tenant SaaS for restaurants, cafes, tea shops, bakeries, and other small food businesses.

It supports:
- QR ordering for dine-in tables and other order sources
- Manual order entry by staff and owners
- Live order management
- Sales and revenue dashboards
- Menu and category management
- Order source management for tables, counter, takeaway, and parcel

This codebase is built as a modular monolith with strict tenant isolation.

## Stack

### Frontend
- React + Vite
- Tailwind CSS
- React Router
- Axios
- TanStack Query

### Backend
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT auth
- bcrypt
- Zod

## Project Structure

```text
ServeFlow/
  client/
    src/
      app/
      components/
      features/
        auth/
        dashboard/
        menu/
        orders/
        public-menu/
        settings/
        sources/
      hooks/
      lib/
      pages/
      routes/
      store/
      main.jsx
  server/
    prisma/
      schema.prisma
    src/
      config/
      db/
      middlewares/
      modules/
        auth/
        businesses/
        categories/
        dashboard/
        menu-items/
        order-sources/
        orders/
        settings/
      utils/
      app.js
      server.js
  README.md
  SERVEFLOW_PRODUCTION_READINESS.md
```

## Core Security Model

- Every tenant-owned record is scoped by `business_id`
- Tenant context is derived from the authenticated user, not trusted from the frontend
- Public ordering resolves tenant context through `businessSlug + sourceSlug`
- Request bodies, params, and queries are validated with Zod
- Access tokens are short-lived
- Refresh tokens are stored in `HttpOnly` cookies
- Owner and staff permissions are separated server-side

## Prerequisites

Install these locally first:
- Node.js 20+
- npm 10+
- PostgreSQL 15+ or a managed Postgres database

## 1. Get The Project On Your Machine

If you are using the packaged folder created in this workspace, use:
- [ServeFlow](/C:/Users/ADARSH/OneDrive/Desktop/Restaurant%20Management%20Saas/ServeFlow)

If you are using the working project folder directly, use:
- [Restaurant Management Saas](/C:/Users/ADARSH/OneDrive/Desktop/Restaurant%20Management%20Saas)

## 2. Install Dependencies

### Server

```powershell
cd server
npm install
```

### Client

```powershell
cd client
npm install
```

## 3. Configure Environment Variables

### Server

Copy [server/.env.example](/C:/Users/ADARSH/OneDrive/Desktop/Restaurant%20Management%20Saas/server/.env.example) to `server/.env`.

Example:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/serveflow
CLIENT_ORIGINS=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173
ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret-at-least-32-characters
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
BCRYPT_SALT_ROUNDS=12
COOKIE_DOMAIN=
TRUST_PROXY=0
REQUEST_BODY_LIMIT=256kb
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_WINDOW_MS=60000
AUTH_RATE_LIMIT_MAX=20
PUBLIC_ORDER_RATE_LIMIT_WINDOW_MS=60000
PUBLIC_ORDER_RATE_LIMIT_MAX=10
LOG_LEVEL=info
```

### Client

Copy [client/.env.example](/C:/Users/ADARSH/OneDrive/Desktop/Restaurant%20Management%20Saas/client/.env.example) to `client/.env`.

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## 4. Create The Database And Run Prisma

Create a Postgres database named `serveflow`, then run:

```powershell
cd server
npx prisma generate
npx prisma migrate dev --name init
```

If you want to inspect records visually:

```powershell
cd server
npx prisma studio
```

## 5. Bootstrap The First Business And Owner

There is not yet a self-serve onboarding or seed script in this codebase.
For now, create the first business and owner manually through Prisma Studio.

### Step A: Generate a bcrypt password hash

Run this from `server/` after `npm install`:

```powershell
node --input-type=module -e "import bcrypt from 'bcrypt'; console.log(await bcrypt.hash('ChangeMe123!', 12))"
```

Copy the output hash.

### Step B: Open Prisma Studio

```powershell
cd server
npx prisma studio
```

### Step C: Create one `Business` record

Use values like:

| Field | Example |
| --- | --- |
| `name` | `Auric Bistro` |
| `slug` | `auric-bistro` |
| `businessType` | `RESTAURANT` |
| `ownerName` | `Adarsh` |
| `email` | `owner@auricbistro.com` |
| `phone` | `9876543210` |
| `logoUrl` | leave blank or use an image URL |
| `currency` | `INR` |
| `orderMode` | `BOTH` |
| `isActive` | `true` |

### Step D: Create one `User` record

Set:

| Field | Value |
| --- | --- |
| `businessId` | the `id` from the business you just created |
| `name` | `Adarsh` |
| `email` | `owner@auricbistro.com` |
| `passwordHash` | paste the bcrypt hash |
| `role` | `OWNER` |
| `isActive` | `true` |

### Optional Step E: Create initial settings

This is optional because the backend will upsert settings when needed.
If you want to create them manually, add one `BusinessSettings` row with:

| Field | Example |
| --- | --- |
| `businessId` | same business id |
| `acceptingOrders` | `true` |
| `showImages` | `true` |
| `showItemDescription` | `true` |
| `showVegBadge` | `true` |
| `timezone` | `Asia/Kolkata` |

## 6. Start The App

### Start the backend

```powershell
cd server
npm run dev
```

The API will run on:
- `http://localhost:4000`

### Start the frontend

```powershell
cd client
npm run dev
```

The app will run on:
- `http://localhost:5173`

## 7. Log In

Go to:
- `http://localhost:5173/login`

Login uses:
- `businessSlug`
- `email`
- `password`

Using the example above:
- business slug: `auric-bistro`
- email: `owner@auricbistro.com`
- password: `ChangeMe123!`

## 8. First Recommended Setup Inside The UI

After logging in as the owner:
1. Update business settings
2. Create categories
3. Create menu items
4. Create order sources like `Table 1`, `Counter`, `Takeaway`
5. Open QR previews for sources
6. Test the public QR ordering route

Public menu route format:

```text
/menu/:businessSlug/:sourceSlug
```

Example:

```text
http://localhost:5173/menu/auric-bistro/table-1
```

## 9. Useful Commands

### Backend

```powershell
cd server
npm run dev
npm run start
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:studio
```

### Frontend

```powershell
cd client
npm run dev
npm run build
npm run preview
```

## 10. What Is Included Today

- Multi-tenant schema with Prisma and PostgreSQL
- Auth, refresh session flow, role checks, validation, and security middleware
- Categories, menu items, order sources, settings, orders, dashboard, and public menu APIs
- Admin app and public QR customer flow
- Premium hospitality-style frontend design direction
- Production-readiness checklist in [SERVEFLOW_PRODUCTION_READINESS.md](/C:/Users/ADARSH/OneDrive/Desktop/Restaurant%20Management%20Saas/SERVEFLOW_PRODUCTION_READINESS.md)

## 11. What Still Remains Before Real Production Launch

This project is architected like a real SaaS, but these gaps still remain:
- automated tests
- CI pipeline
- audit logging
- seed/onboarding flow
- staging validation
- monitoring and alerting

See:
- [SERVEFLOW_PRODUCTION_READINESS.md](/C:/Users/ADARSH/OneDrive/Desktop/Restaurant%20Management%20Saas/SERVEFLOW_PRODUCTION_READINESS.md)

## 12. Notes

- `node_modules` is not included in the packaged folder or zip.
- You need to run `npm install` separately in `server/` and `client/`.
- The first tenant bootstrap is manual for now by design, because a rushed signup flow would be weaker than a controlled first setup.
