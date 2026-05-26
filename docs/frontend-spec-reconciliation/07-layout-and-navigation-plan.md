# 07 - Layout and Navigation Plan

## Layout Audit

| Layout Area        | Current Status | Files                                                                                          | Needed For Roles    | Problems                                                      | Recommendation                                                |
| ------------------ | -------------- | ---------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| Root layout        | PARTIAL        | `src/app/layout.tsx`                                                                           | All                 | Good provider/toaster shell; no app-level auth bootstrap      | Add AuthBootstrap inside providers.                           |
| Auth layout        | MISSING        | `src/app/auth/login/page.tsx` only                                                             | Public/Auth         | Login owns its own full-screen layout; no auth segment layout | Optional auth layout once forgot/reset/device pages exist.    |
| Admin layout       | PARTIAL        | `src/app/(protected)/layout.tsx`, `src/components/layout/sidebar.tsx`                          | SYSTEM_ADMIN        | Shared protected layout, not role-specific, no guard          | Keep shared shell but filter nav by real role.                |
| Manager layout     | PARTIAL        | Same protected layout                                                                          | PARKING_MANAGER     | Dashboard placeholder; nav incomplete                         | Add manager nav groups progressively.                         |
| Staff kiosk layout | MISSING        | `/staff` placeholder                                                                           | STAFF               | Current sidebar dashboard shell unsuitable for kiosk/bốt gác  | Create focused desktop-first kiosk layout later.              |
| PWA mobile layout  | MISSING        | `/driver` placeholder                                                                          | USER/PWA            | No manifest/mobile shell/lazy auth                            | Decide same repo route group vs separate app.                 |
| Sidebar/nav        | PARTIAL        | `src/components/layout/sidebar.tsx`, `src/config/navigation.ts`                                | Admin/Manager/Staff | Mock SYSTEM_ADMIN fallback, missing route `/staff/devices`    | Remove fallback; generate only from authenticated user roles. |
| Header/user menu   | MISSING        | Sidebar footer only                                                                            | All roles           | No logout/profile menu                                        | Add compact user menu with logout.                            |
| Responsive/mobile  | PARTIAL        | Sidebar collapses width only                                                                   | Admin/Manager       | No mobile drawer behavior                                     | Add responsive shell after route guard.                       |
| Dark/light/theme   | PARTIAL        | `src/app/providers.tsx`, `src/providers/theme-provider.tsx`, `src/components/theme-toggle.tsx` | All                 | Theme provider exists and toggle in sidebar                   | Keep.                                                         |

## Proposed Navigation

### SYSTEM_ADMIN

- Dashboard -> `/admin`
- Tenants -> `/admin/tenants`
- Master Data -> `/admin/master-data`
- System Health -> `/admin/system-health` (MISSING)
- Settings -> `/admin/settings` (MISSING)

### PARKING_MANAGER

- Dashboard -> `/manager`
- Facility
- Parkings -> `/manager/parkings`
- Floors -> best nested in `/manager/parkings/[id]/topology`
- Zones -> best nested in `/manager/parkings/[id]/topology`
- Slots -> `/manager/slots`
- Staff & Devices
- Staff -> `/manager/staff` (MISSING)
- Kiosks -> `/manager/kiosks` (MISSING)
- Device Approvals -> `/manager/device-approvals` (MISSING)
- Pricing
- Time Rules -> `/manager/pricing/time-rules` (MISSING)
- Pricing Matrix -> `/manager/pricing/matrix` (MISSING)
- Subscriptions -> `/manager/subscriptions` (MISSING)
- Operations
- Incidents -> `/manager/incidents` (MISSING)
- Zone Violations -> `/manager/zone-violations` (MISSING)
- Debt -> `/manager/debt` (MISSING)
- Analytics -> `/manager/analytics` (MISSING)

### STAFF

- Entry -> `/staff/entry` (MISSING)
- Exit -> `/staff/exit` (MISSING)
- Live Monitor -> `/staff/live-monitor` (MISSING)
- Exceptions -> `/staff/exceptions` (MISSING)
- Shift Handover -> `/staff/shift-handover` (MISSING)

### USER/PWA

- Active Session -> `/pwa/session` or `/driver/session` (MISSING)
- Checkout -> `/pwa/checkout` or `/driver/checkout` (MISSING)
- Subscription -> `/pwa/subscription` or `/driver/subscription` (MISSING)
- Invoices -> `/pwa/invoices` or `/driver/invoices` (MISSING)

## Recommended Direction

Use one protected shell for Admin/Manager initially, but do not force Staff kiosk and PWA into that sidebar shell. Staff should be a task-focused kiosk layout. PWA should be mobile-first and probably use a separate route group/layout in the same repo if owner confirms.
