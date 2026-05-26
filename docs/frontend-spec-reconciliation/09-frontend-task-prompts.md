# 09 - Frontend Task Prompts

## Task 1: Audit code reality and verify build

### Goal

Confirm current frontend build/lint status and refresh this reconciliation if source changed.

### Current context to read first

- `docs/frontend-spec-reconciliation/00-current-frontend-state.md`
- `docs/frontend-spec-reconciliation/01-route-map.md`
- `package.json`

### Files likely involved

- Docs only unless fixing dependency setup is explicitly requested.

### Do not touch

- Do not change application code.

### Implementation requirements

- Run lint/build after dependencies are installed/materialized.
- Update docs with exact failures.

### Acceptance criteria

- [ ] `npm run lint` or project-equivalent command result documented.
- [ ] `npm run build` or project-equivalent command result documented.
- [ ] Route status remains based on actual source files.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/00-current-frontend-state.md` and `01-route-map.md` first. Verify the current frontend with lint/build/dev commands using the repo's package manager if npm scripts are not appropriate. Do not change app code unless the only issue is documented dependency setup. Update only reconciliation docs with exact command output and acceptance status. Do not break auth/session behavior or change backend contracts.

## Task 2: Normalize API client and env config

### Goal

Clarify and standardize API client behavior if docs/code mismatch remains.

### Current context to read first

- `docs/frontend-spec-reconciliation/03-api-client-contract.md`
- `docs/04-api-and-react-query.md`
- `src/lib/api/axios-config.ts`

### Files likely involved

- `src/lib/api/axios-config.ts`
- `src/lib/api/api-url.ts`
- `src/service/**`

### Do not touch

- Do not change endpoint paths/contracts unnecessarily.

### Implementation requirements

- Keep auth header injection and refresh behavior.
- Preserve backend `ApiResponse` envelope.
- Keep manager/staff/user tenant context backend-owned; do not add tenantId request params.

### Acceptance criteria

- [ ] API client response typing is consistent with services.
- [ ] 401/403 behavior remains covered.
- [ ] `NEXT_PUBLIC_API_URL` behavior documented.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/03-api-client-contract.md` first. Normalize the API client only if needed to remove mismatch between `src/lib/api/axios-config.ts` and service usage. Do not change backend endpoint contracts unless a documented contract requires it. Do not break auth/session refresh. If backend is unavailable, use no fake endpoint behavior in the API client.

## Task 3: Implement auth guard and role redirect

### Goal

Protect `(protected)` routes and redirect by authenticated role.

### Current context to read first

- `docs/frontend-spec-reconciliation/02-auth-flow.md`
- `docs/frontend-spec-reconciliation/07-layout-and-navigation-plan.md`

### Files likely involved

- `src/app/providers.tsx`
- `src/app/(protected)/layout.tsx`
- `src/stores/use-auth-store.ts`
- `src/config/navigation.ts`

### Do not touch

- Do not rewrite login UI.
- Do not store refresh token in localStorage/Zustand.

### Implementation requirements

- Add bootstrap refresh + `/auth/me`.
- Enforce route role mapping.
- Remove mock admin fallback from sidebar.

### Acceptance criteria

- [ ] Logged-out protected route redirects to `/auth/login`.
- [ ] Wrong-role user does not see wrong role page.
- [ ] Reload restores session if refresh cookie is valid.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/02-auth-flow.md` and `07-layout-and-navigation-plan.md` first. Implement auth bootstrap, protected route guard, and role redirects using the existing Zustand auth store and API functions. Do not break current login/session flow. Do not change backend contracts. If backend is unavailable, keep mock behavior isolated and clearly marked, easy to replace.

## Task 4: Connect login to backend contract

### Goal

Harden login once backend auth/device error contract is confirmed.

### Current context to read first

- `docs/frontend-spec-reconciliation/02-auth-flow.md`
- `src/app/auth/login/page.tsx`

### Files likely involved

- `src/app/auth/login/page.tsx`
- `src/service/user/type.ts`
- `src/lib/auth/device-fingerprint.ts`

### Do not touch

- Do not implement manager/staff CRUD in this task.

### Implementation requirements

- Support internal username if confirmed.
- Preserve deviceFingerprint/deviceLabel outside user-editable form fields.
- Handle unknown-device contract if available.

### Acceptance criteria

- [ ] Login payload matches backend contract.
- [ ] Staff can enter internal username if required.
- [ ] Unknown-device error path is not generic toast only.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/02-auth-flow.md` first. Align login UI and request payload with the confirmed backend auth/device contract. Preserve existing auth/session behavior and role redirect. Do not change backend contracts unless owner-approved. If backend lacks unknown-device APIs, add a clearly marked mock layer/screen that can be replaced later.

## Task 5: Implement System Admin tenant UI

### Goal

Stabilize tenant list/create/toggle.

### Current context to read first

- `docs/frontend-spec-reconciliation/05-crud-first-phase-ui-scope.md`
- `docs/frontend-spec-reconciliation/03-api-client-contract.md`

### Files likely involved

- `src/features/admin/tenant-management.tsx`
- `src/service/admin/api.ts`
- `src/service/admin/type.ts`

### Do not touch

- Do not change auth guard/session logic.

### Implementation requirements

- Keep table loading/error/empty states.
- Confirm manager email vs username before changing fields.

### Acceptance criteria

- [ ] Tenant list renders from API.
- [ ] Create validates form.
- [ ] Toggle status invalidates tenant list.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/05-crud-first-phase-ui-scope.md` and `03-api-client-contract.md` first. Implement or harden System Admin tenant UI only. Do not break auth/session behavior. Do not change backend contract fields unless confirmed. If backend is missing, use a clearly marked mock layer that is easy to replace.

## Task 6: Implement Vehicle Type UI

### Goal

Finalize global vehicle type CRUD.

### Current context to read first

- `docs/frontend-spec-reconciliation/03-api-client-contract.md`
- `src/features/admin/master-data-config.tsx`

### Files likely involved

- `src/features/admin/master-data-config.tsx`
- `src/service/admin/api.ts`
- `src/service/admin/type.ts`

### Do not touch

- Do not add pricing matrix in this task.

### Implementation requirements

- Keep vehicle type CRUD contract.
- Add safe delete confirmation if needed.

### Acceptance criteria

- [ ] List/create/edit/delete vehicle types work against current API functions.
- [ ] Form validation uses Zod/RHF.
- [ ] Loading/error/empty states exist.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/03-api-client-contract.md` first. Harden Vehicle Type CRUD only. Preserve auth/session behavior and current backend endpoints. If backend is unavailable, keep mocks explicit and replaceable.

## Task 7: Implement Manager Facility CRUD UI

### Goal

Complete basic Parking/Floor/Zone/Slot CRUD surfaces.

### Current context to read first

- `docs/frontend-spec-reconciliation/05-crud-first-phase-ui-scope.md`
- `docs/manager-facility-api-spec.md`

### Files likely involved

- `src/features/manager/parking-management.tsx`
- `src/features/manager/parking-topology.tsx`
- `src/features/manager/slot-management.tsx`
- `src/service/manager/facility-api.ts`

### Do not touch

- Do not add visual floor mapping or staff operations.

### Implementation requirements

- Use existing manager facility APIs.
- Do not send tenantId manually.
- Mark any missing single-slot API as contract gap.

### Acceptance criteria

- [ ] Floor CRUD UI exists if API supports it.
- [ ] Zone edit/delete exists.
- [ ] Slot table remains searchable/filterable.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/05-crud-first-phase-ui-scope.md` and `docs/manager-facility-api-spec.md` first. Implement only Manager Facility basic CRUD using existing service patterns. Do not break auth/session behavior. Do not send tenantId manually. Do not invent backend contracts; if an API is missing, add a clear mock/placeholder layer or document the gap.

## Task 8: Implement Staff Management UI

### Goal

Manager can create staff, toggle active, and manage red flag permissions.

### Current context to read first

- `docs/frontend-spec-reconciliation/04-spec-vs-ui-gap.md`
- `docs/frontend-spec-reconciliation/10-questions-for-owner.md`

### Files likely involved

- New manager staff route/components after backend contract exists.
- New `src/service/manager/staff-*` files if approved.

### Do not touch

- Do not implement staff kiosk entry/exit.

### Implementation requirements

- Use internal username/mã nhân viên, not personal email unless owner confirms.
- Red flags must be explicit booleans.

### Acceptance criteria

- [ ] Staff list/create/toggle active works or is clearly MOCK_ONLY.
- [ ] Red flag permissions are visible and editable if contract exists.
- [ ] Kill switch behavior is confirmed.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/04-spec-vs-ui-gap.md` and `10-questions-for-owner.md` first. Implement Staff Management UI only after confirming backend contract. Preserve auth/session behavior. Do not invent backend fields; if APIs are unavailable, use a typed MOCK_ONLY layer with clear replacement boundaries.

## Task 9: Implement Device Approval UI

### Goal

Manager can approve/reject pending devices and revoke devices.

### Current context to read first

- `docs/frontend-spec-reconciliation/02-auth-flow.md`
- `docs/frontend-spec-reconciliation/04-spec-vs-ui-gap.md`

### Files likely involved

- Manager device approval route/components.
- Device service files after contract exists.

### Do not touch

- Do not alter fingerprint generation unless backend contract requires it.

### Implementation requirements

- Pending request list.
- Approve temporary 8h.
- Reject.
- Revoke bound device.

### Acceptance criteria

- [ ] Unknown device request has a manager review path.
- [ ] Approve/reject/revoke call confirmed APIs or clear mocks.
- [ ] 403 unknown-device handling integrates without breaking login.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/02-auth-flow.md` and `04-spec-vs-ui-gap.md` first. Implement Device Approval UI with confirmed APIs or a clearly marked mock layer. Do not break current auth/session flow. Do not change backend contracts without confirmation.

## Task 10: Implement Staff Entry/Exit shell

### Goal

Create API-ready staff entry/exit shell without full payment/PWA complexity.

### Current context to read first

- `docs/frontend-spec-reconciliation/04-spec-vs-ui-gap.md`
- `docs/frontend-spec-reconciliation/07-layout-and-navigation-plan.md`

### Files likely involved

- Staff route group/components after layout decision.

### Do not touch

- Do not implement real payment gateway.
- Do not implement PWA checkout.

### Implementation requirements

- Entry: plate input, vehicle type, image upload placeholder, create/open gate button.
- Exit: plate input, split image placeholders, bill amount placeholder, cash/QR buttons.
- All MOCK_ONLY state must be clearly marked.

### Acceptance criteria

- [ ] Staff entry/exit pages exist as skeleton/API-ready.
- [ ] No fake backend contract is hidden as real.
- [ ] Auth/session remains intact.

### Verify commands

```bash
npm run lint
npm run build
npm run dev
```

### Suggested Codex Prompt

Read `docs/frontend-spec-reconciliation/04-spec-vs-ui-gap.md` and `07-layout-and-navigation-plan.md` first. Implement a staff entry/exit shell only, API-ready and clearly marked MOCK_ONLY where backend is absent. Do not break auth/session behavior. Do not change backend contracts. Keep payment and PWA flows mocked and easy to replace.
