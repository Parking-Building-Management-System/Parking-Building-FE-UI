# 05 - CRUD First Phase UI Scope

The first implementation phase should avoid operational cashier/payment/PWA complexity. Build foundation and tenant-scoped CRUD surfaces first.

## PHASE 1A - SYSTEM_ADMIN

| Priority | UI Page/Component         | Route                          | Role         | API Needed                                                  | Existing Code                                                            | FE Value                              | Complexity | Notes                                           |
| -------- | ------------------------- | ------------------------------ | ------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------- | ---------- | ----------------------------------------------- |
| P0       | Auth guard/bootstrap      | `(protected)` layout/providers | All roles    | `/auth/refresh`, `/auth/me`                                 | Partial in `src/lib/api/axios-config.ts`, `src/stores/use-auth-store.ts` | Prevents misleading protected screens | M          | Must not break current login/session.           |
| P1       | Admin dashboard stats     | `/admin`                       | SYSTEM_ADMIN | `GET /admin/dashboard/stats`                                | Exists                                                                   | Executive SaaS overview               | S          | Polish only unless contract changes.            |
| P1       | Tenant list/create/toggle | `/admin/tenants`               | SYSTEM_ADMIN | Existing admin tenant endpoints                             | Exists                                                                   | Tenant onboarding                     | S          | Add username only after owner/backend confirms. |
| P1       | Vehicle type CRUD         | `/admin/master-data`           | SYSTEM_ADMIN | Existing vehicle endpoints                                  | Exists                                                                   | Pricing/facility prerequisite         | S          | Already best candidate to stabilize first.      |
| P2       | Role/permission list      | `/admin/master-data`           | SYSTEM_ADMIN | `GET /admin/master-data/roles`; permission endpoint unclear | Roles list exists                                                        | RBAC visibility                       | M          | Editing should wait for backend contract.       |

## PHASE 1B - PARKING_MANAGER Facility

| Priority | UI Page/Component            | Route                             | Role            | API Needed                          | Existing Code          | FE Value                | Complexity | Notes                                        |
| -------- | ---------------------------- | --------------------------------- | --------------- | ----------------------------------- | ---------------------- | ----------------------- | ---------- | -------------------------------------------- |
| P1       | Manager dashboard shell      | `/manager`                        | PARKING_MANAGER | Optional stats API                  | Placeholder            | Gives tenant home       | S          | Can be API-ready with empty widgets.         |
| P1       | Parking list/toggle          | `/manager/parkings`               | PARKING_MANAGER | Existing list/toggle                | Exists                 | Facility inventory      | S          | Create/edit missing in backend docs.         |
| P1       | Floor CRUD                   | `/manager/parkings/[id]/topology` | PARKING_MANAGER | Existing floor APIs                 | API exists, UI missing | Required hierarchy CRUD | M          | Use topology page or dedicated floor panel.  |
| P1       | Zone CRUD                    | `/manager/parkings/[id]/topology` | PARKING_MANAGER | Existing zone APIs                  | Create exists          | Required hierarchy CRUD | M          | Add edit/delete before visual mapping.       |
| P1       | Slot table/search/filter     | `/manager/slots`                  | PARKING_MANAGER | Existing slot list                  | Exists                 | Slot operations         | S          | Keep table-first.                            |
| P2       | Slot CRUD                    | `/manager/slots`                  | PARKING_MANAGER | Single create/update/delete unclear | List/bulk only         | Full slot maintenance   | M          | Wait if backend lacks single slot endpoints. |
| P2       | Slot bulk import placeholder | `/manager/slots`                  | PARKING_MANAGER | Existing import/export              | Exists                 | Fast setup              | S          | Add template/error clarity.                  |

## PHASE 1C - Staff Account/Device Basics

| Priority | UI Page/Component               | Route                                   | Role            | API Needed                  | Existing Code | FE Value                | Complexity | Notes                                                               |
| -------- | ------------------------------- | --------------------------------------- | --------------- | --------------------------- | ------------- | ----------------------- | ---------- | ------------------------------------------------------------------- |
| P1       | Staff list/create/toggle active | `/manager/staff`                        | PARKING_MANAGER | Staff CRUD                  | MISSING       | Operator onboarding     | M          | Must use internal username, not personal email by default.          |
| P1       | Red flag permission toggles     | `/manager/staff`                        | PARKING_MANAGER | Staff permission DTO        | MISSING       | Controls risky actions  | M          | Flags: emergency open, edit plate, cancel ticket, view shift money. |
| P1       | Device pending request list     | `/manager/device-approvals`             | PARKING_MANAGER | Pending device APIs         | MISSING       | Trusted device workflow | M          | Needed for unknown-device login flow.                               |
| P1       | Approve/reject device request   | `/manager/device-approvals`             | PARKING_MANAGER | Approve 8h/reject endpoints | MISSING       | Staff unblock path      | M          | Temporary approval duration must be backend-owned.                  |
| P1       | Revoke device                   | `/manager/kiosks` or `/manager/devices` | PARKING_MANAGER | Device revoke API           | MISSING       | Security operations     | M          | Pair with audit trail later.                                        |
| P1       | Kill switch/inactive staff      | `/manager/staff`                        | PARKING_MANAGER | Inactivate/kill endpoint    | MISSING       | Emergency control       | S/M        | Clarify if logout all sessions needed.                              |

## Conclusions

UI to do first:

1. PHASE_0_FOUNDATION: auth bootstrap, protected route guard, role guard, logout UI, remove sidebar mock admin fallback.
2. Finish System Admin CRUD already present: tenant and vehicle type stability.
3. Complete Manager facility table CRUD: floor/zone edit/delete, slot table gaps.
4. Add Staff/device basics only after backend endpoints are clear.

UI not to do immediately:

- Staff entry/exit, QR/payment, PWA checkout, pricing engine UI, visual floor mapping, drag/drop slot map.

UI that must wait for backend:

- Staff CRUD/red flags, device approval/revoke, pricing/subscription, incident/violation/debt, PWA lazy auth/session.

UI that can be mocked first:

- Manager dashboard shell widgets.
- Slot import template/help states.
- Staff entry/exit shell only if clearly marked MOCK_ONLY/API-ready.

UI that needs design/layout decision first:

- Shared role dashboard shell, staff kiosk desktop UX, PWA mobile layout, table/form/modal conventions.
