# PWA Card Active Session UI

## Staff QR Handoff

After a successful `POST /staff/parking-sessions/check-in`, the staff `/staff` page keeps the existing check-in result panel and adds a driver handoff panel titled `Đưa khách quét mã này`.

The panel shows:

- plate number
- card code
- assigned slot
- zone
- parking name or parking id when available
- QR code for the public PWA URL
- copy link button
- open PWA preview button

The frontend builds the PWA link from backend-provided `pwaAccessPath` first. If `pwaAccessPath` is missing, it uses `qrToken` to build `/pwa/c/{qrToken}`. It does not use `cardCode` as the public access token.

The check-in request behavior is unchanged: when staff has `workContext`, the request still omits `parkingId`; the frontend never sends `tenantId`.

## Public PWA Route

Route:

```text
/pwa/c/[qrToken]
```

This route lives outside the `(protected)` route group, so it does not mount the protected dashboard layout, manager/staff sidebar, or role redirect logic. The global app providers still mount, including auth bootstrap if configured globally, but the PWA route itself does not require a token and does not redirect to login.

## API Used

```http
GET /pwa/cards/{qrToken}/active-session
```

The route uses a public axios client with no authorization header or refresh-token retry flow. React Query key:

```ts
['pwa-active-session', qrToken]
```

There is no polling or repeated refetch loop.

## PWA Active Session UI

The mobile-first page shows:

- SmartPark header/logo
- status badge, defaulting to `ACTIVE` when status is missing
- plate number from `plateNumber` or `licensePlate`
- card code
- parking name
- floor name
- zone name
- slot code
- check-in time from `checkInTime`, `entryTime`, or `checkInAt` when returned
- `guideText` when returned

## Map Display Behavior

Map image selection:

1. Prefer `mapDisplayUrl`.
2. If `mapDisplayUrl` is missing and `mapImageUrl` is `http(s)`, render `mapImageUrl`.
3. If `mapImageUrl` exists but is only an object key, show `Bản đồ chưa có URL hiển thị công khai.`
4. If no map URL exists, show `Map chưa được cấu hình.`

When `xCoordinate` and `yCoordinate` exist, the pin is rendered inside the same `position: relative` inline image wrapper as the map image. CSS uses percentage `left` and `top`, matching the Manager Facility Map Editor convention.

If the map is renderable but coordinates are missing, the page shows `Slot đã được gán nhưng chưa có tọa độ trên bản đồ.`

## Error States

- `CARD_QR_NOT_FOUND` / `CARD_NOT_FOUND`: `Mã thẻ không hợp lệ.`
- `CARD_NOT_ACTIVE`: `Thẻ này đang bị khóa hoặc không hoạt động.`
- `NO_ACTIVE_SESSION_FOR_CARD`: `Thẻ này hiện không có lượt gửi xe đang hoạt động.`
- generic error: `Không thể tải thông tin gửi xe.`

## Performance Notes

- No polling.
- Stable primitive query key.
- No protected sidebar on the public PWA route.
- No React Query Devtools reintroduction.
- No large base64 image state.
- Map renders direct URLs only; object keys require backend `mapDisplayUrl`.
- QR rendering uses lightweight `qrcode.react`.

## Files Changed

- `package.json`
- `bun.lock`
- `src/features/staff/entry-check-in.tsx`
- `src/service/staff/type.ts`
- `src/service/pwa/api.ts`
- `src/service/pwa/type.ts`
- `src/service/pwa/index.ts`
- `src/features/pwa/card-active-session-guide.tsx`
- `src/app/pwa/c/[qrToken]/page.tsx`
- `docs/current-dev-snapshot/pwa-card-active-session-ui.md`
