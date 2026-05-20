# SmartPark SYSTEM_ADMIN API Contract

Generated on: 2026-05-20

All successful backend responses are expected to use this envelope:

```ts
interface ApiResponse<T> {
    code: 1000;
    message: string;
    result: T;
}
```

Validation failures are expected to use `code: 4000`, `message`, and an `errors` map.

## Shared Pagination

```ts
export interface ApiPageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}
```

## Dashboard

Endpoint:

```txt
GET /admin/dashboard/stats
```

Response:

```ts
export interface AdminDashboardStatsResponse {
    activeTenantCount: number;
    parkingCount: number;
    traffic: AdminTrafficPoint[];
}

export interface AdminTrafficPoint {
    bucketStart: string;
    requestCount: number;
    errorCount: number;
    averageDurationMs: number;
}
```

## Tenant Management

Endpoints:

```txt
GET /admin/tenants?page={page}&size={size}
POST /admin/tenants
PATCH /admin/tenants/{id}/status
```

Response item:

```ts
export type TenantStatus = 'ACTIVE' | 'SUSPENDED';

export interface TenantItem {
    id: string;
    name: string;
    slug: string;
    emailContact: string;
    status: TenantStatus;
    createdAt: string;
}
```

List response:

```ts
ApiPageResponse<TenantItem>;
```

Provision request:

```ts
export interface ProvisionTenantRequest {
    companyName: string;
    managerEmail: string;
    initialPassword: string;
}
```

Frontend validation:

```ts
companyName: required, max 255
managerEmail: required, email, max 255
initialPassword: required, min 8, max 72
```

## Vehicle Types

Endpoints:

```txt
GET /admin/master-data/vehicle-types
POST /admin/master-data/vehicle-types
PUT /admin/master-data/vehicle-types/{id}
DELETE /admin/master-data/vehicle-types/{id}
```

Response item:

```ts
export interface VehicleTypeItem {
    id: string;
    name: string;
    code: string;
    active: boolean;
    createdAt?: string;
}
```

Create/update request:

```ts
export interface UpsertVehicleTypeRequest {
    name: string;
    code: string;
    active: boolean;
}
```

Frontend validation:

```ts
name: required, max 100
code: required, max 50
active: boolean
```

## Roles

Endpoint:

```txt
GET /admin/master-data/roles
```

Response item:

```ts
export interface RoleItem {
    id: string;
    name: string;
    desc: string;
}
```
