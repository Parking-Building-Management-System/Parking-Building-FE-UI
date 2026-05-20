export interface ApiPageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

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

export type TenantStatus = 'ACTIVE' | 'SUSPENDED';

export interface TenantItem {
    id: string;
    name: string;
    slug: string;
    emailContact: string;
    status: TenantStatus;
    createdAt: string;
}

export interface ProvisionTenantRequest {
    companyName: string;
    managerEmail: string;
    initialPassword: string;
}

export interface VehicleTypeItem {
    id: string;
    name: string;
    code: string;
    active: boolean;
    createdAt?: string;
}

export interface UpsertVehicleTypeRequest {
    name: string;
    code: string;
    active: boolean;
}

export interface RoleItem {
    id: string;
    name: string;
    desc: string;
}
