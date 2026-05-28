# System Admin Real API Integration

## Pages Wired

- `/admin/master-data/roles-permissions`
- `/admin/system-health/api`
- `/admin/system-health/traffic`
- `/admin/audit/logs`
- `/admin/audit/sessions`

Existing tenant management and vehicle type CRUD flows are unchanged.

## Endpoint Map

Roles and permissions:

- `GET /admin/roles`
- `GET /admin/permissions/tree`
- `GET /admin/roles/{roleId}/permissions`
- `PUT /admin/roles/{roleId}/permissions`

System health:

- `GET /admin/system-health/summary`
- `GET /admin/system-health/services`
- `GET /admin/system-health/traffic?from=&to=&granularity=`
- `GET /admin/system-health/top-endpoints?from=&to=&limit=`
- `GET /admin/system-health/errors?from=&to=`

Audit and security:

- `GET /admin/audit/logs?actorId=&role=&severity=&from=&to=&page=&size=`
- `GET /admin/sessions?tenantId=&role=&status=&page=&size=`
- `POST /admin/sessions/{sessionId}/revoke`
- `POST /admin/users/{userId}/force-logout`
- `GET /admin/devices?tenantId=&status=&page=&size=`
- `POST /admin/devices/{deviceId}/revoke`

## Response Normalization

All services use the existing authenticated axios client and unwrap `response.data.result`.

List APIs that may return either a page object or a raw array are normalized to:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

Query keys are stable and primitive:

- `['admin-permission-tree']`
- `['admin-role-permissions', roleId]`
- `['admin-health-summary']`
- `['admin-health-services']`
- `['admin-traffic', from, to, granularity]`
- `['admin-audit-logs', actorId, role, severity, from, to, page, size]`
- `['admin-sessions', tenantId, role, status, page, size]`
- `['admin-devices', tenantId, status, page, size]`

## Remaining Pending Parts

Permission definition create/edit/delete endpoints exist, but this pass only wires role permission assignment. Permission definition CRUD is intentionally not exposed yet to keep the UI focused and avoid a larger metadata editor without product review.

The `/admin` dashboard still contains pre-existing mock summary panels that are outside this API integration slice.

## Manual Test Checklist

1. Login as `SYSTEM_ADMIN`.
2. Open `/admin/master-data/roles-permissions`; roles should load from `GET /admin/roles`.
3. Select a role; permission tree should load from `GET /admin/roles/{roleId}/permissions`.
4. Toggle permission actions and save; UI should call `PUT /admin/roles/{roleId}/permissions` and refetch.
5. Open `/admin/system-health/api`; summary and service checks should load from real APIs.
6. Open `/admin/system-health/traffic`; traffic, top endpoints, and recent errors should load or show real empty states.
7. Open `/admin/audit/logs`; logs should load or show a real empty state.
8. Open `/admin/audit/sessions`; sessions and devices should load.
9. Revoke session/device and force logout actions should confirm, call the real API, and refetch.
10. `PARKING_MANAGER` and `STAFF` should remain blocked by existing route guard behavior.

## Files Changed

- `src/service/admin/system-admin-api.ts`
- `src/service/admin/system-admin-type.ts`
- `src/features/admin/master-data-config.tsx`
- `src/features/admin/system-health-pages.tsx`
- `src/features/admin/audit-security-pages.tsx`
- `docs/current-dev-snapshot/system-admin-real-api-integration.md`

