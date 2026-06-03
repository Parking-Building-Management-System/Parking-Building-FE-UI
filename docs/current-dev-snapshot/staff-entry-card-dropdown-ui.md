# Staff Entry Available Card Dropdown UI

## Route

- `/staff`

## Endpoint

- `GET /staff/rfid-cards/available?search={search}&limit=50`
- When search is blank or whitespace-only, the UI omits `search` and sends only `limit=50`.

## Behavior

- Staff Entry loads available active RFID cards for the current staff context when the page opens.
- The card selector is searchable and refetchable.
- Search text is trimmed before it is used for request params and React Query cache keys, so whitespace-only searches reuse the empty-search query.
- Selecting a card writes its code into the existing `cardCode` form field.
- Manual `cardCode` input remains available as a fallback.
- Check-in request contract is unchanged: the UI still sends `cardCode`.
- After successful check-in, `['staff-available-rfid-cards']` is invalidated so the selected card drops out of the available list after the backend marks it unavailable.
- The dropdown only displays card label or code and does not expose QR tokens.

## Live Smoke Checklist

Requires a valid staff session against the live backend.

- `/staff` loads the available RFID card dropdown on the Entry Check-in card.
- Blank search calls `GET /staff/rfid-cards/available` without `search=`.
- Non-blank search sends the trimmed search value and filters available cards.
- Successful check-in invalidates the available-card query.
- After check-in, the selected card no longer appears in the dropdown once the list refetches.

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
