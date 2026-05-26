# Auth Logout and Role Sidebar Snapshot

## Files Changed

- `src/lib/auth/role-routing.ts`
- `src/components/auth/auth-bootstrap.tsx`
- `src/app/providers.tsx`
- `src/app/auth/login/page.tsx`
- `src/app/(protected)/layout.tsx`
- `src/components/layout/sidebar.tsx`
- `src/config/navigation.ts`
- `docs/current-dev-snapshot/auth-logout-role-sidebar.md`

Related existing auth files reviewed:

- `src/stores/use-auth-store.ts`
- `src/service/user/api.ts`
- `src/service/user/type.ts`
- `src/lib/api/axios-config.ts`

## Auth Storage hiện tại

- Access token is stored in Zustand memory as `jwtToken` in `src/stores/use-auth-store.ts`.
- Current user is stored in Zustand memory as `user`.
- Auth status is tracked by `isAuthenticated` and `isCheckingAuth`.
- Refresh token is not stored in frontend state. Current convention expects backend HttpOnly cookie because `apiClient` and `refreshApi()` use `withCredentials: true`.
- Device fingerprint/label remain stored in browser `localStorage` by `src/lib/auth/device-fingerprint.ts`; this snapshot did not change device storage.

## `/auth/me` Usage

- Login flow calls `/auth/me` after `POST /auth/login` in `src/app/auth/login/page.tsx`.
- Auth bootstrap now calls `POST /auth/refresh`, sets the refreshed access token, then calls `/auth/me` to restore current user on reload.

## Logout Flow

Sidebar logout button:

1. Calls `logoutApi()` from `src/service/user/api.ts`.
2. `logoutApi()` calls `POST /auth/logout` through the existing `apiClient`.
3. If logout API succeeds, a success toast is shown.
4. If logout API fails or the token/session is already invalid, the frontend still clears local auth state.
5. `clearAuth()` removes current user and access token from Zustand.
6. User is redirected to `/auth/login`.

## Sidebar Role Map

Sidebar items are generated from `user.roles` only. The previous mock fallback `SYSTEM_ADMIN` role has been removed.

| Role              | Sidebar Items                                   |
| ----------------- | ----------------------------------------------- |
| `SYSTEM_ADMIN`    | Dashboard, Tenants, Master Data                 |
| `PARKING_MANAGER` | Dashboard, Facility / Parkings, Slots           |
| `STAFF`           | Entry / Staff Operations                        |
| `PARKING_USER`    | No desktop dashboard sidebar currently rendered |

Routes that do not exist are intentionally not shown. Examples: Settings, Pricing, Staff & Devices, Exit, Shift.

## Route Guard Behavior

Protected layout now checks auth and role before rendering protected children.

| Route Prefix | Allowed Role      |
| ------------ | ----------------- |
| `/admin`     | `SYSTEM_ADMIN`    |
| `/manager`   | `PARKING_MANAGER` |
| `/staff`     | `STAFF`           |
| `/driver`    | `PARKING_USER`    |

Behavior:

- While auth bootstrap is running, protected routes show `Checking session...`.
- If user is not authenticated, protected routes redirect to `/auth/login`.
- If user is authenticated but lacks the required role, the app redirects to the user's default dashboard route.
- Staff cannot open `/admin` or `/manager` directly by URL.
- Manager cannot open `/admin` directly by URL.

## Known Limitations

- There is no dedicated forbidden page yet; wrong-role access redirects to the user's default dashboard.
- Auth bootstrap restores session from refresh cookie, but login page itself does not yet auto-redirect an already-authenticated user away from `/auth/login`.
- `PARKING_USER`/PWA does not use the desktop sidebar, so logout for future PWA/mobile layout still needs a role-specific location.
- Route guard is frontend UX only. Backend must still enforce JWT, roles, permissions, tenant, and trusted device checks.
