# Manager Staff UI Snapshot

## Security Note

- Manager staff APIs are tenant-scoped by the authenticated `PARKING_MANAGER` token.
- The frontend never sends `tenantId`.
- Access tokens must not be committed into code, docs, env files, or git history.

## Route List

| Route | UI | Status |
|---|---|---|
| `/manager/staff-devices` | Staff & Devices overview dashboard | Connected where APIs exist |
| `/manager/staff-devices/staff` | Staff accounts table and forms | Connected |
| `/manager/staff-devices/kiosks` | Kiosk CRUD and staff assignment | Connected |
| `/manager/staff-devices/device-approvals` | Device approval queue | Connected |
| `/manager/staff-devices/kill-switch` | Emergency revoke guidance | Polished pending |

All Staff & Devices routes render real UI and should not 404.

## API Map

Staff Accounts:

- `GET /manager/staff`
- `POST /manager/staff`
- `GET /manager/staff/{id}`
- `PUT /manager/staff/{id}`
- `PATCH /manager/staff/{id}/status`
- `POST /manager/staff/{id}/reset-password`

Kiosk / Device APIs:

- `GET /manager/kiosks`
- `POST /manager/kiosks`
- `PUT /manager/kiosks/{id}`
- `PATCH /manager/kiosks/{id}/status`
- `DELETE /manager/kiosks/{id}`
- `GET /manager/kiosks/{id}/staff`
- `POST /manager/kiosks/{id}/staff/{staffId}`
- `DELETE /manager/kiosks/{id}/staff/{staffId}`
- `GET /manager/device-approvals`
- `POST /manager/device-approvals/{id}/approve`
- `POST /manager/device-approvals/{id}/reject`
- `POST /manager/devices/{id}/revoke`

## Request / Response Assumptions

List response is normalized from `response.result` using the backend paged
contract:

- `content`
- `page`
- `size`
- `totalElements`

The staff table, count, empty state, and pagination all read from the same
normalized source. Rows are not read from `result.items`, `result.data`,
`result.records`, `data.content`, or any alternate response shape.

Staff item fields used by the UI:

- `id`
- `username`
- `fullName`
- `phone`
- `status`
- `createdAt`
- `updatedAt`

Create request:

```json
{
  "username": "acme.staff01",
  "initialPassword": "Password@123",
  "fullName": "Nguyen Van A",
  "phone": "0900000001",
  "status": "ACTIVE"
}
```

Update request:

```json
{
  "fullName": "Nguyen Van B",
  "phone": "0900000002",
  "status": "ACTIVE"
}
```

Status request:

```json
{
  "status": "INACTIVE"
}
```

Reset password request:

```json
{
  "newPassword": "NewPassword@123"
}
```

## Connected Features

- Staff table with compact staff, contact, status, updated, and actions columns.
- Staff rows show full name as primary text and username as muted secondary text.
- Staff actions are grouped in a compact dropdown for edit, reset password, and status changes.
- Empty staff state says “No staff accounts yet.” and includes a Create Staff button.
- Staff error state includes a retry button.
- Backend search/status/page query params are wired for the staff list.
- `GET /manager/staff` maps `response.result.content` to the table rows and
  uses `response.result.page`, `response.result.size`, and
  `response.result.totalElements` for pagination.
- Create staff modal sends username, initialPassword, fullName, phone, and status.
- Edit staff modal sends fullName, phone, and status only.
- Status action supports `ACTIVE`, `INACTIVE`, and `SUSPENDED`.
- Reset password modal posts `newPassword`.
- All create/update/status/reset-password mutations invalidate the staff list.
- The UI shows the required note: “Staff device is not trusted yet. Device approval/kiosk binding will be configured later.”
- Sidebar layout uses a full-height vertical flex structure: header at top,
  independently scrollable navigation in the middle, and user info plus logout
  pinned at the bottom.
- Staff & Devices Overview shows KPI cards for total staff, active staff,
  inactive staff, total kiosks, active kiosks, and pending device approvals.
- Staff & Devices Overview includes operational readiness, quick actions, and
  recommended setup order.
- Staff Entry shows kiosk workContext when `/auth/me` returns it and omits
  `parkingId` from check-in when workContext exists.

## Pending Features

- Kill Switch list source remains pending because the documented APIs do not
  include a complete approved-device/session list.
- Staff account creation does not bind or approve devices by design.
- There is no staff delete endpoint; use `INACTIVE` or `SUSPENDED`.

## Known Limitations

- Username uniqueness is currently global per backend notes, so duplicate usernames across tenants can be rejected.
- Staff login may fail later with `DEVICE_NOT_TRUST`; this is expected until device approval/kiosk binding is implemented.
- No access token or temporary credential is stored in this repo.
- Staff pagination derives total pages from `totalElements / size` because the
  observed backend response does not include `totalPages`.
- Kiosk binding and device approval routes are still placeholders, so the
  sidebar may contain inactive destination pages for manager workflows.

## Files Changed

- `src/service/manager/staff-type.ts`
- `src/service/manager/staff-api.ts`
- `src/service/manager/kiosk-device-type.ts`
- `src/service/manager/kiosk-device-api.ts`
- `src/features/manager/staff-accounts.tsx`
- `src/features/manager/staff-devices-overview.tsx`
- `src/features/manager/kiosk-management.tsx`
- `src/features/manager/device-approvals.tsx`
- `src/features/manager/kill-switch.tsx`
- `src/features/staff/entry-check-in.tsx`
- `src/components/layout/sidebar.tsx`
- `src/service/user/type.ts`
- `src/service/staff/type.ts`
- `docs/current-dev-snapshot/manager-staff-ui.md`
