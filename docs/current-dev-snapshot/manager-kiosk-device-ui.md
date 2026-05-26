# Manager Kiosk Device UI Snapshot

## Security Note

- Manager kiosk and device APIs are tenant-scoped by the authenticated `PARKING_MANAGER` token.
- The frontend never sends `tenantId`.
- Staff selectors use `GET /manager/staff`; parking selectors use `GET /manager/parkings`.
- Access tokens must not be committed into code, docs, env files, or git history.

## Route List

| Route | UI | Status |
|---|---|---|
| `/manager/staff-devices` | Staff & Devices overview dashboard | Connected where APIs exist |
| `/manager/staff-devices/staff` | Staff accounts table and forms | Connected |
| `/manager/staff-devices/kiosks` | Kiosk CRUD and staff assignment | Connected |
| `/manager/staff-devices/device-approvals` | Staff device approval queue | Connected |
| `/manager/staff-devices/kill-switch` | Revoke guidance / API pending list source | Polished pending |
| `/staff` | Staff entry check-in with workContext display | Connected |

## API Map

Kiosks:

- `GET /manager/kiosks`
- `POST /manager/kiosks`
- `GET /manager/kiosks/{id}`
- `PUT /manager/kiosks/{id}`
- `PATCH /manager/kiosks/{id}/status`
- `DELETE /manager/kiosks/{id}`
- `GET /manager/kiosks/{id}/staff`
- `POST /manager/kiosks/{id}/staff/{staffId}`
- `DELETE /manager/kiosks/{id}/staff/{staffId}`

Device approvals:

- `GET /manager/device-approvals`
- `POST /manager/device-approvals/{id}/approve`
- `POST /manager/device-approvals/{id}/reject`
- `POST /manager/devices/{id}/revoke`

Supporting APIs:

- `GET /manager/staff`
- `GET /manager/parkings`
- `GET /auth/me`
- `POST /staff/parking-sessions/check-in`

## Connected Features

- Overview dashboard loads total staff, active staff, inactive staff, kiosk counts, active kiosk count, and pending device approvals from real manager APIs.
- Overview readiness checklist uses staff, kiosk, kiosk-staff assignment, and device approval data.
- Kiosk page creates and edits kiosks under manager-scoped parkings without sending tenant id.
- Kiosk page can activate/deactivate/delete kiosks and invalidate kiosk lists.
- Kiosk staff assignment panel reads assigned staff, lists active manager-scoped staff, assigns staff to kiosks, and removes assignments.
- Kiosk table renders `assignedStaffCount` when the kiosk list response includes it. If that field is missing, the table shows `—` instead of a misleading zero.
- Assigning or removing kiosk staff invalidates active `GET /manager/kiosks` and `GET /manager/kiosks/{id}/staff` queries so the table, modal, and overview can refresh.
- Device Approvals page lists approval requests, approves with kiosk selection and optional expiry, rejects pending requests, and revokes only when the response exposes a device id.
- Pending approval count badges appear on the overview pending approvals card, the Device Approvals page header, and the sidebar Device Approvals child link for managers.
- Staff Entry reads `workContext` from `/auth/me` via auth state and displays kiosk name, kiosk type, and parking name.
- Staff check-in preserves `plateNumber`, `cardCode`, and `entryImageUrl`; it does not send `parkingId` when workContext exists.

## Staff Entry WorkContext Behavior

`GET /auth/me` may return:

```json
{
  "workContext": {
    "kioskId": "kiosk-id",
    "kioskName": "Bot vao B1",
    "kioskType": "ENTRY",
    "parkingId": "parking-id",
    "parkingName": "Vincom Dong Khoi"
  }
}
```

When present, the Staff Entry page shows the context card and posts check-in
without `parkingId`, allowing backend session/kiosk resolution. When missing,
the page shows a DEV fallback note and still does not send `tenantId`.

Handled staff check-in error cases include:

- `KIOSK_CONTEXT_REQUIRED`
- `DEVICE_NOT_TRUSTED` / `DEVICE_NOT_TRUST`
- `STAFF_NOT_ASSIGNED_TO_KIOSK`
- `KIOSK_INACTIVE`
- card already in use
- no available slot

## Pending Features

- Kill Switch does not list approved devices or active sessions because a complete manager-scoped list source is not available in the documented API set.
- Device approval history filters are not implemented; current documented list source is pending-oriented.
- Kiosk staff assignments are no-shift MVP assignments.

## Approval Expiration

- Permanent approval is the default in the approval modal.
- Permanent approval sends:

```json
{
  "kioskId": "kiosk-id",
  "expiresAt": null
}
```

- Temporary approval requires a future local date/time before submit.
- Temporary approval converts the selected local date/time to an ISO UTC timestamp with `Date.toISOString()` before sending.
- Backend validation errors for invalid `expiresAt` are surfaced through the existing toast error path.

## Known Limitations

- Kiosk list response is accepted as either an array or a paged `content` wrapper because the documented sample shows item shape but not a full list envelope.
- Kiosk assigned staff count depends on `assignedStaffCount` in `GET /manager/kiosks`; the UI does not fake a global count from per-kiosk assignment calls.
- Revoke is shown only when `GET /manager/device-approvals` returns `deviceId`.
- Staff check-in fallback parking selection is not exposed in the UI.

## Files Changed

- `src/service/manager/kiosk-device-type.ts`
- `src/service/manager/kiosk-device-api.ts`
- `src/features/manager/staff-devices-overview.tsx`
- `src/features/manager/kiosk-management.tsx`
- `src/features/manager/device-approvals.tsx`
- `src/features/manager/kill-switch.tsx`
- `src/features/staff/entry-check-in.tsx`
- `src/components/layout/sidebar.tsx`
- `src/service/user/type.ts`
- `src/service/staff/type.ts`
- `src/app/(protected)/manager/staff-devices/page.tsx`
- `src/app/(protected)/manager/staff-devices/kiosks/page.tsx`
- `src/app/(protected)/manager/staff-devices/device-approvals/page.tsx`
- `src/app/(protected)/manager/staff-devices/kill-switch/page.tsx`
- `docs/current-dev-snapshot/manager-kiosk-device-ui.md`
