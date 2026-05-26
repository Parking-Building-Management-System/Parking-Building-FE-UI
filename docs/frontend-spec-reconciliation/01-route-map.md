# 01 - Route Map

Status values used: DONE, PARTIAL, MOCK_ONLY, STATIC_ONLY, MISSING, BROKEN, UNCLEAR.

## Public/Auth Routes

| Route              | Page File                     | Layout               | Role Intended                                      | Auth Required | API Used                           | Status      | Notes                                                                      |
| ------------------ | ----------------------------- | -------------------- | -------------------------------------------------- | ------------- | ---------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `/`                | `src/app/page.tsx`            | `src/app/layout.tsx` | Public                                             | No            | None                               | STATIC_ONLY | Landing page from `src/features/landing/**`.                               |
| `/auth/login`      | `src/app/auth/login/page.tsx` | `src/app/layout.tsx` | SYSTEM_ADMIN, PARKING_MANAGER, STAFF, PARKING_USER | No            | `POST /auth/login`, `GET /auth/me` | PARTIAL     | Real login API, role redirect, device fingerprint. No unknown-device flow. |
| `/forgot-password` | MISSING                       | MISSING              | Public                                             | No            | MISSING                            | BROKEN      | Login page links to it, but no route file exists.                          |
| `/terms`           | MISSING                       | MISSING              | Public                                             | No            | MISSING                            | BROKEN      | Login page links to it, but no route file exists.                          |
| `/privacy`         | MISSING                       | MISSING              | Public                                             | No            | MISSING                            | BROKEN      | Login page links to it, but no route file exists.                          |

## System Admin Routes

| Route                | Page File                                        | Layout                           | Role Intended | Auth Required              | API Used                        | Status  | Notes                                     |
| -------------------- | ------------------------------------------------ | -------------------------------- | ------------- | -------------------------- | ------------------------------- | ------- | ----------------------------------------- |
| `/admin`             | `src/app/(protected)/admin/page.tsx`             | `src/app/(protected)/layout.tsx` | SYSTEM_ADMIN  | Intended yes, not enforced | `GET /admin/dashboard/stats`    | PARTIAL | Dashboard wired, but route guard MISSING. |
| `/admin/tenants`     | `src/app/(protected)/admin/tenants/page.tsx`     | `src/app/(protected)/layout.tsx` | SYSTEM_ADMIN  | Intended yes, not enforced | `GET/POST/PATCH /admin/tenants` | PARTIAL | List/create/status toggle wired.          |
| `/admin/master-data` | `src/app/(protected)/admin/master-data/page.tsx` | `src/app/(protected)/layout.tsx` | SYSTEM_ADMIN  | Intended yes, not enforced | Vehicle type CRUD, roles list   | PARTIAL | Roles are list-only.                      |

## Manager Routes

| Route                             | Page File                                                     | Layout                           | Role Intended   | Auth Required              | API Used                                                                                                                | Status    | Notes                                                                     |
| --------------------------------- | ------------------------------------------------------------- | -------------------------------- | --------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------- |
| `/manager`                        | `src/app/(protected)/manager/page.tsx`                        | `src/app/(protected)/layout.tsx` | PARKING_MANAGER | Intended yes, not enforced | None                                                                                                                    | MOCK_ONLY | `RoleWelcomeCard` placeholder.                                            |
| `/manager/parkings`               | `src/app/(protected)/manager/parkings/page.tsx`               | `src/app/(protected)/layout.tsx` | PARKING_MANAGER | Intended yes, not enforced | `GET /manager/parkings`, `PATCH /manager/parkings/{id}/status`                                                          | PARTIAL   | List/toggle/topology link; no create/edit.                                |
| `/manager/parkings/[id]/topology` | `src/app/(protected)/manager/parkings/[id]/topology/page.tsx` | `src/app/(protected)/layout.tsx` | PARKING_MANAGER | Intended yes, not enforced | `GET /manager/parkings/{id}/topology`, `POST /manager/floors/{floorId}/zones`, `GET /manager/master-data/vehicle-types` | PARTIAL   | Topology view and zone create only; floor CRUD missing.                   |
| `/manager/slots`                  | `src/app/(protected)/manager/slots/page.tsx`                  | `src/app/(protected)/layout.tsx` | PARKING_MANAGER | Intended yes, not enforced | `GET /manager/slots`, `PATCH /manager/slots/bulk-status`, `POST /manager/slots/import`, `GET /manager/slots/export`     | PARTIAL   | Table/filter/import/export/bulk status wired; no create/edit single slot. |

## Staff Routes

| Route            | Page File                            | Layout                                   | Role Intended | Auth Required              | API Used | Status    | Notes                                  |
| ---------------- | ------------------------------------ | ---------------------------------------- | ------------- | -------------------------- | -------- | --------- | -------------------------------------- |
| `/staff`         | `src/app/(protected)/staff/page.tsx` | `src/app/(protected)/layout.tsx`         | STAFF         | Intended yes, not enforced | None     | MOCK_ONLY | Placeholder only.                      |
| `/staff/devices` | MISSING                              | `src/config/navigation.ts` references it | STAFF         | Intended yes               | MISSING  | BROKEN    | Sidebar config links to missing route. |

## User/PWA Routes

| Route     | Page File                             | Layout                           | Role Intended | Auth Required              | API Used | Status    | Notes                                                     |
| --------- | ------------------------------------- | -------------------------------- | ------------- | -------------------------- | -------- | --------- | --------------------------------------------------------- |
| `/driver` | `src/app/(protected)/driver/page.tsx` | `src/app/(protected)/layout.tsx` | PARKING_USER  | Intended yes, not enforced | None     | MOCK_ONLY | Placeholder; no PWA, active session, checkout, lazy auth. |

## Shared/Error Routes

| Route                      | Page File | Layout  | Role Intended         | Auth Required | API Used | Status  | Notes                                             |
| -------------------------- | --------- | ------- | --------------------- | ------------- | -------- | ------- | ------------------------------------------------- |
| `not-found`                | MISSING   | MISSING | Shared                | No            | None     | MISSING | No custom 404.                                    |
| `error`                    | MISSING   | MISSING | Shared                | No            | None     | MISSING | No route-level error boundary.                    |
| `/auth/device-not-trusted` | MISSING   | MISSING | STAFF/PARKING_MANAGER | No            | MISSING  | MISSING | Required by device binding spec, not implemented. |
| `/403`                     | MISSING   | MISSING | Shared                | No            | None     | MISSING | 403 errors become toast only via API client.      |
