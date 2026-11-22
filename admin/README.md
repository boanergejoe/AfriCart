# AfriCart Admin Dashboard

The React/Vite admin console for AfriCart. It uses a custom admin password login backed by the
shared Express API, TanStack Query for server state, Tailwind CSS + daisyUI for styling, and the API
in `../backend`. Customer authentication remains in Clerk in the mobile app.

## Setup

1. Copy `.env.example` to `.env` and set:

   - `VITE_API_URL` — backend API origin ending in `/api`.
   - `VITE_SENTRY_DSN` — optional error monitoring DSN.

2. Generate the admin credentials from `../backend`:

   ```bash
   cd ../backend
   npm run admin:credentials
   ```

   Add the printed `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` to `backend/.env`, and set
   `ADMIN_EMAIL` to the sign-in address. Passwords of at least five characters are accepted.

3. Install and run:

   ```bash
   cd ../admin
   npm ci
   npm run dev
   ```

4. The dashboard opens at `http://localhost:5173`. Sign in with the configured admin email and
   password. Sessions are signed, expire after 12 hours, and are stored for the browser tab only.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the production bundle into `dist/`. |
| `npm run preview` | Preview the production bundle locally. |
| `npm run lint` | Run ESLint over the source. |

## Notes

- `VITE_*` variables are embedded at build time and are public. Never put secrets in them.
- Deep links are rewritten to `index.html` by `vercel.json` when deployed to Vercel.
- The dashboard caches admin data with TanStack Query and clears it whenever the admin session
  changes.
- Layouts use the explicit `sm`/`md`/`lg`/`xl` breakpoints; render errors are caught by the root
  error boundary and reported to Sentry when a DSN is configured.
