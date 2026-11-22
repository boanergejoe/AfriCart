<h1 align="center">✨ AfriCart — Full-Stack E-Commerce (Mobile + Admin + API) ✨</h1>

![Demo App](/admin/public/screenshot-for-readme.png)

✨ **Highlights:**

- 📱 AfriCart mobile storefront (React Native + Expo)
- 🔐 Secure Authentication with Clerk (Google & Apple sign-in)
- 🛒 Cart, Favorites, Checkout & Orders Flow
- 💳 PesaPal API checkout with IPN-based payment confirmation
- 🗺️ Addresses System
- 🏪 Admin Dashboard — Products, Orders, Customers & Stats
- ⚙️ Complete REST API (Node.js + Express) with Auth & Roles
- 🛂 Admin-Only Protected Routes
- 📦 Background Jobs with Inngest
- 🧭 Dashboard with Live Analytics
- 🛠️ Product Management (CRUD, image handling, pricing, etc.)
- 📦 Order Management
- 👥 Customer Management Page
- 🛡️ Sentry Integration for monitoring & error tracking
- 🚀 Deployable on Vercel (API + Admin Dashboard)
- 🖼️ Product Image Slider
- ⚡ Data Fetching & Caching with TanStack Query
- 🧰 End-to-End Git & GitHub Workflow (branches, commits, PRs, code reviews)
- 🤖 CodeRabbit PR Analysis (security, quality, optimization)

---

### Automated PesaPal checkout

Checkout uses the authenticated user's server-side cart and product prices. The backend computes
the total in cents, creates a pending order, and submits that exact amount to PesaPal. AfriCart
marks it paid, decrements stock, and clears the cart only after independently checking the
transaction status, merchant reference, currency, and amount with PesaPal. The browser return page
is for the customer; the public IPN endpoint is what allows confirmation even if the customer
closes the page.

Add these values to `backend/.env` only; never put the consumer secret in the mobile app:

```bash
PESAPAL_ENV=sandbox
PESAPAL_CONSUMER_KEY=<YOUR_PESAPAL_CONSUMER_KEY>
PESAPAL_CONSUMER_SECRET=<YOUR_PESAPAL_CONSUMER_SECRET>
PESAPAL_CURRENCY=USD
PESAPAL_IPN_URL=https://<public-backend-domain>/api/payment/pesapal/ipn
PESAPAL_IPN_ID=<REGISTERED_IPN_ID>
PESAPAL_CALLBACK_URL=https://<public-backend-domain>/api/payment/pesapal/callback
```

Deploy the backend with a public HTTPS URL before registering the IPN. The browser callback is
served by the backend, while the public IPN endpoint confirms payments when customers close the
browser. Run `npm run pesapal:register-ipn` from `backend/`; it registers the IPN and saves the
returned ID directly to `backend/.env` without printing it. Use PesaPal sandbox credentials for
testing and switch to live credentials only when ready for real charges. The backend uses MongoDB
transactions for idempotent payment, stock, and cart updates, so the database must support
transactions (MongoDB Atlas does). Set `MOBILE_CLIENT_URL` to the customer-facing mobile web
origin so its API requests pass CORS.

For a Vercel-hosted backend, add the same `PESAPAL_*` values to the Vercel project's server-side
environment settings and redeploy; local `backend/.env` values do not automatically reach Vercel.
Never add consumer credentials to `EXPO_PUBLIC_*` variables.

---

## 🧪 `.env` Setup

### 🟦 Backend (`/backend`)

```bash
NODE_ENV=development
PORT=3000

DB_URL=<YOUR_DB_URL>

CLERK_PUBLISHABLE_KEY=<YOUR_CLERK_PUBLISHABLE_KEY>
CLERK_SECRET_KEY=<YOUR_CLERK_SECRET_KEY>

INNGEST_SIGNING_KEY=<YOUR_INNGEST_SIGNING_KEY>

CLOUDINARY_API_KEY=<YOUR_CLOUDINARY_API_KEY>
CLOUDINARY_API_SECRET=<YOUR_CLOUDINARY_API_SECRET>
CLOUDINARY_CLOUD_NAME=<YOUR_CLOUDINARY_CLOUD_NAME>

ADMIN_EMAIL=<YOUR_ADMIN_EMAIL>

CLIENT_URL=http://localhost:5173
MOBILE_CLIENT_URL=https://<public-mobile-web-domain>

# PesaPal API checkout (credentials stay on the backend)
PESAPAL_ENV=sandbox
PESAPAL_CONSUMER_KEY=<YOUR_PESAPAL_CONSUMER_KEY>
PESAPAL_CONSUMER_SECRET=<YOUR_PESAPAL_CONSUMER_SECRET>
PESAPAL_CURRENCY=USD
PESAPAL_IPN_URL=https://<public-backend-domain>/api/payment/pesapal/ipn
PESAPAL_IPN_ID=<REGISTERED_IPN_ID>
PESAPAL_CALLBACK_URL=https://<public-backend-domain>/api/payment/pesapal/callback

# Optional Stripe API integration
STRIPE_PUBLISHABLE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>
STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>
```

---

### 🟩 Admin Dashboard (/admin)

```bash
VITE_CLERK_PUBLISHABLE_KEY=<YOUR_CLERK_PUBLISHABLE_KEY>
VITE_API_URL=http://localhost:3000/api

VITE_SENTRY_DSN=<YOUR_SENTRY_DSN>
```

---

### 🟧 Mobile App (/mobile)

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<YOUR_CLERK_PUBLISHABLE_KEY>
EXPO_PUBLIC_API_URL=https://<public-backend-domain>/api

SENTRY_AUTH_TOKEN=<YOUR_SENTRY_DSN>
```

For local development, use a backend URL reachable from the device (for example
`http://10.0.2.2:3000/api` on the Android emulator); a physical phone needs your computer's LAN IP
or a deployed HTTPS backend.

## 🚀 Deploy on Vercel

Deploy the backend and admin as **two separate Vercel projects** from this repository. The backend
is an Express app (`backend/src/server.js`); Vercel detects and serves it as an Express deployment.
The admin is a Vite single-page app. No Vercel-specific runtime dependency or custom backend build
command is required.

### Backend API project

1. Import the repository as a new Vercel project.
2. Set **Root Directory** to `backend` and leave the Framework Preset on **Express** (auto-detected).
3. Use `npm ci` as the Install Command. Leave Build Command and Output Directory at their defaults.
4. Add the backend variables described in [Backend environment variables](#backend-environment-variables)
   to Vercel Project Settings. Set `CLIENT_URL` to the deployed admin origin and, when applicable,
   `MOBILE_CLIENT_URL` to the mobile web app origin.
5. Deploy and copy the backend deployment URL.

### Admin dashboard project

1. Import the same repository as another Vercel project.
2. Set **Root Directory** to `admin` and Framework Preset to **Vite**.
3. Use `npm ci` as the Install Command, `npm run build` as the Build Command, and `dist` as the
   Output Directory.
4. Add these environment variables in Project Settings:

   - `VITE_CLERK_PUBLISHABLE_KEY` — the Clerk publishable key.
   - `VITE_API_URL` — the backend URL followed by `/api`, for example
     `https://<backend-project>.vercel.app/api`.
   - `VITE_SENTRY_DSN` — optional Sentry DSN.

5. Deploy. The [admin Vercel config](admin/vercel.json) rewrites browser routes to the Vite entry
   point so routes such as `/login` and `/orders` work when opened directly or refreshed.

Add the environment variables to the Vercel environments where they are needed (Production,
Preview, and Development), then redeploy after changing them. Vite variables are embedded at build
time.

### Backend environment variables

Configure these in the backend project's Vercel settings. Do not commit credentials or put backend
secrets in `VITE_*` variables.

- Required for the API: `DB_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ADMIN_EMAIL`,
  `CLIENT_URL`, and `MOBILE_CLIENT_URL` if the mobile app calls the API.
- For Inngest: `INNGEST_SIGNING_KEY`.
- For product image uploads: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
  `CLOUDINARY_API_SECRET`.
- For Stripe: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` when Stripe is enabled.
- For PesaPal: `PESAPAL_ENV`, `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`,
  `PESAPAL_CURRENCY`, `PESAPAL_IPN_URL`, `PESAPAL_IPN_ID`, and `PESAPAL_CALLBACK_URL`.

Use the backend deployment origin in `PESAPAL_IPN_URL`, ending in
`/api/payment/pesapal/ipn`. `PESAPAL_CALLBACK_URL` must be the public mobile web callback URL.
MongoDB transactions require a replica set (MongoDB Atlas is suitable). Vercel provides `PORT`;
do not configure it manually.

---

## 🔧 Run the Backend

```bash
cd backend
npm ci
npm run dev
```

---

## 🔧 Run the Admin

```bash
cd admin
npm ci
npm run dev
```

---

## 🔧 Run the Mobile

```
bash
cd mobile
npm ci
npx expo start
```

Then scan the QR code from your phone.
