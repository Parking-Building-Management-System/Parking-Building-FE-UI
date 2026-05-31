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

Flow 2A-2 adds a checkout quote panel under the map.

## Endpoint Map

```http
GET /pwa/cards/{qrToken}/checkout-quote
```

The endpoint uses the same public axios style as the active-session endpoint. It does not use auth headers or refresh-token behavior.

## Quote Panel Behavior

The panel shows:

- check-in time
- duration
- current amount and currency
- pricing rule name
- pricing breakdown rows
- quote timestamp
- manual refresh button
- disabled `Pay & Exit` CTA

The CTA is disabled with the message `Online payment is coming next.` Payment, VietQR, webhook, and checkout mutation flows are intentionally not implemented.

## States

- loading: shows quote loading state
- error: shows clean quote API error state without breaking the active-session guide
- `NO_PRICING_RULE`: asks driver to contact parking staff
- `NO_ACTIVE_SESSION`: states that no active session exists
- active quote loaded: shows amount, duration, rule, breakdown, timestamp, disabled Pay & Exit

## Query Safety

- Query key: `['pwa-checkout-quote', qrToken]`
- No polling
- Manual refresh only
- Existing active-session query/map behavior is unchanged

## Files Changed

- `src/service/pwa/api.ts`
- `src/service/pwa/type.ts`
- `src/features/pwa/card-active-session-guide.tsx`
- `docs/current-dev-snapshot/pwa-checkout-quote-ui.md`
