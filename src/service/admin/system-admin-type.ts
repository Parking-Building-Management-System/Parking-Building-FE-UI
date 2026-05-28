import type { ApiPageResponse } from '@/service/admin/type';

export interface PermissionActionNode {
    id: string;
    action: string;
    selected?: boolean;
}

export interface PermissionLabelNode {
    label: string;
    actions: PermissionActionNode[];
}

export interface PermissionResourceNode {
    resource: string;
    labels: PermissionLabelNode[];
}

export interface PermissionModuleNode {
    module: string;
    resources: PermissionResourceNode[];
}

export interface PermissionScopeNode {
    scope: string;
    modules: PermissionModuleNode[];
}

export interface ReplaceRolePermissionsRequest {
    permissionIds: string[];
}

export interface ReplaceRolePermissionsResponse {
    roleId: string;
    permissionCount: number;
}

export interface SystemAdminRoleItem {
    id: string;
    name: string;
    description?: string | null;
    desc?: string | null;
}

export interface SystemHealthSummary {
    status: string;
    uptimeSeconds: number;
    totalRequests: number;
    errorRate: number;
    avgLatencyMs: number;
    activeTenants: number;
    activeSessions: number;
    timestamp?: string | null;
}

export interface SystemHealthServiceItem {
    name: string;
    status: 'UP' | 'DOWN' | 'DEGRADED' | 'UNCONFIGURED' | string;
    latencyMs?: number | null;
    lastCheckedAt?: string | null;
    message?: string | null;
}

export interface SystemTrafficPoint {
    timestamp: string;
    requestCount: number;
    errorCount: number;
    avgLatencyMs: number;
}

export interface SystemTopEndpoint {
    method: string;
    path: string;
    requestCount: number;
    errorCount: number;
    avgLatencyMs: number;
}

export interface SystemHealthErrorItem {
    timestamp?: string | null;
    method?: string | null;
    path?: string | null;
    status?: number | null;
    errorCode?: string | null;
    message?: string | null;
    count?: number | null;
}

export interface AuditLogItem {
    id: string;
    tenantId?: string | null;
    tenantName?: string | null;
    actorId?: string | null;
    actorUsername?: string | null;
    actorRole?: string | null;
    action?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
    severity?: string | null;
    reason?: string | null;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    createdAt?: string | null;
}

export interface AdminSessionItem {
    id: string;
    userId: string;
    username: string;
    role?: string | null;
    tenantId?: string | null;
    tenantName?: string | null;
    deviceId?: string | null;
    deviceLabel?: string | null;
    status?: string | null;
    createdAt?: string | null;
    expiresAt?: string | null;
    revokedAt?: string | null;
}

export interface AdminDeviceItem {
    id: string;
    userId: string;
    username?: string | null;
    tenantId?: string | null;
    tenantName?: string | null;
    fingerprint?: string | null;
    label?: string | null;
    status?: string | null;
    kioskId?: string | null;
    kioskName?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    expiresAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface AuditLogFilters {
    actorId?: string;
    role?: string;
    severity?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}

export interface AdminSessionFilters {
    tenantId?: string;
    role?: string;
    status?: string;
    page?: number;
    size?: number;
}

export interface AdminDeviceFilters {
    tenantId?: string;
    status?: string;
    page?: number;
    size?: number;
}

export interface TrafficFilters {
    from: string;
    to: string;
    granularity: string;
}

export interface TopEndpointFilters {
    from: string;
    to: string;
    limit: number;
}

export interface ErrorFilters {
    from: string;
    to: string;
}

export type AdminPageResult<T> = ApiPageResponse<T>;

