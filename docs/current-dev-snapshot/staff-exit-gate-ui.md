# Staff Exit Gate UI

Date: 2026-05-31

## Route

```text
/staff/exit
```

The route is protected by the existing staff layout and uses the existing staff
sidebar. `/staff` remains the Entry Gate page.

## Endpoints

```http
POST /staff/parking-sessions/exit-preview
POST /staff/parking-sessions/complete-exit
```

Both calls use the authenticated staff API client. Kiosk/work context is
validated by the backend from the current staff session and device context.

## Request Shapes

Exit preview:

```json
{
    "cardCode": "BCONS-0004"
}
```

Complete exit:

```json
{
    "sessionId": "...",
    "cardCode": "BCONS-0004",
    "paymentMode": "ONLINE",
    "collectedAmount": 0,
    "note": "optional"
}
```

## UI States

- Initial: shows kiosk context, card input, Preview button, and empty preview
  guidance.
- Preview loading: disables scan controls and shows a loading icon.
- `exitDecision=ALLOW_EXIT`: green `PAID ONLINE` panel with plate, card, slot,
  paid time, exit deadline, amount paid, total amount, and `Complete Exit`.
- `exitDecision=COLLECT_CASH`: amber `Cash payment required` panel with amount due,
  duration, quote fields when returned, collected amount input defaulted to
  amount due, and `Collect Cash & Complete Exit`.
- `exitDecision=GRACE_EXPIRED_SURCHARGE`: red `Grace period expired` panel with
  exit deadline, surcharge amount, collected amount input defaulted to the
  surcharge, and `Collect Surcharge & Complete Exit`.
- `exitDecision=BLOCKED`: red error panel with the backend message or mapped
  backend code when returned.
- Completion success: green `Gate can open now` panel with plate, card, total
  amount, collected amount, check-out time, payment mode, slot status, card
  status, and `Scan next card`.

## Payment Mode Mapping

- `ALLOW_EXIT` -> `ONLINE`, `collectedAmount=0`
- `COLLECT_CASH` -> `CASH`
- `GRACE_EXPIRED_SURCHARGE` -> `SURCHARGE_CASH`
- `BLOCKED` -> no complete-exit call

## Error Handling

Friendly English messages are shown for:

- `NO_ACTIVE_SESSION_FOR_CARD`
- `SESSION_ALREADY_COMPLETED`
- `KIOSK_CONTEXT_REQUIRED`
- `STAFF_NOT_ASSIGNED_TO_KIOSK`
- `EXIT_KIOSK_REQUIRED`
- `SESSION_NOT_IN_KIOSK_PARKING`
- `PAYMENT_REQUIRED`
- `GRACE_PERIOD_EXPIRED`
- invalid card, 401, 403, and general network/server failures

## Keyboard Behavior

- Card input autofocuses when the screen opens.
- Pressing Enter in the card form triggers preview.
- Completion focuses `Scan next card`.
- `Scan next card` clears preview/completion and focuses card input again.

## Files Changed

- `src/service/staff/type.ts`
- `src/service/staff/api.ts`
- `src/features/staff/exit-cashier.tsx`
- `src/app/(protected)/staff/exit/page.tsx`
- `docs/current-dev-snapshot/staff-exit-gate-ui.md`

## Manual Test Checklist

1. `/staff` still opens Entry Gate.
2. `/staff/exit` opens Exit Cashier.
3. Card input calls `exit-preview`.
4. `ALLOW_EXIT` renders the green paid online state.
5. `COLLECT_CASH` renders the cash collection state.
6. `GRACE_EXPIRED_SURCHARGE` renders the surcharge state.
7. Complete exit calls `complete-exit` with the correct payment mode.
8. Success state renders and `Scan next card` resets the flow.
9. Staff sidebar highlights Exit Cashier only on `/staff/exit`.
10. Lint, typecheck, and build pass.

## Limitations

- No PayOS implementation changes.
- No subscriptions.
- No polling.
- No backend changes.
