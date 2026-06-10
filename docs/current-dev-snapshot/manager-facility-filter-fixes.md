# Manager Facility Filter Fixes

Date: 2026-06-10

## Slots

- `/manager/facility/slots` keeps parking, floor, and zone filter state as IDs.
- Changing parking resets floor and zone to `All`.
- Changing floor resets zone to `All`.
- Floor options are loaded from `GET /manager/parkings/{parkingId}/floors`.
- Zone options are loaded only after a specific floor is selected.
- `GET /manager/slots` params are normalized before request:
    - empty `parkingId`, `floorId`, `zoneId`, `status`, and `slotCode` are omitted
    - `slotCode` is trimmed
    - `exact` is sent only with a non-empty `slotCode`
    - pagination params remain explicit
- Slot query keys include primitive `parkingId`, `floorId`, `zoneId`, `status`, search, `exact`, `page`, and `size` values.
- The selected/total display uses `0 selected · 354 total` format and does not render a minus sign before total.

## Zones

- `/manager/facility/zones` loads vehicle types from real manager master data:
    - `GET /manager/master-data/vehicle-types`
- The mapper accepts active boolean data and status-based active data, then the form shows only active vehicle types.
- Create/edit zone submits `vehicleTypeCode`, matching the manager zone API contract.
- If vehicle types fail to load, the dialog shows an inline error and disables Save.
- If no active vehicle types exist, the dialog shows:
    - `No active vehicle types. Please ask System Admin to configure master data.`
- Zone form validation covers required code, required name, required vehicle type, integer capacity, non-negative capacity, and status.

## Manual Verification Checklist

1. Open `/manager/facility/zones`, open Create Zone, and confirm Vehicle Type options display readable names from master data.
2. Create or edit a zone with a selected vehicle type and confirm backend validation errors are shown meaningfully if the request fails.
3. Open `/manager/facility/slots`, select a parking, and confirm `GET /manager/slots` includes `parkingId`.
4. Select a floor and confirm `GET /manager/slots` includes `parkingId` and `floorId`.
5. Select a zone and confirm `GET /manager/slots` includes `zoneId`.
6. Clear dependent filters and confirm empty params are omitted.
7. Confirm slot table rows match the selected parking/floor/zone filters when the backend honors those params.
8. Confirm total text renders with a middle dot separator and no negative sign.
