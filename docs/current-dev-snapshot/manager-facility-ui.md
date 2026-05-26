# Manager Facility UI Snapshot

## Security Note

- Temporary access tokens are for local curl testing only.
- Access tokens must not be committed into code, docs, env files, or git history.
- Frontend manager facility calls do not send `tenantId`; backend scopes by the authenticated manager token.

## Route List

| Route | UI | Status |
|---|---|---|
| `/manager/facility` | Facility overview with derived totals, status breakdowns, setup checklist, and quick actions | Connected |
| `/manager/facility/parkings` | Parking table, create/edit modal, status action, topology link | Connected |
| `/manager/facility/floors` | Parking-scoped floor table, create/edit/delete | Connected |
| `/manager/facility/zones` | Parking/floor-scoped zone table, create/edit/delete | Connected |
| `/manager/facility/slots` | Slot filters, table, create/edit/delete/status/bulk status | Connected |
| `/manager/facility/slots/import` | Excel import/export workflow | Connected |
| `/manager/facility/rfid-cards` | RFID list/generate/status UI | UI wired, local backend returned 404 |

## API Map

Parking:

- `GET /manager/parkings`
- `POST /manager/parkings`
- `GET /manager/parkings/{id}`
- `PUT /manager/parkings/{id}`
- `PATCH /manager/parkings/{id}/status`
- `GET /manager/parkings/{id}/topology`

Floor:

- `GET /manager/parkings/{parkingId}/floors`
- `POST /manager/parkings/{parkingId}/floors`
- `GET /manager/floors/{id}`
- `PUT /manager/floors/{id}`
- `DELETE /manager/floors/{id}`

Zone:

- `GET /manager/floors/{floorId}/zones`
- `POST /manager/floors/{floorId}/zones`
- `GET /manager/zones/{id}`
- `PUT /manager/zones/{id}`
- `DELETE /manager/zones/{id}`
- `GET /manager/master-data/vehicle-types` for zone vehicle type select

Slot:

- `GET /manager/slots`
- `POST /manager/zones/{zoneId}/slots`
- `GET /manager/slots/{id}`
- `PUT /manager/slots/{id}`
- `DELETE /manager/slots/{id}`
- `PATCH /manager/slots/{id}/status`
- `PATCH /manager/slots/bulk-status`
- `POST /manager/slots/import`
- `GET /manager/slots/export`

RFID Card:

- `GET /manager/rfid-cards`
- `POST /manager/rfid-cards/generate`
- `PATCH /manager/rfid-cards/{id}/status`

## Curl Results

Tested against local backend `http://localhost:8080` with a temporary token provided by the owner. The token is not stored in this repository.

| Endpoint | Result |
|---|---|
| `GET /manager/parkings` | HTTP 200, returned one tenant parking: `BCONS-PLAZA` |
| `GET /manager/slots` | HTTP 200, returned paged slot response with `totalElements: 184` |
| `GET /manager/rfid-cards` | HTTP 404 on local backend, so RFID UI is wired to the documented endpoint but marked unavailable when this occurs |

## Facility Overview Stats Derivation

`/manager/facility` has no aggregate backend endpoint, so it derives simple read-only stats from existing tenant-scoped APIs:

- Total parkings: `GET /manager/parkings`
- Total floors and zones: `GET /manager/parkings/{id}/topology` per parking
- Total slots: `GET /manager/slots?page=0&size=1`
- Slot status breakdown:
  - `GET /manager/slots?status=AVAILABLE&page=0&size=1`
  - `GET /manager/slots?status=OCCUPIED&page=0&size=1`
  - `GET /manager/slots?status=RESERVED&page=0&size=1`
  - `GET /manager/slots?status=MAINTENANCE&page=0&size=1`
  - `GET /manager/slots?status=LOCKED&page=0&size=1`
- Maintenance/Inactive slots: derived as `MAINTENANCE + LOCKED` because the slot enum has no `INACTIVE`.
- RFID totals and status breakdown:
  - `GET /manager/rfid-cards?page=0&size=1`
  - `GET /manager/rfid-cards?status=ACTIVE&page=0&size=1`
  - `GET /manager/rfid-cards?status=INACTIVE&page=0&size=1`
  - `GET /manager/rfid-cards?status=LOST&page=0&size=1`
- Setup checklist:
  - Has parking
  - Has floor
  - Has zone
  - Has slot
  - Has RFID card pool

The overview shows loading, core API error, new-tenant empty state, slot/RFID breakdowns, and quick actions for Create Parking, Import Slots, Generate RFID Cards, and Manage Staff.

## Connected Features

- Facility overview derives parking, topology, slot, and RFID metrics from manager APIs without mock data.
- Parking create/edit/status mutations invalidate parking lists and topology queries.
- Floor create/edit/delete mutations invalidate floor lists and topology queries.
- Zone create/edit/delete mutations invalidate zone lists and topology queries.
- Slot create/edit/delete/status/bulk status mutations invalidate slot and parking queries.
- Slot import invalidates slot and parking queries; export downloads the backend workbook response.
- RFID generate/status mutations invalidate RFID list queries.

## Pending / Limitations

- Local backend returned 404 for `/manager/rfid-cards`; the UI does not fake RFID data and shows an API unavailable state.
- Facility overview treats RFID count/status as API pending when `/manager/rfid-cards` is unavailable, while still rendering facility and slot stats.
- Backend slot search only documents `zoneId`, `status`, `slotCode`, `exact`, `page`, and `size`. Parking/floor selectors are used to narrow the zone selector; the actual backend slot filter is applied when a zone is selected.
- Parking delete is intentionally absent from backend MVP and is not implemented.
- RFID create-single/detail/update pages are intentionally not implemented because backend MVP does not expose those APIs.
- Slot import uses the documented Excel upload contract only; no fake upload service was added.

## Files Changed

- `src/service/manager/facility-type.ts`
- `src/service/manager/facility-api.ts`
- `src/features/manager/facility-overview.tsx`
- `src/features/manager/parking-management.tsx`
- `src/features/manager/floor-management.tsx`
- `src/features/manager/zone-management.tsx`
- `src/features/manager/slot-management.tsx`
- `src/features/manager/slot-import-export.tsx`
- `src/features/manager/rfid-card-management.tsx`
- `src/app/(protected)/manager/facility/page.tsx`
- `src/app/(protected)/manager/facility/floors/page.tsx`
- `src/app/(protected)/manager/facility/zones/page.tsx`
- `src/app/(protected)/manager/facility/slots/import/page.tsx`
- `src/app/(protected)/manager/facility/rfid-cards/page.tsx`

## Related Existing Fixes

- Vehicle Type delete refresh is handled in `src/features/admin/master-data-config.tsx`.
- Sidebar active matching is exact for leaf links in `src/components/layout/sidebar.tsx`; parent groups expand without marking all children active.
