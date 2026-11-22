# AfriCart Mobile

The AfriCart storefront for Android, iOS, and web, built with Expo Router, Clerk, Nativewind, and
TanStack Query. It talks to the shared Express API in `../backend`.

## Setup

1. Copy `.env.example` to `.env` and set:

   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key.
   - `EXPO_PUBLIC_API_URL` — backend API origin ending in `/api`. Use an address reachable from the
     device: `http://10.0.2.2:3000/api` for the Android emulator, your computer's LAN IP for a
     physical phone, or a deployed HTTPS URL for production.
   - `EXPO_PUBLIC_SENTRY_DSN` — optional error-monitoring DSN.

2. Install and start:

   ```bash
   npm ci
   npm start
   ```

   Press `a`, `i`, or `w` to open on Android, iOS, or web. Use `npm run android` or `npm run ios`
   for a native development build.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo development server. |
| `npm run android` / `npm run ios` | Run a native development build. |
| `npm run web` | Start the web app. |
| `npm run build` | Export the static web app to `dist/` (used by Vercel). |
| `npm run lint` | Run ESLint over the source. |
| `npx tsc --noEmit` | Type-check the TypeScript source. |

## Notes

- `EXPO_PUBLIC_*` variables are bundled into the app and are public. Never put backend secrets in
  them; PesaPal and Cloudinary credentials stay in `backend/.env`.
- Authentication is handled by Clerk. The root layout guards protected screens and the shared API
  client attaches a fresh Clerk token to every request. Cache data is cleared when the signed-in
  user changes.
- On web, `app/(auth)/index.web.tsx` renders Clerk's sign-in-or-up component, so customers can
  create an email/password account or use a configured social provider. Enable email/password in the
  Clerk Dashboard. Native builds keep the Google/Apple sign-in screen.
- Vercel rewrites `/product/<id>` to the static `/product` page with the ID as a query parameter, so
  refreshing a product link works on the static site. PesaPal callbacks return to
  `app/payment/callback.tsx` through the backend redirect.
- Product images are uploaded by the admin dashboard to Cloudinary; the mobile app loads the
  returned URLs.
- Responsive widths and column counts are centralized in `lib/theme.js` and exposed through
  `hooks/useBreakpoints.ts`. Render errors are caught by `components/AppErrorBoundary.tsx` and
  reported to Sentry when a DSN is configured.
