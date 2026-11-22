# AfriCart Admin Dashboard

The React/Vite admin console for AfriCart. It uses Clerk for authentication, TanStack Query for
server state, Tailwind CSS + daisyUI for styling, and the shared Express API in `../backend`.

## Setup

1. Copy `.env.example` to `.env` and set:

   - `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key.
   - `VITE_API_URL` — backend API origin ending in `/api`.
   - `VITE_SENTRY_DSN` — optional error monitoring DSN.

2. Install and run:

   ```bash
   npm ci
   npm run dev
   ```

3. The dashboard opens at `http://localhost:5173`. Sign in with the Clerk account whose email
   matches the backend `ADMIN_EMAIL`; all other signed-in users see an access-denied screen.

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
- The dashboard caches admin data with TanStack Query and clears it whenever the signed-in user
  changes.
- Layouts use the explicit `sm`/`md`/`lg`/`xl` breakpoints; render errors are caught by the root
  error boundary and reported to Sentry when a DSN is configured.
