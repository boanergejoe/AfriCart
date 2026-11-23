# AfriCart Technical Guide

This guide is for developers working on the AfriCart codebase. For end-user instructions, see
[USER_GUIDE.md](./USER_GUIDE.md).

AfriCart is a three-app monorepo plus a separate Expo starter:

| Component | Folder | Stack | Serves |
| --- | --- | --- | --- |
| API | `backend/` | Node 22, Express 5, Mongoose 8, Clerk Express, Cloudinary, PesaPal, Inngest | All customer and admin data, authentication, payments, image uploads |
| Admin console | `admin/` | React 19, Vite 7, React Router 7, TanStack Query, Tailwind 4 + daisyUI | Store management for staff |
| Storefront | `mobile/` | Expo SDK 54, Expo Router 6, React Native 0.81, Clerk Core 3 (`@clerk/expo`), NativeWind, TanStack Query | Customer shopping app for iOS, Android and web |
| Expo starter | `santo/` | Expo SDK 58, Expo Router, `@expo/ui` | Independent experimentation; **not** connected to the storefront |

```
Customer (mobile/web) ── Clerk token ──▶ Express API ──▶ MongoDB Atlas
Staff (admin console) ── signed session ─▶ Express API ──▶ Cloudinary / PesaPal
Clerk webhooks ──────────────────────▶ Inngest ─────────▶ MongoDB user sync
```

The API is the only component that holds secrets. `VITE_*` (admin) and `EXPO_PUBLIC_*` (storefront)
values are embedded in client bundles at build time and must never contain backend credentials.

---

## 1. Prerequisites

- **Node.js:** `22.x` is declared by `backend/package.json` and `admin/package.json`; the root
  `package.json` requires `>=20`. Use Node 22 to avoid engine warnings.
- **npm** with the committed `package-lock.json` files (each app has its own).
- **MongoDB Atlas** (or another replica set) — payment updates use transactions, so a standalone
  MongoDB without a replica set will not work.
- Accounts/API keys for **Clerk**, **Cloudinary**, and **PesaPal**. Optional: **Inngest** (user sync
  functions) and **Sentry** (error monitoring).
- For native storefront builds: Xcode / Android Studio or an EAS build. Expo Go only includes the
  SDK's bundled native modules; Clerk/Secure Store config plugins are already declared in
  `mobile/app.json`.

---

## 2. First-time local setup

Install per app (the root has helper scripts, but there is no root lockfile):

```bash
cd backend && npm ci
cd ../admin  && npm ci
cd ../mobile && npm ci
```

### 2.1 Environment files

For each app, copy the template and fill in local values:

```bash
cp backend/.env.example backend/.env
cp admin/.env.example  admin/.env
cp mobile/.env.example mobile/.env
```

`.env` files are ignored by Git at the repo root and in the admin/mobile `.gitignore` files. Only
`.env.example` files are committed, and they contain placeholders only. Never commit filled-in
`.env` files, raw admin passwords, or recovery artifacts.

Local development values typically look like this (placeholders, not real credentials):

- `backend/.env`: `CLIENT_URL=http://localhost:5173`, `MOBILE_CLIENT_URL=http://localhost:8081`.
- `admin/.env`: `VITE_API_URL=http://localhost:3000/api`.
- `mobile/.env`: `EXPO_PUBLIC_API_URL=http://localhost:3000/api` (Android emulator:
  `http://10.0.2.2:3000/api`; physical device: your LAN IP or a deployed HTTPS URL).

### 2.2 Admin credentials

The admin console does **not** use Clerk. From `backend/`:

```bash
npm run admin:credentials
```

The script prompts for a password (minimum 5 characters) without echoing it and prints
`ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET`. Put both in `backend/.env` and set `ADMIN_EMAIL`
to the sign-in address. Store only the hash and session secret — never the raw password. Changing
`ADMIN_SESSION_SECRET` signs out all existing admins.

Changing a password in the Clerk dashboard only changes **customer** sign-in. It has no effect on
admin login: regenerate `ADMIN_PASSWORD_HASH` with the script, set it on the API's Vercel project,
and redeploy the API.

### 2.3 PesaPal IPN

Deploy/serve the backend over public HTTPS first, then from `backend/` run:

```bash
npm run pesapal:register-ipn
```

It registers the IPN URL and writes the returned `PESAPAL_IPN_ID` into `backend/.env` without
printing it. The same `PESAPAL_*` values must be added to the backend's Vercel environment settings
for deployed environments; local `.env` values do not reach Vercel.

### 2.4 Seed data (optional)

```bash
cd backend && npm run seed:products
```

### 2.5 Run locally

```bash
# Terminal 1
cd backend && npm run dev        # http://localhost:3000

# Terminal 2
cd admin   && npm run dev        # http://localhost:5173

# Terminal 3
cd mobile  && npm start          # press a / i / w, or scan the QR code
```

From the repo root you can also use `npm run dev:backend`, `npm run dev:admin`, `npm test`,
`npm run lint`, `npm run check`, `npm run build`, and `npm start`.

---

## 3. Environment variable reference

### Backend (`backend/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV`, `PORT` | No | Runtime mode and local port (defaults to `3000`; Vercel supplies its own port). |
| `DB_URL` | **Yes** | MongoDB connection string. Must support transactions. |
| `CLERK_PUBLISHABLE_KEY` | **Yes** | Required by `clerkMiddleware()` even on public routes; use the same publishable key as the storefront. |
| `CLERK_SECRET_KEY` | **Yes** | Verifies customer tokens via `clerkMiddleware`. |
| `ADMIN_EMAIL` | **Yes** | Address allowed to sign in to the admin console. |
| `ADMIN_PASSWORD_HASH` | **Yes** | `scrypt$<salt>$<hash>` produced by `npm run admin:credentials`. |
| `ADMIN_SESSION_SECRET` | **Yes** | HMAC key for signed 12-hour admin tokens. |
| `CLIENT_URL` | **Yes** | Admin console origin; used by CORS and redirects. |
| `MOBILE_CLIENT_URL` | **Yes** | Storefront origin; used by CORS and PesaPal return redirects. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | For uploads | Product image storage. |
| `INNGEST_SIGNING_KEY` | No | Enables Inngest locally; blank disables it. |
| `PESAPAL_ENV` | For payments | `sandbox` or `live`. |
| `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET` | For payments | Server-side PesaPal credentials. |
| `PESAPAL_CURRENCY` | For payments | Defaults to `USD`. |
| `PESAPAL_IPN_URL`, `PESAPAL_CALLBACK_URL` | For payments | Public backend URLs ending in `/api/payment/pesapal/ipn` and `/api/payment/pesapal/callback`. |
| `PESAPAL_IPN_ID` | For payments | ID returned by IPN registration. |
| `PESAPAL_IPN_NOTIFICATION_TYPE` | No | `GET` (default) or `POST` for new IPN registration. |

Public deployed origins are also hard-coded as defaults in `backend/src/config/env.js`
(`DEPLOYED_ADMIN_URL`, `DEPLOYED_STOREFRONT_URL`, `DEPLOYED_API_URL`) so the apps keep working if a
corresponding Vercel variable is missing. These URLs are not secrets.

### Admin (`admin/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend API origin ending in `/api`. Embedded at build time and public. |
| `VITE_SENTRY_DSN` | Optional Sentry DSN for browser error reporting. |

### Storefront (`mobile/.env`)

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Required Clerk publishable key. Public by design. |
| `EXPO_PUBLIC_API_URL` | Required backend API origin ending in `/api`. Public by design. |
| `EXPO_PUBLIC_SENTRY_DSN` | Optional Sentry DSN for native/web error reporting. |

If `EXPO_PUBLIC_API_URL` or `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing, the app fails fast with
an explicit message. `VITE_*` and `EXPO_PUBLIC_*` changes require a rebuild/redeploy.

---

## 4. Backend architecture

Key files under `backend/src/`:

```
config/    env.js, db.js, cloudinary.js, inngest.js
middleware/ auth.middleware.js (customer + admin), multer.middleware.js
models/    User, Product, Cart, Order, Review
routes/    user, product, cart, order, review, payment, admin
controllers/ business logic for each route group
utils/     admin-auth.js, order-pricing.js, pesapal-payment.js, cloudinary-images.js
scripts/   generate-admin-credentials.js, register-pesapal-ipn.js
seeds/     index.js
```

- `server.js` mounts `/api/*` routers, enables a restricted CORS allowlist, adds `clerkMiddleware`,
  and serves the built admin SPA in production when not running on Vercel.
- `config/db.js` caches the Mongoose connection globally so warm serverless invocations reuse one
  pool. `connectDB()` is idempotent and is called per request for Vercel safety.
- Missing required startup variables produce a clear error listing their names.

### API reference

All paths below are relative to the configured API origin (for example `/api/...`).

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | None | Liveness check. |
| `GET` | `/api/products` | None | List products (admin controller). |
| `GET` | `/api/products/:id` | None | Product detail. |
| `POST` | `/api/cart` | Clerk | Add item to server-side cart. |
| `GET` | `/api/cart` | Clerk | Read cart. |
| `PUT` | `/api/cart/:productId` | Clerk | Change quantity. |
| `DELETE` | `/api/cart/:productId` | Clerk | Remove one item. |
| `DELETE` | `/api/cart` | Clerk | Clear cart. |
| `POST` | `/api/orders` | Clerk | Create order from cart. |
| `GET` | `/api/orders` | Clerk | Current user's orders. |
| `GET`, `POST` | `/api/users/addresses` | Clerk | List / create addresses. |
| `PUT`, `DELETE` | `/api/users/addresses/:addressId` | Clerk | Update / delete address. |
| `GET`, `POST` | `/api/users/wishlist` | Clerk | List / add wishlist item. |
| `DELETE` | `/api/users/wishlist/:productId` | Clerk | Remove wishlist item. |
| `POST`, `DELETE` | `/api/reviews` | Clerk | Create / delete review. |
| `POST` | `/api/payment/pesapal/checkout` | Clerk | Start PesaPal checkout. |
| `GET` | `/api/payment/pesapal/status/:merchantReference` | Clerk | Check payment status. |
| `GET` | `/api/payment/pesapal/callback` | None | Browser return from PesaPal. |
| `GET`, `POST` | `/api/payment/pesapal/ipn` | None | Payment confirmation webhook. |
| `POST` | `/api/admin/login` | None | Admin password login; returns signed token. |
| `GET` | `/api/admin/access` | Admin token | Verify admin access. |
| `GET`, `POST` | `/api/admin/products` | Admin token | List / create products (multipart images). |
| `PUT`, `DELETE` | `/api/admin/products/:id` | Admin token | Update / delete product. |
| `GET` | `/api/admin/orders` | Admin token | All orders. |
| `PATCH` | `/api/admin/orders/:orderId/status` | Admin token | Change fulfilment status. |
| `GET` | `/api/admin/customers` | Admin token | Customer list. |
| `GET` | `/api/admin/stats` | Admin token | Dashboard metrics. |
| `GET` | `/api/inngest` | Inngest signature | Inngest function endpoint. |

### Authentication

- **Customers:** Clerk issues a token; `protectRoute` (`requireAuth()` + `getAuth`) verifies it,
  then lazily creates a local `User` document from Clerk profile data. Wishlists, carts, addresses
  and orders reference this local user. Inngest functions keep the local user in sync with
  `clerk/user.created`, `clerk/user.updated`, and `clerk/user.deleted` webhooks.
- **Admins:** `POST /api/admin/login` compares the submitted password to `ADMIN_PASSWORD_HASH`
  using `scrypt` + a timing-safe comparison, then returns an HMAC-signed token (12-hour TTL) keyed
  by `ADMIN_SESSION_SECRET`. Every `/api/admin/*` route except `/login` requires
  `Authorization: Bearer <token>`. Missing backend admin variables yield `503`; invalid tokens
  yield `401`.

### Payment flow

1. Storefront calls `POST /api/payment/pesapal/checkout` with the authenticated server-side cart.
2. Backend computes totals from current product prices, creates a `pending` order, and sends the
   exact amount to PesaPal.
3. PesaPal redirects the browser to the backend `/api/payment/pesapal/callback`, which verifies the
   transaction and redirects to the storefront `/payment/callback` screen.
4. The public IPN endpoint independently confirms payment. Only after checking transaction status,
   merchant reference, currency and amount does the backend mark the order paid, decrement stock,
   and clear the cart — inside a MongoDB transaction for idempotency.
5. `GET /api/payment/pesapal/status/:merchantReference` lets the app refresh the result.

### Data model

- **User** — `clerkId`, email, name, image URL, embedded `addresses`, `wishlist` product refs.
- **Product** — name, description, price, stock, category, Cloudinary image URLs, rating fields.
- **Cart** — one document per user with product/quantity items.
- **Order** — snapshot of items and shipping address, `paymentResult`, `totalPrice`,
  `status` (`pending` → `shipped` → `delivered`), stock-deduction flags, timestamps.
- **Review** — product/user rating and comment; product rating fields are maintained by the
  review controller.

---

## 5. Admin console internals

- Route tree lives in `admin/src/App.jsx`: `/login` plus an authenticated `/` layout with
  `dashboard`, `products`, `orders`, and `customers` children; unknown paths render a 404 page.
- `RequireAuth` checks tab-scoped session state; `AdminArea` then calls `/api/admin/access` before
  rendering the dashboard so a misconfigured backend shows an explicit access-denied/configuration
  page instead of an empty shell.
- Login stores the token and email in `sessionStorage` keys `africart.admin.token` and
  `africart.admin.email`, so the session ends when the tab closes. There is no refresh or backend
  revocation endpoint; signing out clears client state only. Five failed login attempts per email/IP
  in 15 minutes return HTTP 429.
- `src/lib/axios.js` builds the base URL from `VITE_API_URL` and attaches the stored admin bearer
  token. A 401 clears the stored session and redirects to `/login`. TanStack Query caches are
  cleared when the admin session changes. List endpoints accept `page`, `limit` (1–100, default 12),
  `search`, and category/status filters, and return `total`, `page`, and `pages`.
- Product images must be JPEG/PNG/WebP, at most 3 files and 5 MB each; create requires at least one.
  The backend deletes replaced/orphaned Cloudinary assets and removes deleted products from carts
  and wishlists while preserving order snapshots.
- `vercel.json` rewrites all non-asset paths to `index.html` so deep links like `/login` survive a
  refresh.

---

## 6. Storefront internals

- Routes live in `mobile/app/` (route groups `(auth)`, `(tabs)`, `(profile)`); shared code lives in
  `components/`, `hooks/`, `lib/`, and `store/` outside the route tree.
- Root `_layout.tsx` requires `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, wraps the app in
  `ClerkProvider` + `QueryClientProvider`, guards protected screens, and initializes Sentry when a
  DSN is configured. `sendDefaultPii` is disabled.
- Web has dedicated `*.web.tsx` auth screens; native builds use email/password plus social sign-in
  screens and Clerk token caching via `expo-secure-store`.
- `lib/api.ts` injects a fresh Clerk token into each request and treats token failures as
  unauthenticated. Data is cached with TanStack Query and cleared when the signed-in user changes.
- `mobile/app.json` declares the Expo Router, Secure Store, Clerk, Splash Screen and Sentry config
  plugins, `mobile://` scheme, and `com.anonymous.mobile` iOS bundle ID / Android package. Change
  these identifiers before publishing.
- `mobile/vercel.json` exports static web output to `dist/`, disables framework auto-detection,
  and rewrites `/product/:id` to `/product?id=:id` for refreshable product links.

### Native builds

Use `npm run android` / `npm run ios` for local native builds. For cloud builds, use EAS Build and
follow the current Expo documentation for `eas.json`, signing, and submission; there is no
`eas.json` in this repository yet. Always consult the docs matching the installed Expo SDK
(`v54.0.0` for `mobile/`, `v58.0.0` for `santo/`) because Expo APIs change between SDK releases:
<https://docs.expo.dev/versions/v54.0.0/>.

---

## 7. Deployment (Vercel)

Deploy three separate Vercel projects from this repository.

| Project | Root Directory | Preset | Install | Build | Output |
| --- | --- | --- | --- | --- | --- |
| API | `backend` | Express | `npm ci` | default | default |
| Admin | `admin` | Vite | `npm ci` | `npm run build` | `dist` |
| Storefront web | `mobile` | Other / none | `env -u npm_config_cache_dir npm ci` | `npm run build` | `dist` |

Current non-secret production origins (also wired into the Vercel configs and backend defaults):

- API: `https://afri-cart-two.vercel.app`
- Storefront: `https://africart-mobile-five.vercel.app`
- Admin: `https://afri-cart-cfe2.vercel.app`

Set all backend variables in the API project's Vercel environment settings, `VITE_*` in the admin
project, and `EXPO_PUBLIC_*` in the storefront project for each environment you use (Production,
Preview, Development). Redeploy after changing build-time variables. `CLIENT_URL` must be the exact
admin origin and `MOBILE_CLIENT_URL` the exact storefront origin; CORS compares normalized origins.

The API root is `https://afri-cart-two.vercel.app`, but frontends must use the **`/api` suffix** as
their base URL because route files call `/products`, `/cart`, `/admin/login`, etc.

| Vercel project | Wiring that must stay in sync |
| --- | --- |
| `afri-cart` (API) | `CLIENT_URL` = admin origin, `MOBILE_CLIENT_URL` = storefront origin, both Clerk keys, all `CLOUDINARY_*`, and all `PESAPAL_*` including `PESAPAL_IPN_ID`, `PESAPAL_IPN_URL` and `PESAPAL_CALLBACK_URL`. |
| `afri-cart-cfe2` (admin) | `VITE_API_URL=https://afri-cart-two.vercel.app/api` (also pinned by `admin/vercel.json`). The admin console uses the backend admin session, not Clerk, so it needs no Clerk keys. |
| `africart-mobile` (storefront) | `EXPO_PUBLIC_API_URL=https://afri-cart-two.vercel.app/api` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from the same Clerk instance as the API's `CLERK_PUBLISHABLE_KEY`. |

Clerk Dashboard checklist for production:

- Enable **Email address** and **Password** under sign-in/sign-up options.
- Allow the deployed storefront origin and its `/sign-in`, `/sign-up`, and `/payment/callback`
  routes in the Clerk application settings.
- Register the iOS bundle ID / Android package under **Native applications** if shipping native
  builds.

---

## 8. Quality checks

```bash
# Backend unit tests (Node's built-in test runner)
cd backend && npm test

# Admin lint
cd admin && npm run lint

# Storefront lint + TypeScript
cd mobile && npm run lint
cd mobile && npx tsc --noEmit

# Root convenience commands
npm test        # backend tests
npm run lint    # admin lint
npm run check   # admin lint + backend tests
npm run build   # admin production build
```

Backend tests cover admin password hashing/session tokens, order pricing, and PesaPal payment
validation (`backend/src/utils/*.test.js`).

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `Missing required environment variables: ...` on API start | Fill the listed keys in `backend/.env` and restart. Include `CLERK_PUBLISHABLE_KEY`; `clerkMiddleware()` needs it even for public routes. |
| Every API request returns 500 with `Publishable key is missing` | The backend is missing `CLERK_PUBLISHABLE_KEY`. Copy the same value from `mobile/.env` (`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`) into `backend/.env` and restart. |
| Admin shows “Admin login is not configured.” | `ADMIN_EMAIL` / `ADMIN_SESSION_SECRET` missing in the backend environment. |
| Admin shows “Unauthorized - sign in again” | Token expired (12 h) or `ADMIN_SESSION_SECRET` changed; sign in again. |
| Storefront fails immediately on launch | Missing `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` or `EXPO_PUBLIC_API_URL`. |
| CORS errors from the browser | `CLIENT_URL` / `MOBILE_CLIENT_URL` do not exactly match the frontend origin. Local Expo web (`19000`/`19006`), native (`8081`) and Vite (`5173`) origins are allowed in development; redeploy the backend after code changes for hosted apps. |
| Payments never confirm | IPN not registered, `PESAPAL_IPN_ID` missing, backend not public HTTPS, or MongoDB lacks transaction support. |
| Product uploads fail | Cloudinary variables missing/invalid or image violates upload rules (see the admin user guide). |
| Clerk sign-up blocked at registration | Check Clerk sign-in/sign-up options and any country-restriction settings in the Clerk Dashboard. |
| `{santo}` app fails after dependency changes | It is a separate Expo SDK 58 project; install and run it on its own and use SDK 58 docs. |

---

## 10. Security practices

- Keep filled-in `.env` files local. Templates in `.env.example` use placeholders only.
- Backend secrets belong only in `backend/.env` or the backend hosting provider. Do not put them in
  `VITE_*` or `EXPO_PUBLIC_*` variables, client source, or committed docs.
- Admin sessions are HMAC-signed and short-lived; the raw admin password is never stored — only its
  scrypt hash.
- The API restricts CORS to configured origins, disables `x-powered-by`, returns JSON 404s for
  unknown API routes, and reports generic 500 messages to clients while logging details server-side.
- Local recovery artifacts are ignored by the root `.gitignore` (`*recovery-codes*`).
