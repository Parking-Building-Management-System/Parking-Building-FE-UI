# PWA Checkout Quote UI

Date: 2026-05-31

## Page Wired

Route:

```text
/pwa/c/[qrToken]
```

The existing active-session guide remains in place:

- session details
- check-in time when returned
- floor map image
- slot pin in the existing image wrapper

Flow 2B keeps the checkout quote panel under the map and enables PayOS online
payment when the backend quote says payment can be started or continued.

## Endpoint Map

```http
GET /pwa/cards/{qrToken}/checkout-quote
POST /pwa/cards/{qrToken}/payment-intents
GET /pwa/payment-intents/{orderCode}
```

The endpoints use the same public axios style as the active-session endpoint.
They do not use auth headers or refresh-token behavior.

## Quote Panel Behavior

The panel shows:

- check-in time
- duration
- current amount and currency
- pricing rule name
- pricing breakdown rows
- quote timestamp
- manual refresh button
- enabled `Pay & Exit` CTA when `paymentAvailable=true` and
  `nextAction=CREATE_PAYMENT_INTENT`

The quote mapper supports these payment-aware fields:

- `paymentAvailable`
- `nextAction`
- `paymentStatus`
- `paidAt`
- `exitDeadline`
- `existingPaymentIntent.orderCode`
- `existingPaymentIntent.status`
- `existingPaymentIntent.checkoutUrl`
- `existingPaymentIntent.expiresAt`

## Pay & Exit Behavior

- `CREATE_PAYMENT_INTENT`: the CTA calls
  `POST /pwa/cards/{qrToken}/payment-intents`, then switches to the payment
  pending screen.
- `CONTINUE_PAYMENT`: the UI shows the existing order code/status and reuses
  the stored checkout URL.
- `PAYMENT_PROVIDER_DISABLED`: the CTA stays disabled with
  `Online payment is not available right now.`
- `EXIT_WITHIN_GRACE_PERIOD` or `paymentStatus=PAID`: the UI shows the paid
  success state with `paidAt`, `exitDeadline`, and a countdown.

## States

- loading: shows quote loading state
- error: shows clean quote API error state without breaking the active-session guide
- `NO_PRICING_RULE`: asks driver to contact parking staff
- `NO_ACTIVE_SESSION`: states that no active session exists
- active quote loaded: shows amount, duration, rule, breakdown, timestamp, and
  payment action
- pending payment: shows amount, order code, plate/card, pending badge, PayOS
  checkout link actions, optional QR, manual refresh, and component-local status
  polling
- paid payment: shows green success state, paid time, exit deadline, countdown,
  plate/card, and exit instruction
- failed/cancelled/expired payment: shows a terminal payment message and allows
  creating a new intent if the backend accepts it

## Query Safety

- Query key: `['pwa-checkout-quote', qrToken]`
- Payment status query key: `['pwa-payment-intent', orderCode]`
- Quote has no polling
- Payment polling runs only in the pending payment UI every few seconds
- Payment polling stops once status is `PAID`, `FAILED`, `CANCELLED`, or
  `EXPIRED`
- Manual refresh remains available
- Existing active-session query/map behavior is unchanged

## Return Routes

Public routes:

```text
/pwa/payment/success
/pwa/payment/cancel
```

They do not require login or render the protected sidebar. If PayOS provides
`orderCode`, `code`, or `id`, the page attempts to load payment status. Without
an order identifier it tells the driver to return to the parking card page and
refresh payment status.

## Limitations

- No Staff Exit Gate completion.
- No surcharge implementation after the grace period.
- No subscriptions or invoices.
- The frontend does not fake payment success; `PAID` must come from the backend.

## Files Changed

- `src/service/pwa/api.ts`
- `src/service/pwa/type.ts`
- `src/features/pwa/card-active-session-guide.tsx`
- `src/features/pwa/payment-return-page.tsx`
- `src/app/pwa/payment/success/page.tsx`
- `src/app/pwa/payment/cancel/page.tsx`
- `docs/current-dev-snapshot/pwa-checkout-quote-ui.md`
