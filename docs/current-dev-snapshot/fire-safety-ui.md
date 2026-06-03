# Fire Safety UI

## Routes Added

- `/manager/safety`
- `/manager/safety/fire-extinguishers`
- `/manager/safety/fire-map`
- `/manager/safety/inspections`
- `/staff/fire-inspection`

## Endpoint Map

- `GET /manager/fire-extinguishers/summary`
- `GET /manager/fire-extinguishers`
- `POST /manager/fire-extinguishers`
- `PUT /manager/fire-extinguishers/{id}`
- `PATCH /manager/fire-extinguishers/{id}/status`
- `PATCH /manager/fire-extinguishers/{id}/coordinate`
- `DELETE /manager/fire-extinguishers/{id}`
- `GET /manager/floors/{floorId}/fire-safety-map`
- `GET /manager/fire-inspections/logs`
- `GET /staff/fire-inspections/due`
- `POST /staff/fire-inspections`

## Manager UI States

- Overview shows live summary cards, a needs-attention panel, quick actions, and a first-page inventory preview.
- Fire Extinguishers supports parking, floor, zone, status, type, search, and expiring-days filters.
- Fire Extinguisher list requests trim `search`; blank search is omitted instead of sent as `search=`.
- Empty `parkingId`, `floorId`, `zoneId`, `status`, `type`, and invalid or empty `expiringWithinDays` values are omitted from request params. Pagination remains explicit with `page` and `size`.
- CRUD uses real facility selectors from existing parking, floor, and zone APIs.
- Mutations invalidate extinguisher list and summary query keys.
- Delete uses the backend soft-delete endpoint with a confirmation prompt.
- Inspection Logs supports parking, floor, result, and date range filters with loading, empty, and photo-link states.
- Inspection Log requests omit empty parking, floor, result, from-date, and to-date filters. Date and result params are only sent when staff or manager has selected a value.

## Map Pin Behavior

- Fire Safety Map reuses existing floor map images from facility setup.
- Object-key map images are converted to presigned download URLs through the existing manager storage API.
- Coordinates use percent mode from `0..100`.
- Pins render inside the displayed image bounds.
- The right panel lists code, type, status, location, expiry, next inspection, and coordinate state.
- Select an extinguisher, click the map to preview X/Y, then save with `PATCH /manager/fire-extinguishers/{id}/coordinate`.
- The missing-coordinate filter only changes the right-panel list; existing mapped pins stay visible for context.

## Staff Inspection Checklist

- Staff route reads due items from the staff parking/kiosk context resolved by the backend.
- Due-list requests omit empty status and floor filters.
- Due list shows code, type, floor, zone, location, status, expiry, and next inspection.
- Selecting an extinguisher populates the checklist with a status-aware suggested result.
- Checklist submits result, pressure, seal, location, expiry, optional `photoUrl`, note, and next inspection timestamp.
- Mobile check: the page stacks into a single column on phone widths; due cards remain readable, checklist rows have full-width touch targets, the result selector is clear, optional note/photo URL fields stay below the checklist, and the full-width submit button remains visible at the bottom of the form.
- On success, the due list is refetched and the checklist is reset.

## Live Smoke Checklist

Requires valid manager and staff sessions against the live backend. If tokens are not available in the browser session, use these as manual steps after signing in.

Manager:

- `/manager/safety` loads summary cards and the recent extinguisher preview.
- `/manager/safety/fire-extinguishers` loads the list without a 500 from `GET /manager/fire-extinguishers`.
- Non-blank Fire Extinguisher search sends a trimmed `search` param and filters results.
- Clearing or entering only whitespace in search omits `search` and still loads the list.
- `/manager/safety/fire-map` loads floor data and displays fire extinguisher pins when coordinates exist.
- Coordinate save can be tested by selecting an extinguisher, clicking the map, and saving the preview.
- `/manager/safety/inspections` loads log rows or the empty state without sending blank filters.

Staff:

- `/staff/fire-inspection` loads the due list for the current kiosk context.
- Submit inspection works with result, checklist flags, optional note, optional `photoUrl`, and optional next inspection timestamp.

## Limitations

- No staff inspection photo upload API is implemented; `photoUrl` is a plain optional string labeled “Photo URL (optional)”.
- Future upload support should reuse a documented backend storage contract for staff inspection images before replacing the URL field.
- Map image upload remains part of Facility Map Setup, not Fire Safety Map.
- No global polling is used.

## Files Changed

- `src/config/navigation.ts`
- `src/app/(protected)/manager/safety/page.tsx`
- `src/app/(protected)/manager/safety/fire-extinguishers/page.tsx`
- `src/app/(protected)/manager/safety/fire-map/page.tsx`
- `src/app/(protected)/manager/safety/inspections/page.tsx`
- `src/app/(protected)/staff/fire-inspection/page.tsx`
- `src/features/manager/fire-safety.tsx`
- `src/features/staff/fire-inspection.tsx`
- `src/service/manager/fire-safety-api.ts`
- `src/service/manager/fire-safety-type.ts`
- `src/service/staff/fire-inspection-api.ts`
- `src/service/staff/fire-inspection-type.ts`
