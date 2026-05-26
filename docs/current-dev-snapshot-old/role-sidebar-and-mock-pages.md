# Role Sidebar and Mock Pages Snapshot

## Files Changed

- `src/config/navigation.ts`
- `src/components/layout/sidebar.tsx`
- `src/components/mock-module-page.tsx`
- `src/config/mock-pages.ts`
- `src/app/(protected)/admin/**/page.tsx`
- `src/app/(protected)/manager/**/page.tsx`
- `src/app/(protected)/staff/**/page.tsx`
- `docs/current-dev-snapshot/role-sidebar-and-mock-pages.md`

## Sidebar Behavior

- Sidebar content is still role-based and derived from `user.roles`.
- Nested module groups are rendered for System Admin and Parking Manager.
- Collapsed sidebar shows parent module icons only.
- Expanded sidebar shows parent module groups plus child links.
- Every sidebar route now has a matching `page.tsx`, so sidebar clicks should not 404.

## Final Route Map

| Role            | Route                                     | Page Status | Notes                                                                              |
| --------------- | ----------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| SYSTEM_ADMIN    | `/admin`                                  | REAL        | Existing Admin dashboard API page.                                                 |
| SYSTEM_ADMIN    | `/admin/tenants`                          | REAL        | Existing tenant list/create dialog/toggle page.                                    |
| SYSTEM_ADMIN    | `/admin/tenants/new`                      | MOCK        | Dedicated create tenant page placeholder.                                          |
| SYSTEM_ADMIN    | `/admin/master-data`                      | REAL        | Existing master data tabs.                                                         |
| SYSTEM_ADMIN    | `/admin/master-data/vehicle-types`        | REAL        | Wrapper to existing master data component.                                         |
| SYSTEM_ADMIN    | `/admin/master-data/roles`                | REAL        | Wrapper to existing master data component.                                         |
| SYSTEM_ADMIN    | `/admin/system-health`                    | MOCK        | API pending.                                                                       |
| SYSTEM_ADMIN    | `/admin/system-health/api`                | MOCK        | API pending.                                                                       |
| SYSTEM_ADMIN    | `/admin/system-health/traffic`            | MOCK        | API pending.                                                                       |
| SYSTEM_ADMIN    | `/admin/audit`                            | MOCK        | API pending.                                                                       |
| SYSTEM_ADMIN    | `/admin/audit/logs`                       | MOCK        | API pending.                                                                       |
| SYSTEM_ADMIN    | `/admin/audit/sessions`                   | MOCK        | API pending.                                                                       |
| SYSTEM_ADMIN    | `/admin/settings`                         | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager`                                | MOCK        | Existing manager dashboard placeholder.                                            |
| PARKING_MANAGER | `/manager/facility`                       | MOCK        | Facility overview API pending.                                                     |
| PARKING_MANAGER | `/manager/facility/parkings`              | REAL        | Wrapper to existing `ParkingManagement`.                                           |
| PARKING_MANAGER | `/manager/facility/floors`                | MOCK        | API functions exist, dedicated UI pending.                                         |
| PARKING_MANAGER | `/manager/facility/zones`                 | MOCK        | API functions exist, dedicated UI pending.                                         |
| PARKING_MANAGER | `/manager/facility/slots`                 | REAL        | Wrapper to existing `SlotManagement`.                                              |
| PARKING_MANAGER | `/manager/facility/slots/import`          | MOCK        | Dedicated import/export page pending; current slot page has import/export buttons. |
| PARKING_MANAGER | `/manager/facility/rfid-cards`            | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/staff-devices`                  | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/staff-devices/staff`            | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/staff-devices/kiosks`           | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/staff-devices/device-approvals` | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/staff-devices/kill-switch`      | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/operations`                     | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/operations/live-monitor`        | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/operations/sessions`            | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/operations/logs`                | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/operations/exceptions`          | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/pricing`                        | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/pricing/time-rules`             | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/pricing/matrix`                 | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/pricing/subscriptions`          | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/pricing/invoices`               | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/pricing/debts`                  | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/incidents`                      | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/incidents/logs`                 | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/incidents/zone-violations`      | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/incidents/red-flags`            | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/analytics`                      | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/analytics/revenue`              | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/analytics/occupancy`            | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/analytics/traffic-heatmap`      | MOCK        | API pending.                                                                       |
| PARKING_MANAGER | `/manager/settings`                       | MOCK        | API pending.                                                                       |
| STAFF           | `/staff`                                  | REAL        | Existing staff entry check-in page.                                                |
| STAFF           | `/staff/exit`                             | MOCK        | API pending.                                                                       |
| STAFF           | `/staff/live-monitor`                     | MOCK        | API pending.                                                                       |
| STAFF           | `/staff/exceptions`                       | MOCK        | API pending.                                                                       |
| STAFF           | `/staff/shift-handover`                   | MOCK        | API pending.                                                                       |

## Routes Still Needing Backend API

- System Health: `/admin/system-health/**`
- Audit & Security: `/admin/audit/**`
- Dedicated tenant creation page: `/admin/tenants/new`
- Manager facility floors/zones dedicated pages.
- RFID card inventory.
- Staff accounts, kiosks, device approvals, kill switch.
- Manager operations live monitor, sessions, logs, exceptions.
- Pricing, billing, subscriptions, invoices, debts.
- Incidents, zone violations, red-flag action audit.
- Manager analytics revenue, occupancy, and traffic heatmap.
- Staff exit cashier, live monitor, exceptions, shift handover.

## Real Pages Preserved

- `/admin`
- `/admin/tenants`
- `/admin/master-data`
- `/manager/parkings`
- `/manager/slots`
- `/manager/facility/parkings`
- `/manager/facility/slots`
- `/staff`

Existing legacy routes `/manager/parkings` and `/manager/slots` remain available. The expanded sidebar now points to `/manager/facility/parkings` and `/manager/facility/slots`, which wrap the same working components.
