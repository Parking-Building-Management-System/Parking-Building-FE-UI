# 00 - Current Frontend State

Audit scope: current Next.js frontend source plus existing `docs/`. No application code was changed.

## Stack Snapshot

- Next.js version: `16.2.6` from `package.json`.
- Router: App Router under `src/app`; no `pages/` router found.
- TypeScript: YES, `tsconfig.json`, `.tsx/.ts` source, `typescript ^5`.
- Styling/UI: Tailwind CSS 4, shadcn-style copied UI components in `src/components/ui`, Radix primitives, lucide-react, next-themes.
- State management: Zustand for auth/sidebar, TanStack Query for server state.
- Form library: React Hook Form + Zod + `@hookform/resolvers`.
- API client/fetcher: centralized Axios client in `src/lib/api/axios-config.ts`; service layer under `src/service/**`.
- Auth store/context: Zustand store in `src/stores/use-auth-store.ts`.
- Middleware/route guard: MISSING. No `middleware.ts`; `src/app/(protected)/layout.tsx` renders shell only.
- Layout/sidebar/dashboard: protected shell and sidebar exist in `src/app/(protected)/layout.tsx`, `src/components/layout/sidebar.tsx`; role nav in `src/config/navigation.ts`.
- Env variables: `NEXT_PUBLIC_API_URL` in `src/lib/api/api-url.ts`, fallback `http://localhost:8080`.
- Build/run command: `bun run dev`, `bun run build`, `bun run lint` from `package.json`. Current local verification failed because `eslint` and `next` binaries were not installed/materialized.

## Existing Routes

- `/` -> `src/app/page.tsx`
- `/auth/login` -> `src/app/auth/login/page.tsx`
- `/admin` -> `src/app/(protected)/admin/page.tsx`
- `/admin/tenants` -> `src/app/(protected)/admin/tenants/page.tsx`
- `/admin/master-data` -> `src/app/(protected)/admin/master-data/page.tsx`
- `/manager` -> `src/app/(protected)/manager/page.tsx`
- `/manager/parkings` -> `src/app/(protected)/manager/parkings/page.tsx`
- `/manager/parkings/[id]/topology` -> `src/app/(protected)/manager/parkings/[id]/topology/page.tsx`
- `/manager/slots` -> `src/app/(protected)/manager/slots/page.tsx`
- `/staff` -> `src/app/(protected)/staff/page.tsx`
- `/driver` -> `src/app/(protected)/driver/page.tsx`

## Page API State

Pages connected to API:

- Login: `src/app/auth/login/page.tsx`, `src/service/user/api.ts`.
- Admin dashboard: `src/features/admin/admin-dashboard.tsx`, `src/service/admin/api.ts`.
- Tenant management: `src/features/admin/tenant-management.tsx`, `src/service/admin/api.ts`.
- Master data vehicle types/roles: `src/features/admin/master-data-config.tsx`, `src/service/admin/api.ts`.
- Manager parkings: `src/features/manager/parking-management.tsx`, `src/service/manager/facility-api.ts`.
- Manager parking topology zone create: `src/features/manager/parking-topology.tsx`, `src/service/manager/facility-api.ts`.
- Manager slots list/filter/import/export/bulk status: `src/features/manager/slot-management.tsx`, `src/service/manager/facility-api.ts`.

Mock/static pages:

- `/manager`, `/staff`, `/driver` use `RoleWelcomeCard` placeholder in `src/components/role-welcome-card.tsx`: MOCK_ONLY.
- `/` is marketing landing page in `src/features/landing/**`: STATIC_ONLY.

## Reconciliation Table

| Area                 | Status    | Evidence Files                                                                             | Notes                                                                                           |
| -------------------- | --------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Next.js Router       | DONE      | `package.json`, `src/app/**`                                                               | App Router only.                                                                                |
| Auth Pages           | PARTIAL   | `src/app/auth/login/page.tsx`                                                              | Username/password login exists; no forgot-password page despite link.                           |
| Auth Store           | PARTIAL   | `src/stores/use-auth-store.ts`                                                             | Memory auth state exists; no bootstrap on reload.                                               |
| Route Guard          | MISSING   | `src/app/(protected)/layout.tsx`; no `middleware.ts`                                       | Protected layout has no redirect/RBAC enforcement.                                              |
| API Client           | PARTIAL   | `src/lib/api/axios-config.ts`, `src/lib/api/api-url.ts`                                    | Axios, auth header, refresh retry exist; 403 device UX missing.                                 |
| Role-based Layout    | PARTIAL   | `src/components/layout/sidebar.tsx`, `src/config/navigation.ts`                            | Nav filtered by roles only when user exists; fallback mock SYSTEM_ADMIN leaks admin nav.        |
| System Admin UI      | PARTIAL   | `src/features/admin/admin-dashboard.tsx`                                                   | Dashboard stats/chart API wired.                                                                |
| Tenant Management UI | PARTIAL   | `src/features/admin/tenant-management.tsx`, `docs/frontend-types-contract.md`              | List/create/toggle wired; manager field is email only, not username option.                     |
| Master Data UI       | PARTIAL   | `src/features/admin/master-data-config.tsx`                                                | Vehicle type CRUD wired; roles list only.                                                       |
| Manager Dashboard    | MOCK_ONLY | `src/app/(protected)/manager/page.tsx`, `src/components/role-welcome-card.tsx`             | Placeholder dashboard.                                                                          |
| Facility UI          | PARTIAL   | `src/features/manager/parking-management.tsx`, `src/features/manager/parking-topology.tsx` | Parking list/toggle, topology view, zone create; no parking create/edit, floor CRUD UI missing. |
| Staff UI             | MOCK_ONLY | `src/app/(protected)/staff/page.tsx`                                                       | Placeholder only.                                                                               |
| PWA UI               | MOCK_ONLY | `src/app/(protected)/driver/page.tsx`                                                      | Placeholder, no PWA/lazy auth.                                                                  |
| Device Binding UI    | PARTIAL   | `src/app/auth/login/page.tsx`, `src/lib/auth/device-fingerprint.ts`                        | Login sends fingerprint; unknown-device screen and manager approvals missing.                   |
| Pricing UI           | MISSING   | `src/app/(protected)/manager/**`                                                           | No pricing routes/components/services.                                                          |
| Subscription UI      | MISSING   | `src/app/(protected)/manager/**`, `src/app/(protected)/driver/page.tsx`                    | No subscription UI beyond placeholder driver dashboard.                                         |
| Analytics UI         | PARTIAL   | `src/features/admin/system-traffic-chart.tsx`, `src/features/admin/admin-dashboard.tsx`    | Admin traffic chart only; manager revenue/occupancy missing.                                    |
| Incident UI          | MISSING   | `src/app/(protected)/**`                                                                   | No incident/violation/debt UI.                                                                  |

## Verification

Attempted:

```bash
bun run lint
bun run build
```

Result:

- `bun run lint`: BROKEN in current environment, `eslint: command not found`.
- `bun run build`: BROKEN in current environment, `Script not found "next"`.

Likely cause: dependencies are not installed/materialized despite `bun.lock` and `package.json`.
