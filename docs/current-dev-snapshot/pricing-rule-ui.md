# Manager Pricing Rule UI

Date: 2026-05-31

## Pages Wired

| Route | UI | APIs |
| --- | --- | --- |
| `/manager/pricing` | Real overview derived from pricing rules | `GET /manager/pricing/rules` |
| `/manager/pricing/time-rules` | Real CRUD table, filters, form dialog, status/delete actions, preview calculator | Pricing rule CRUD + preview APIs |
| `/manager/pricing/matrix` | Real compact matrix derived from pricing rules | `GET /manager/pricing/rules` |

Subscriptions, invoices, and debts remain mock/API-pending and are outside Flow 2A-2.

## Endpoint Map

- `GET /manager/pricing/rules`
- `POST /manager/pricing/rules`
- `GET /manager/pricing/rules/{id}`
- `PUT /manager/pricing/rules/{id}`
- `PATCH /manager/pricing/rules/{id}/status`
- `DELETE /manager/pricing/rules/{id}`
- `POST /manager/pricing/rules/{id}/preview`

The frontend uses the authenticated manager API client and never sends `tenantId`.

## Form Fields

The Time Rules create/edit dialog sends:

- `name`
- `parkingId`, nullable for tenant default rules
- `vehicleTypeId`
- `freeMinutes`
- `firstBlockMinutes`
- `firstBlockPrice`
- `nextBlockMinutes`
- `nextBlockPrice`
- `dailyCapPrice`, nullable
- `graceMinutesAfterPayment`
- `status`

Validation enforces required name/vehicle type, non-negative prices/minutes, positive block minutes, and optional non-negative daily cap.

## Preview Calculator

The Time Rules page includes a preview calculator:

- select pricing rule
- enter check-in and check-out times
- calls `POST /manager/pricing/rules/{id}/preview`
- displays amount, duration, chargeable minutes, and breakdown rows

## Query Safety

- Query keys are primitive and stable.
- No polling is used.
- Mutations invalidate `manager-pricing-rules`.
- Overview and matrix derive from list APIs without mock data.

## Payment Limitation

Flow 2A-2 does not implement payment, VietQR, webhooks, invoices, debts, subscriptions, or Staff Exit Gate.

## Files Changed

- `src/service/manager/pricing-api.ts`
- `src/service/manager/pricing-type.ts`
- `src/service/manager/api.ts`
- `src/service/manager/type.ts`
- `src/features/manager/pricing-shared.tsx`
- `src/features/manager/pricing-overview.tsx`
- `src/features/manager/pricing-time-rules.tsx`
- `src/features/manager/pricing-preview-calculator.tsx`
- `src/features/manager/pricing-matrix.tsx`
- `src/app/(protected)/manager/pricing/page.tsx`
- `src/app/(protected)/manager/pricing/time-rules/page.tsx`
- `src/app/(protected)/manager/pricing/matrix/page.tsx`
