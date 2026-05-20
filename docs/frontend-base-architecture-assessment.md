# SmartPark Frontend Base Architecture Assessment

Generated on: 2026-05-20

Scope: full scan of the current SmartPark frontend repository, covering the Web ERP and expected Driver PWA direction. This assessment reflects the code currently present in the repository, not the intended future backend or product scope.

## Executive Summary

The current frontend is a small Next.js App Router baseline with authentication scaffolding, role landing pages, a Zustand auth store, shared Axios client, TanStack Query provider, Tailwind CSS, shadcn/ui base components, and commit message enforcement.

It is not yet ready for complex SmartPark operational UI such as Blind Drop shift handover, a Parking Slot Matrix, staff-operated camera capture, VietQR/RFID workflows, or map-based slot layout editing. The foundational stack is appropriate, but several architectural pieces are still missing:

- No PWA manifest, service worker, offline strategy, or installability setup.
- No webcam, license plate capture, VietQR, QR scanner, RFID, or human-operated IOT module.
- No protected-route enforcement beyond route grouping.
- No per-route RBAC guard preventing Staff from opening Manager/Admin pages.
- No dedicated 403 or Device Not Trusted handling.
- No automatic tenant header attachment in Axios.
- No 2D floor plan, drag/drop, slot matrix, or relative coordinate model.
- No auth bootstrap on reload, despite the auth store having `isCheckingAuth`.

## 1. Component And Router Architecture

### Current App Router Structure

The app uses Next.js App Router under `src/app`:

```txt
src/app/
  page.tsx
  layout.tsx
  providers.tsx
  auth/login/page.tsx
  (protected)/layout.tsx
  (protected)/admin/page.tsx
  (protected)/manager/page.tsx
  (protected)/staff/page.tsx
  (protected)/driver/page.tsx
```

The `(protected)` route group keeps clean URLs:

- `src/app/(protected)/admin/page.tsx` -> `/admin`
- `src/app/(protected)/manager/page.tsx` -> `/manager`
- `src/app/(protected)/staff/page.tsx` -> `/staff`
- `src/app/(protected)/driver/page.tsx` -> `/driver`

The role pages are currently placeholder dashboards using a shared `RoleWelcomeCard` component.

### Root Layout And Providers

`src/app/layout.tsx` sets global metadata, Geist fonts, global CSS, `Providers`, and Sonner toaster.

`src/app/providers.tsx` currently wraps the app with only `QueryProvider`.

`src/providers/query-provider.tsx` creates a TanStack Query client with:

- `staleTime: 60 * 1000`
- `refetchOnWindowFocus: false`
- `retry: 1`
- React Query Devtools enabled

`src/providers/theme-provider.tsx` exists but is not currently wired into `src/app/providers.tsx`, so theme switching infrastructure is present but inactive.

### Protected Layout

`src/app/(protected)/layout.tsx` is a visual shell, not a security or route guard.

It reads the current user from Zustand and renders:

- SmartPark brand link
- Static nav links to Admin, Manager, Staff, Driver
- User display name fallbacking to `Guest`
- Child route content

Current issue: all protected nav items are shown to every user, and the layout does not redirect unauthenticated users. It also does not check whether the current user has the role required by the active route.

### Login Flow

`src/app/auth/login/page.tsx` implements:

- React Hook Form
- Zod validation
- username/password fields only
- password visibility toggle
- TanStack `useMutation`
- device fingerprint/device label assembly in mutation logic
- `loginApi`
- `setJwtToken`
- `getMyProfileApi`
- `setSession`
- role-based redirect

Role redirect mapping:

```txt
SYSTEM_ADMIN    -> /admin
PARKING_MANAGER -> /manager
STAFF           -> /staff
PARKING_USER    -> /driver
```

This matches the documented MVP route convention.

### Router/RBAC Gaps

The route structure is ready for basic role pages, but route protection is incomplete.

Missing:

- Auth bootstrap component that calls refresh after page reload.
- Unauthenticated redirect from protected routes to `/auth/login`.
- Per-route role requirements.
- Permission-based route and sidebar filtering.
- 403 page or fallback boundary.
- Specific UX for Device Not Trusted responses.

Current behavior risk:

- A Staff user can navigate directly to `/manager` or `/admin` if the frontend route is loaded.
- A logged-out reload can show protected layout with `Guest`.
- Backend still protects real data, but frontend UX does not yet reflect authorization state.

## 2. State Management Strategy

### Libraries

The project uses:

- Zustand for client/global session state.
- TanStack Query for server state and API request orchestration.
- React Hook Form and Zod for form state and validation.

No Redux setup was found. Context API is used only inside shadcn form primitives and React Query provider infrastructure, not as the project-level business state layer.

### Auth Store

`src/stores/use-auth-store.ts` defines:

```ts
user: UserProfile | null;
isAuthenticated: boolean;
isCheckingAuth: boolean;
jwtToken: string | null;
```

Actions:

```ts
setAuth(user);
setJwtToken(token);
setCheckingAuth(isCheckingAuth);
setSession({ user, jwtToken });
clearAuth();
```

The store is memory-only. There is no Zustand persistence middleware, which is appropriate for access tokens, but it means reload restoration depends on a bootstrap refresh flow.

### User, Roles, Permissions, Tenant

`src/service/user/type.ts` defines:

```ts
export type Role =
    | 'SYSTEM_ADMIN'
    | 'STAFF'
    | 'PARKING_MANAGER'
    | 'PARKING_USER';

export interface UserProfile {
    id: string;
    tenantId: string;
    username: string;
    fullName: string;
    phone: string;
    roles: Role[];
    permissions: string[];
}
```

Findings:

- User profile supports `tenantId`.
- Roles and permissions are stored in `user`.
- The user asked about `MANAGER`; current code uses `PARKING_MANAGER`, not `MANAGER`.
- `tenantId` is stored only as part of `user`; there is no separate tenant store.
- There is no active tenant switcher or selected tenant concept.

### API Client And Header Attachment

`src/lib/api/axios-config.ts` creates a shared Axios client:

- `baseURL` from `NEXT_PUBLIC_API_URL` with fallback `http://localhost:8080`
- `withCredentials: true`
- default JSON headers
- request interceptor
- response interceptor
- refresh-token retry on 401
- normalized `ApiError`

Current request interceptor only attaches:

```ts
Authorization: Bearer<jwtToken>;
```

It does not attach:

- `tenant_id`
- `tenantId`
- `X-Tenant-Id`
- any other tenant-aware header

Assessment: tenant context exists in the user model but is not propagated automatically to API requests. If the backend expects tenant context from JWT claims only, this is acceptable. If it expects an explicit header, the current frontend is incomplete.

### Refresh Flow

The Axios response interceptor handles 401 by calling `/auth/refresh` with raw axios to avoid interceptor recursion, then updates `jwtToken`, resolves queued failed requests, and retries the original request.

Missing:

- App bootstrap refresh on page reload.
- Post-refresh `GET /auth/me` to restore `user`.
- Clear redirect to login after refresh failure.

The project docs already mention this reload gap, and the code confirms it is still open.

## 3. PWA And Human-Operated IOT Module

### PWA Configuration

No PWA implementation was found.

Not found:

- `public/manifest.json`
- app metadata manifest
- service worker file such as `sw.js`
- `next-pwa` or equivalent package
- Workbox configuration
- offline cache strategy
- install prompt handling
- push notification plumbing

The current `public/` directory only contains default SVG assets.

Assessment: the Driver PWA is not implemented yet. The codebase can become a PWA, but no PWA-specific base exists today.

### Webcam And License Plate Capture

No webcam/camera module was found.

Not found:

- `navigator.mediaDevices.getUserMedia`
- webcam/video capture components
- canvas frame capture
- image upload flow for plate recognition
- license plate preview/cropping/retake UI
- LPR/OCR API integration

Assessment: staff-operated license plate capture is not started.

### VietQR, QR, RFID

No VietQR, QR scanning, or RFID workflow was found.

Not found:

- VietQR generation/display component
- QR scanner component
- dynamic payment QR refresh/polling
- RFID card read/bind/scan UI
- serial, NFC, WebUSB, WebHID, or keyboard-wedge scan handling

Assessment: payment and card-scanning flows are not represented in the frontend yet.

### Device Trust

Device fingerprint support exists in `src/lib/auth/device-fingerprint.ts`.

Behavior:

- Demo users map to seeded device fingerprints.
- Real users get a random UUID generated by `crypto.randomUUID()`.
- The UUID is stored in `localStorage`.
- Device label is generated from platform and browser information.

This supports login-time trusted-device payloads, but it is not a full Device Not Trusted UX. There is no explicit screen or route for pending device approval, no 403 handling, and no recovery path besides showing the backend error toast during login/API failure.

## 4. Routing And RBAC

### Current RBAC Implementation

RBAC currently exists only in these places:

- Role union type in `src/service/user/type.ts`.
- Login success redirect by roles in `src/app/auth/login/page.tsx`.
- Role-specific placeholder page props.
- Static protected layout navigation.

There is no route guard function, middleware, server layout authorization, client guard component, or permission-aware sidebar filter.

### Required Target Direction

For ERP readiness, add a centralized route policy map:

```ts
const ROUTE_POLICIES = {
    '/admin': { roles: ['SYSTEM_ADMIN'] },
    '/manager': { roles: ['PARKING_MANAGER'] },
    '/staff': { roles: ['STAFF'] },
    '/driver': { roles: ['PARKING_USER'] },
};
```

Then apply it through a protected route guard or layout-level client guard after auth bootstrap has restored session state.

For real modules, prefer permission checks:

```ts
parking.slot.read;
parking.slot.write;
shift.handover.create;
shift.handover.approve;
iot.camera.capture;
payment.vietqr.collect;
rfid.card.bind;
```

### 403 And Device Not Trusted Handling

No dedicated 403 fallback was found.

`ApiError` preserves:

- `status`
- backend `code`
- backend `errors`
- message

This is enough for future branching, but no component currently branches on 403 or a backend device-trust error code.

Recommended behavior:

- `401`: refresh or redirect to login.
- `403` with device-trust code: route to `/auth/device-not-trusted` or show a blocking approval-required page.
- `403` with permission code: show permission denied page.
- `403` on module data request: preserve shell but block module content.

## 5. Map And Visual UI Components

No floor plan, parking map, slot matrix, drag/drop, or coordinate editor was found.

Not found:

- static floor image renderer
- slot overlay layer
- relative x/y coordinate model
- drag/drop library
- pointer-event coordinate conversion
- zoom/pan behavior
- slot occupancy matrix
- floor/building service domain

Current UI is form/card/button focused. It does not yet include the interaction primitives needed for floor plan editing.

### Recommended Coordinate Model

For future slot mapping, store relative coordinates instead of pixels:

```ts
interface ParkingSlotMapPoint {
    slotId: string;
    floorId: string;
    xRatio: number; // 0..1 relative to rendered floor-plan width
    yRatio: number; // 0..1 relative to rendered floor-plan height
    rotationDeg?: number;
}
```

This supports responsive floor plans, zoom, and different display densities.

## 6. Available UI Kit And Base Components

### shadcn/ui Components Present

Current reusable UI components:

- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/field.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/sonner.tsx`

### Supporting UI Utilities

- `src/lib/utils.ts` provides the `cn()` class merge helper.
- `lucide-react` is installed and used for icons.
- Tailwind CSS v4 is configured via `src/app/globals.css`.
- shadcn theme tokens and CSS variables are defined in globals.
- Sonner toast styling supports success, error, warning, and info.

### Component Readiness

Ready for:

- Login forms
- Basic dashboards
- Cards and summary panels
- Simple settings screens
- Basic CRUD forms
- Toast feedback

Not ready for:

- Data tables
- Dialogs/drawers
- Dropdown menus
- Tabs
- Selects/comboboxes
- Date/time pickers
- Stepper workflows
- File/image upload
- Camera capture
- QR display/scanning
- Floor plan canvas
- Drag/drop slot positioning
- Matrix-style occupancy dashboards

## 7. Git Workflow Check

### Commit History

Recent commits follow Conventional Commit style:

```txt
docs: add docs for project flow
chore(route): move role route to protected that required authentication
feat(ui): integrated with backend api to handle login logic
feat(fingerprint): handle fingerprint logic for both dev and read user
feat: correct type depends to backend api
feat(axios): handle refresh token logic
feat(ui): add field component
feat(ui): add shadcn component form, label, input
feat(base): init base project with bun, shadcn, tanstack hook
```

### Enforcement

`scripts/commit-msg.sh` enforces:

- allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`
- optional lowercase scope
- `type(scope): subject` format
- lowercase first letter of subject

`.pre-commit-config.yaml` and `scripts/setup-precommit.sh` indicate commit-msg hook setup exists.

### Tooling Issue

`package.json` has:

```json
"lint:fix": "next lint --fix"
```

This conflicts with the project rule that Next.js 16 removed `next lint`. The `lint` script correctly uses `eslint`, but `lint:fix` should be changed to an ESLint CLI command before the team relies on it.

## 8. Readiness Assessment For Complex UI

### Blind Drop Shift Handover

Current readiness: low.

Available foundation:

- Auth session store.
- API client.
- React Query.
- Form stack.
- Toasts.
- Basic UI primitives.

Missing:

- shift domain API/types
- multi-step workflow components
- evidence upload/camera capture
- manager approval queue
- cash/reconciliation UI
- staff/manager permission checks
- activity/audit timeline
- offline or retry behavior for PWA scenarios

Recommended next architecture:

- `src/service/shift/api.ts`
- `src/service/shift/type.ts`
- `src/features/shift-handover/`
- route under `src/app/(protected)/staff/shifts/`
- manager approval route under `src/app/(protected)/manager/shift-handovers/`
- permission-aware route guard and sidebar items

### Parking Slot Matrix

Current readiness: low to medium.

Available foundation:

- Responsive Tailwind layout system.
- Card/button primitives.
- Query/provider setup.
- Authenticated API client.

Missing:

- parking building/floor/slot domain services
- real-time or polling occupancy state
- grid/matrix components
- filter/search controls
- slot status tokens and legends
- role/permission controls
- map/floor plan editor
- drag/drop coordinate editor

Recommended next architecture:

- `src/service/parking/api.ts`
- `src/service/parking/type.ts`
- `src/features/parking-slot-matrix/`
- `src/features/floor-plan-editor/`
- small coordinate utility module for ratio-to-pixel conversion
- optional drag/drop dependency only after confirming editing requirements

### Driver PWA

Current readiness: low.

Available foundation:

- `/driver` route exists.
- Auth role `PARKING_USER` exists.
- Access token refresh exists for active browser sessions.

Missing:

- manifest/service worker/offline strategy
- mobile-first route shell
- installability testing
- driver booking/payment modules
- push notifications
- offline-safe payment or booking state handling
- deep links
- PWA-specific icons and metadata

## 9. Priority Recommendations

1. Implement `AuthBootstrap` to restore access token and profile after reload.
2. Add protected route guard with role and permission policies.
3. Add explicit 403 handling, separating permission denial from Device Not Trusted.
4. Decide whether tenant context is JWT-only or must be sent as a header; if header-based, attach it in the Axios request interceptor from `user.tenantId`.
5. Add a role/permission-aware sidebar or navigation model.
6. Build domain service folders before complex UI: `parking`, `shift`, `payment`, `rfid`, `iot`.
7. Add missing shadcn primitives needed for ERP workflows: dialog, drawer, dropdown menu, select, tabs, table, textarea, checkbox, radio group, badge, tooltip.
8. Establish the PWA base before Driver work: manifest, icons, service worker strategy, mobile shell, install checks.
9. Create floor plan and slot matrix feature boundaries before adding drag/drop.
10. Replace `lint:fix` with an ESLint CLI command compatible with Next.js 16.

## Final Verdict

The repository is a clean MVP frontend base for authentication and role landing pages. It is suitable for continuing SmartPark ERP development, but it is not yet architecturally complete for the operational modules named in this review.

The next technical milestone should be auth/session hardening and RBAC enforcement. After that, the team can safely add domain modules for parking operations, IOT capture, payments, RFID, and map-based slot management without building those features on top of an unguarded route shell.
