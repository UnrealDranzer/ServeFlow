# ServeFlow Production Readiness Checklist

This checklist is based on the current ServeFlow codebase in this workspace.
It is intentionally strict: "implemented" means the control exists in code today, while "required before launch" means the control still needs operational completion, validation, or additional implementation before real production use.

## 1. Current Launch Posture

ServeFlow is now structured like a real multi-tenant SaaS:
- Modular monolith with separate `client/` and `server/` deployables
- PostgreSQL plus Prisma data model with `business_id` tenant scoping
- JWT access tokens with refresh token cookies
- Owner and staff role separation
- Public QR ordering resolved by `businessSlug + sourceSlug`
- Rate limiting, Helmet, CORS allowlisting, request validation, and centralized error handling
- Admin and public frontend flows connected to real backend endpoints

ServeFlow is not yet "ready to deploy and forget."
Before accepting paying tenants, the remaining pre-launch items below should be completed.

## 2. Security Checklist

### Already implemented
- [x] Passwords are hashed with bcrypt. Plain password storage is not used.
- [x] Access tokens are short-lived and signed server-side.
- [x] Refresh tokens are stored in `HttpOnly` cookies, not exposed to frontend JavaScript.
- [x] Refresh tokens are treated as opaque secrets and should be hashed in the database.
- [x] Auth refresh/logout routes require the `X-ServeFlow-CSRF` header.
- [x] Helmet is part of the Express foundation.
- [x] CORS is explicit and allowlist-based through `CLIENT_ORIGINS`.
- [x] Request payload sizes are capped through `REQUEST_BODY_LIMIT`.
- [x] Rate limiting exists for general API traffic, auth, and public order placement.
- [x] Request validation is enforced with Zod.
- [x] Centralized error handling avoids leaking stack traces in production responses.
- [x] Sensitive internal fields are not intended to be returned directly from raw Prisma objects.

### Required before launch
- [ ] Generate a high-entropy production `ACCESS_TOKEN_SECRET` and store it only in platform secrets.
- [ ] Set exact production `CLIENT_ORIGINS`; do not leave localhost or wildcard-like values in production.
- [ ] Set `PUBLIC_APP_URL` to the final public frontend origin so QR URL generation is correct.
- [ ] Set `COOKIE_DOMAIN` correctly if frontend and backend are on sibling subdomains and cross-site cookies are required.
- [ ] Set `TRUST_PROXY=1` or the correct proxy depth on Render/Railway behind their proxy layer.
- [ ] Confirm `NODE_ENV=production` so refresh cookies become `secure` and `sameSite=none`.
- [ ] Add dependency and container/platform vulnerability scanning in CI.
- [ ] Add platform-level TLS-only enforcement and HSTS validation in deployed environments.
- [ ] Add alerting for repeated auth failures, repeated public order throttling, and abnormal 5xx spikes.

### Strongly recommended before launch
- [ ] Add automated integration tests for login, refresh, logout, and role boundaries.
- [ ] Add audit log persistence for business-critical changes such as settings, source creation, menu edits, and order status changes.
- [ ] Add account lockout or stepped friction for repeated failed logins from the same identifier/IP.
- [ ] Add structured log shipping and retention policy instead of console-only observability.

## 3. Tenant Isolation Checklist

### Already implemented
- [x] Tenant-owned tables include `business_id`.
- [x] Backend tenant context is derived from the authenticated user for admin routes.
- [x] Public QR routes resolve tenant context only through `businessSlug + sourceSlug`.
- [x] Tenant context is not trusted from frontend payloads.
- [x] Role-based authorization exists for owner versus staff operations.
- [x] Public order creation resolves source and business safely on the server.
- [x] Historical order items store name and price snapshots.
- [x] Order and dashboard queries are designed around business scope.

### Required before launch
- [ ] Run a tenant-isolation audit across every repository/service query and confirm every tenant-owned read/write path includes explicit `businessId` scoping.
- [ ] Add automated tests proving cross-tenant access returns denial or not-found responses.
- [ ] Add automated tests proving staff users cannot reach owner-only modules like categories, menu items, order sources, and settings.
- [ ] Add automated tests proving public QR orders cannot place against inactive businesses, inactive sources, disabled order mode, or `accepting_orders=false`.
- [ ] Add seed/bootstrap scripts for safe business provisioning so new tenants are created consistently and settings are initialized correctly.

### Deny-by-default rule
Any new module added later must fail review if:
- it queries tenant-owned data without `businessId`
- it accepts `business_id` from the client as trusted input
- it exposes global record IDs across tenant boundaries without tenant scope

## 4. Environment Variables

The codebase currently expects the following server variables:

| Variable | Purpose | Production note |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | Must be `production` in live deploys |
| `PORT` | Express port | Platform usually injects this |
| `DATABASE_URL` | PostgreSQL connection string | Use managed secret storage |
| `CLIENT_ORIGINS` | Allowed frontend origins | Exact comma-separated origins only |
| `PUBLIC_APP_URL` | Public frontend base URL | Used for QR/public link generation |
| `ACCESS_TOKEN_SECRET` | JWT signing secret | Minimum 32 chars, use much longer |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime | Keep short, current default is appropriate |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh cookie/session lifetime | Review against business risk tolerance |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost | Default 12 is a good baseline |
| `COOKIE_DOMAIN` | Cookie domain override | Needed for some cross-subdomain setups |
| `TRUST_PROXY` | Proxy trust depth | Required behind managed platforms |
| `REQUEST_BODY_LIMIT` | Request size cap | Keep small unless uploads are added |
| `API_RATE_LIMIT_WINDOW_MS` | General API throttling window | Tune with traffic patterns |
| `API_RATE_LIMIT_MAX` | General API throttle count | Tune with real usage |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Auth throttle window | Keep strict |
| `AUTH_RATE_LIMIT_MAX` | Auth throttle count | Keep strict |
| `PUBLIC_ORDER_RATE_LIMIT_WINDOW_MS` | Public order throttle window | Keep strict |
| `PUBLIC_ORDER_RATE_LIMIT_MAX` | Public order throttle count | Keep strict |
| `LOG_LEVEL` | Log verbosity | Prefer `info` or `warn` in production |

Client variables currently expected:

| Variable | Purpose | Production note |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Browser API base URL | Must point to `/api` on the deployed backend |

### Secret handling rules
- Never commit production secrets.
- Never expose server secrets through Vite variables.
- Rotate `ACCESS_TOKEN_SECRET` using a controlled process.
- Restrict managed database credentials to the minimum needed for the app.

## 5. Deployment Checklist

### Database
- [ ] Create a managed PostgreSQL instance on Neon, Railway, or Supabase.
- [ ] Enable backups and define retention.
- [ ] Run `prisma migrate deploy` during backend deployment.
- [ ] Confirm timezone assumptions for database timestamps and business timezone handling.
- [ ] Create a safe bootstrap path for the first business and owner user.

### Backend
- [ ] Deploy `server/` to Render or Railway with Node 20+.
- [ ] Set all server environment variables in platform secrets.
- [ ] Confirm `postinstall` runs `prisma generate` successfully on the platform.
- [ ] Confirm `start` runs the API without dev-only tooling.
- [ ] Confirm the reverse proxy forwards HTTPS and client IPs correctly.
- [ ] Confirm cookies are issued and cleared correctly in the deployed domain setup.
- [ ] Confirm CORS only allows the real frontend origins.

### Frontend
- [ ] Deploy `client/` to Vercel.
- [ ] Set `VITE_API_BASE_URL` to the production backend `/api` origin.
- [ ] Verify refresh-cookie flows across the final frontend/backend domain setup.
- [ ] Verify QR links open the intended public menu origin.

### Release process
- [ ] Add CI for install, lint, test, and build.
- [ ] Block production deployment on failed migrations, failed tests, or failed build.
- [ ] Add environment-specific deploy targets for staging and production.
- [ ] Deploy to staging first and validate with multiple test tenants.

## 6. QA Checklist

### Authentication and session QA
- [ ] Owner can log in only for the correct `businessSlug + email + password`.
- [ ] Staff can log in only for their own business.
- [ ] `GET /api/auth/me` returns only the current tenant user.
- [ ] Logout clears the refresh cookie and invalidates the session.
- [ ] Expired access token refresh works silently when refresh session is valid.
- [ ] Revoked refresh session cannot be reused.

### Tenant isolation QA
- [ ] Tenant A cannot read Tenant B categories, menu items, sources, orders, dashboard, or settings.
- [ ] Tenant A cannot update or delete Tenant B records by ID guessing.
- [ ] Public QR route for one business cannot place orders into another business.
- [ ] Staff cannot access owner-only routes from frontend or backend.

### Public ordering QA
- [ ] Public menu loads only for active business plus active source combinations.
- [ ] Paused ordering blocks order placement.
- [ ] Disabled QR order mode blocks public ordering.
- [ ] Unavailable items cannot be ordered.
- [ ] Server recalculates totals and rejects tampered client payloads.
- [ ] Public order throttling activates correctly under repeated attempts.

### Operational QA
- [ ] Manual order flow creates orders with `order_type=manual` and `placed_by_user_id`.
- [ ] QR order flow creates orders with `order_type=qr` and null `placed_by_user_id`.
- [ ] Order status transitions behave correctly and do not allow invalid jumps.
- [ ] Dashboard revenue counts only paid orders.
- [ ] Recent orders and pending metrics stay tenant-correct.
- [ ] QR preview/download works for all supported source types.

### UX QA
- [ ] Admin routes handle loading, empty, and error states gracefully.
- [ ] Public menu, cart, and success flow work on mobile viewports.
- [ ] Cookie/auth flows work in the real browser/privacy environment used by customers and staff.
- [ ] Luxury UI remains readable on low-end devices and slower networks.

## 7. Known Gaps Before a Real Paid Launch

These are the main remaining gaps I would not ignore:
- [ ] No automated test suite is present yet.
- [ ] No CI pipeline is present yet.
- [ ] No dependency installation or production build has been run in this workspace yet.
- [ ] No business self-serve onboarding or controlled bootstrap script has been added yet.
- [ ] No persistent audit log table exists yet.
- [ ] No staging environment validation has been performed yet.
- [ ] No monitoring, tracing, or on-call alerting setup exists yet.

## 8. Minimum Go-Live Gate

ServeFlow should not go live for paying businesses until all of the following are true:
- [ ] Production environment variables are set correctly
- [ ] Prisma migrations run successfully in staging and production
- [ ] Multi-tenant isolation tests pass
- [ ] Auth and refresh-session tests pass
- [ ] Public order abuse controls are verified
- [ ] Owner/staff authorization tests pass
- [ ] Frontend production build succeeds
- [ ] Backend starts cleanly in a deployed environment
- [ ] End-to-end ordering is validated for at least two separate tenants
- [ ] Backups, logging, and alerting are enabled

If these are complete, ServeFlow moves from "well-architected codebase" to "real production candidate."
