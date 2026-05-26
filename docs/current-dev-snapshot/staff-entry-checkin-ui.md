# Staff Entry Check-in UI

## Route

- `/staff`
- Page file: `src/app/(protected)/staff/page.tsx`
- Feature component: `src/features/staff/entry-check-in.tsx`

## API Used

```http
POST /staff/parking-sessions/check-in
```

Frontend service:

- `src/service/staff/api.ts`
- Uses existing `apiClient`, auth token injection, refresh handling, and backend `ApiResponse<T>` envelope.

## Request Shape

```ts
interface StaffCheckInRequest {
    plateNumber: string;
    cardCode: string;
    entryImageUrl?: string;
}
```

No parking/kiosk selector is rendered because the current requested endpoint does not require a parking or kiosk field. Tenant/kiosk/device context is expected to come from the authenticated staff session/device backend context.

## Response Shape Expected

```ts
interface StaffCheckInResponse {
    plateNumber: string;
    cardCode: string;
    assignedSlotCode: string;
    zoneName: string;
    entryTime: string;
    status: string;
}
```

On success, the UI shows:

- plate number
- card code
- assigned slot code
- zone name
- entry time
- status
- message: `Đã giữ chỗ và mở rào giả lập`

## Error Handling

The UI handles normalized `ApiError` from `src/lib/api/axios-config.ts`.

Covered cases:

- card not found
- card already in use
- no available slot
- unauthorized `401`
- forbidden `403`

Because exact backend error codes for card/session failures are not documented in this repo yet, non-auth cases are currently detected from backend error messages.

## Known Limitations

- Real camera capture is not implemented.
- Real image upload is not implemented; MVP accepts an optional image URL only.
- No PWA, payment, exit cashier, AI, or live monitor behavior is included.
- No mock data is used.
- Parking/kiosk selection is intentionally omitted until the backend contract requires request fields for it.
