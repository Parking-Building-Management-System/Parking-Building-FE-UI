# PWA PayOS Payment UI

Date: 2026-05-31

## Scope

Flow 2B enables the public PWA checkout page to create and continue PayOS
payment intents for an active RFID card parking session. The UI does not require
login, does not expose PayOS secrets, and does not mark payments successful on
the client.

## Routes

```text
/pwa/c/[qrToken]
/pwa/payment/success
/pwa/payment/cancel
```

The existing `/pwa/c/[qrToken]` active-session guide remains in place,
including session details, map image, and slot pin.

## Endpoint Map

```http
GET /pwa/cards/{qrToken}/checkout-quote
POST /pwa/cards/{qrToken}/payment-intents
GET /pwa/payment-intents/{orderCode}
```

All calls use the public PWA axios client without auth headers.

## Query Keys

```ts
['pwa-checkout-quote', qrToken][('pwa-payment-intent', orderCode)];
```

## PWA States

- Quote loading/error: shows a contained quote state without breaking the active
  session guide.
- Active unpaid quote: shows amount, duration, pricing rule, breakdown, and
  `Pay & Exit`.
- Payment provider disabled: keeps payment disabled and shows
  `Online payment is not available right now.`
- Continue payment: shows the existing order code/status and PayOS checkout
  actions.
- Payment pending: shows amount, currency, order code, card/plate, pending
  badge, checkout URL, copy action, optional QR, manual refresh, and polling.
- Paid: shows green success state with amount, `paidAt`, `exitDeadline`,
  countdown, plate/card, and the instruction to exit within the grace period.
- Failed/cancelled/expired: shows a terminal payment state and allows creating a
  new intent if the backend supports it.

## Pay & Exit Behavior

When `paymentAvailable=true` and `nextAction=CREATE_PAYMENT_INTENT`, the CTA
calls:

```http
POST /pwa/cards/{qrToken}/payment-intents
```

On success, the UI switches to the pending payment state using the returned
`orderCode`, `checkoutUrl`, and optional `qrCode`. The PayOS checkout button
opens the provider URL in a new tab/window. The copy button writes the payment
link to the clipboard.

When `nextAction=CONTINUE_PAYMENT`, the UI reuses
`existingPaymentIntent.orderCode` and `existingPaymentIntent.checkoutUrl`.

## Polling Behavior

The pending payment state polls:

```http
GET /pwa/payment-intents/{orderCode}
```

Polling runs every few seconds only while the status is pending. It stops when
the status becomes `PAID`, `FAILED`, `CANCELLED`, or `EXPIRED`. A manual refresh
button is also available.

## Paid Success Behavior

The success state is shown when payment status becomes `PAID` from payment
status polling or when the checkout quote returns `paymentStatus=PAID` /
`nextAction=EXIT_WITHIN_GRACE_PERIOD`.

If `exitDeadline` is in the past, the UI warns:

```text
Grace period expired. Please go to the exit cashier for surcharge handling.
```

No surcharge flow is implemented.

## Return And Cancel Routes

`/pwa/payment/success` and `/pwa/payment/cancel` are public routes. If the query
string contains `orderCode`, `code`, or `id`, the page attempts to fetch payment
status. Otherwise it shows:

```text
Return to your parking card page to refresh payment status.
```

The UI does not assume PayOS query parameters beyond this best-effort status
lookup.

## Error Handling

Friendly messages are shown for:

- `PAYOS_NOT_CONFIGURED`
- `PAYMENT_PROVIDER_DISABLED`
- `PRICING_RULE_NOT_CONFIGURED`
- `NO_ACTIVE_SESSION_FOR_CARD`
- `CARD_QR_NOT_FOUND`
- `CARD_NOT_ACTIVE`
- `SESSION_ALREADY_PAID`
- expired, failed, or cancelled payment intents
- network errors

## Limitations

- No Staff Exit Gate completion.
- No surcharge implementation.
- No subscriptions.
- No invoices.
- No fake payment success.
- No global payment polling.

## Files Changed

- `src/service/pwa/type.ts`
- `src/service/pwa/api.ts`
- `src/features/pwa/card-active-session-guide.tsx`
- `src/features/pwa/payment-return-page.tsx`
- `src/app/pwa/payment/success/page.tsx`
- `src/app/pwa/payment/cancel/page.tsx`
- `docs/current-dev-snapshot/pwa-payos-payment-ui.md`
- `docs/current-dev-snapshot/pwa-checkout-quote-ui.md`
