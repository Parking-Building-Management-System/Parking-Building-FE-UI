# Frontend Dashboard Navigation Polish Snapshot

## Scope

- Fixed Vehicle Type delete refresh behavior without changing backend contracts.
- Normalized sidebar active route matching so leaf links are exact and parent groups are expansion context only.
- Redesigned `/admin` as a SaaS Global Dashboard.
- Redesigned `/manager` as a Parking Manager operations dashboard.

## Vehicle Type Delete Fix

- File: `src/features/admin/master-data-config.tsx`
- Delete now uses TanStack Query optimistic cache removal for `adminQueryKeys.vehicleTypes`.
- The mutation cancels the current vehicle type query, removes the deleted item from cached list data immediately, restores the previous list on error, and invalidates the vehicle type query after success.
- Existing delete loading state and Sonner success/error toast behavior are preserved.
- Backend endpoint and payload contract are unchanged: `DELETE /admin/master-data/vehicle-types/{id}`.

## Sidebar Active Matching Rule

- File: `src/components/layout/sidebar.tsx`
- Leaf item active rule: `pathname === item.href`.
- Parent group expanded/context rule: `pathname === item.href || pathname.startsWith(item.href + '/')`.
- Parent group triggers no longer receive the active background for every descendant route.
- Child links use exact matching only, so routes such as `/manager/facility` and `/manager/facility/parkings` highlight only their matching leaf/overview link.
- Role-based navigation filtering still comes from `src/config/navigation.ts` and `user.roles`.

## Admin Dashboard Widgets

- File: `src/features/admin/admin-dashboard.tsx`
- Route: `/admin`
- Header: `SaaS Global Dashboard`
- KPI cards:
  - Active Tenants
  - Suspended Tenants
  - Total Parkings
  - Total Manager Accounts
  - Active Sessions Today
  - API Error Rate
- Charts:
  - Tenant growth over time
  - Request volume / API traffic
  - Tenant status breakdown
- Lists:
  - Recently provisioned tenants
  - Risk alerts
- Quick actions:
  - Create Tenant
  - Manage Vehicle Types
  - View System Health

## Manager Dashboard Widgets

- Files:
  - `src/features/manager/manager-dashboard.tsx`
  - `src/app/(protected)/manager/page.tsx`
- Route: `/manager`
- Header: `Parking Manager Dashboard`
- Current tenant/manager card reads real current user data from `useAuthStore` when available.
- KPI cards:
  - Total Parkings
  - Total Slots
  - Occupied Slots
  - Occupancy Rate
  - Active Sessions
  - Today Revenue
  - Pending Incidents
  - Devices Pending Approval
- Charts:
  - Occupancy trend by hour
  - Revenue split: Cash vs QR
  - Vehicle type distribution
  - Peak hour heatmap
- Operations snapshot:
  - Active parkings list
  - Recent sessions
  - Recent red-flag actions
  - Device approval queue preview
- Quick actions:
  - Create Parking
  - Import Slots
  - Generate RFID Cards
  - Manage Kiosks
  - View Live Monitor

## Mock / API Pending Sections

- Dashboard business metrics that are not available in the current backend are local constants inside the dashboard component files.
- Mock sections are labeled with `Mock data / API pending`.
- No fake API service was added.
- Facility CRUD pages and Facility API services were not changed.

## Files Changed

- `src/features/admin/master-data-config.tsx`
- `src/components/layout/sidebar.tsx`
- `src/features/admin/admin-dashboard.tsx`
- `src/features/manager/manager-dashboard.tsx`
- `src/app/(protected)/manager/page.tsx`
- `docs/current-dev-snapshot/frontend-dashboard-navigation-polish.md`

## Known Limitations

- Several dashboard widgets remain mock-only until backend stats endpoints are finalized.
- Admin active tenant and parking totals still use `GET /admin/dashboard/stats` when that API responds; other SaaS health widgets are local mock values.
- Manager dashboard only uses real auth-store user profile data; operations metrics intentionally do not depend on Facility API while that backend is being revised.
