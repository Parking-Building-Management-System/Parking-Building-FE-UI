# Staff Entry Available Card Dropdown UI

## Route

- `/staff`

## Endpoint

- `GET /staff/rfid-cards/available?search={search}&limit=50`

## Behavior

- Staff Entry loads available active RFID cards for the current staff context when the page opens.
- The card selector is searchable and refetchable.
- Selecting a card writes its code into the existing `cardCode` form field.
- Manual `cardCode` input remains available as a fallback.
- Check-in request contract is unchanged: the UI still sends `cardCode`.
- After successful check-in, `['staff-available-rfid-cards']` is invalidated so the selected card drops out of the available list.
- The dropdown only displays card label or code and does not expose QR tokens.

## UI States

- Loading: shows a small loading hint below the selector.
- Empty: shows “No available cards. Ask manager to generate or release cards.”
- Error: shows that manual entry is still available.
- Success: existing check-in success and PWA handoff flow remains unchanged.

## Files Changed

- `src/features/staff/entry-check-in.tsx`
- `src/service/staff/api.ts`
- `src/service/staff/type.ts`
- `src/service/staff/index.ts`
