# Manager Facility Map UI

## Route

- `/manager/facility/maps`
- Sidebar: Manager > Facility Setup > Maps / Floor Plans

## Real APIs Wired

- `GET /manager/parkings`
- `GET /manager/parkings/{parkingId}/floors`
- `GET /manager/floors/{floorId}/map`
- `PATCH /manager/floors/{floorId}/map`
- `PATCH /manager/slots/{slotId}/coordinate`
- `POST /manager/storage/presign-upload`
- `GET /manager/storage/presign-download?objectKey=...`

The frontend does not send `tenantId`; tenant scope comes from the authenticated manager session.

## UX Flow

1. Manager selects a parking from the real parking list.
2. Manager selects a floor under that parking.
3. The page loads floor map setup from `GET /manager/floors/{floorId}/map`.
4. The map endpoint is the source of truth for `mapImageUrl`, `coordinateMode`, slots, mapped count, and missing-coordinate count.
5. Manager pastes a URL/object key or uploads an image through presigned storage.
6. Manager selects a slot and clicks the displayed image to preview a percentage pin.
7. Manager saves the coordinate with `PATCH /manager/slots/{slotId}/coordinate`, then the page refetches floor map setup.

## Paste URL Flow

- The paste field accepts an external `http(s)` image URL or a tenant object key.
- Save calls `PATCH /manager/floors/{floorId}/map` with `{ "mapImageUrl": "..." }`.
- On success, the UI refetches `GET /manager/floors/{floorId}/map`.
- Backend validation errors are shown through the existing toast error path.

## Presigned Upload Flow

1. User selects a PNG, JPEG, or WebP image.
2. UI calls `POST /manager/storage/presign-upload`:

```json
{
  "fileName": "b1-map.png",
  "contentType": "image/png",
  "folder": "floor-maps"
}
```

3. UI uploads the file directly to `uploadUrl` using the returned method and headers.
4. UI saves `publicUrl` when present, otherwise the backend-generated `objectKey`, using `PATCH /manager/floors/{floorId}/map`.
5. UI refetches the floor map setup.

MinIO access keys and secrets remain server-side only. If browser PUT fails because MinIO CORS is not configured, the upload error is surfaced and the UI does not fake success.

## Private Map Display

- External `http(s)` map URLs are rendered directly.
- Tenant object keys such as `tenants/{tenantId}/floor-maps/file.png` are not used directly as `<img src>`.
- Tenant object keys are resolved through `GET /manager/storage/presign-download?objectKey=...`, and the returned `downloadUrl` is used as the image source.
- Download presign results are cached briefly in React Query and refreshed when the floor map object key changes.
- The frontend does not mutate the stored floor map value just to display it.

## Canvas States

- No floor selected: shows `Select a parking and floor first.`
- No map configured: shows `No floor map configured yet.`
- Map setup/download loading: shows `Loading map image...`
- Presign or image load error: shows `Cannot load map image. The stored object key may be invalid or the download URL expired.` with a retry button.
- Map ready: centers the image in a bounded scrollable workspace and renders slot pins over the image.

## Image Wrapper Positioning

- Pins are rendered inside the same `position: relative` wrapper as the map image.
- The wrapper is `inline-block`, so its bounds match the rendered image instead of the outer canvas.
- Pin CSS uses `left: ${xCoordinate}%` and `top: ${yCoordinate}%` against that image wrapper.
- This keeps click coordinates and pin display aligned to the actual visible floor plan.

## Coordinate Convention

- `coordinateMode` is `PERCENT`.
- `xCoordinate` and `yCoordinate` are clamped percentages from `0` to `100`.
- Map click conversion uses the actual displayed image wrapper:
  - `xCoordinate = clickX / imageWidth * 100`
  - `yCoordinate = clickY / imageHeight * 100`
- Coordinates are rounded to two decimal places before preview/save.

## Performance / OOM Review

- Previous UI loaded slots indirectly with one query per zone. That could fan out many React Query subscriptions and was replaced with the single map setup endpoint.
- Search and mapping filters are client-side and memoized; typing does not refetch.
- Pins are memoized from map endpoint slots.
- Pin labels are not rendered for every slot by default; labels appear only for the selected or hovered pin.
- The selected slot label is always visible, and unsaved preview pins show an `Unsaved changes` state.
- No polling, `setInterval`, render-time state updates, or query invalidation loops exist in the map screen.
- No project code calls `module.register()`.
- `package.json` has a single `next dev` script and does not spawn nested dev servers.
- One unrelated sidebar query polls device approvals every 60 seconds; it is outside the map screen.

## Node DEP0205 Warning

The observed `[DEP0205] module.register()` warning is not caused by app code. A repository search found no project call to `module.register()`. It appears to come from Next/Turbopack/dev tooling.

## Verification Notes

- `/auth/me` with the provided token returned `PARKING_MANAGER`.
- `GET /manager/parkings` returned one parking: `BCONS-PLAZA`.
- `GET /manager/parkings/{parkingId}/floors` returned two floors.
- `GET /manager/floors/{floorId}/map` returned HTTP 200 with `coordinateMode: PERCENT` and 98 slots for the first floor.
- `GET /manager/storage/presign-download?objectKey=...` returned HTTP 200 with a download URL expiring in 900 seconds.
- `POST /manager/storage/presign-upload` returned HTTP 200 with method `PUT`, an upload URL, and `publicUrl: null`.
- Browser upload CORS was not exercised from the UI in this pass.

## Limitations

- No pathfinding.
- No route lines.
- No map crop/calibration tools.
- No CSV coordinate import.
- No PWA driver map page.
- Browser PUT upload still depends on MinIO CORS being configured for the frontend origin.

## Files Changed

- `src/config/navigation.ts`
- `src/app/(protected)/manager/facility/maps/page.tsx`
- `src/features/manager/facility-map-setup.tsx`
- `src/service/manager/facility-type.ts`
- `src/service/manager/facility-api.ts`
- `docs/current-dev-snapshot/manager-facility-map-ui.md`
