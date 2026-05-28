import type { AxiosResponse } from 'axios';

import apiClient, { type ApiResponse } from '@/lib/api/axios-config';
import type {
    AdminDeviceFilters,
    AdminDeviceItem,
    AdminPageResult,
    AdminSessionFilters,
    AdminSessionItem,
    AuditLogFilters,
    AuditLogItem,
    ErrorFilters,
    PermissionScopeNode,
    ReplaceRolePermissionsRequest,
    ReplaceRolePermissionsResponse,
    SystemAdminRoleItem,
    SystemHealthErrorItem,
    SystemHealthServiceItem,
    SystemHealthSummary,
    SystemTopEndpoint,
    SystemTrafficPoint,
    TopEndpointFilters,
    TrafficFilters,
} from '@/service/admin/system-admin-type';
import type { ApiPageResponse } from '@/service/admin/type';

const ADMIN_ENDPOINT = '/admin';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

const normalizePage = <T>(
    result: ApiPageResponse<T> | T[],
    page = 0,
    size = 20,
): AdminPageResult<T> => {
    if (Array.isArray(result)) {
        return {
            content: result,
            page,
            size,
            totalElements: result.length,
            totalPages: result.length > 0 ? 1 : 0,
        };
    }

    return result;
};

const compactParams = (params: object) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value != null),
    );

export const systemAdminQueryKeys = {
    roles: ['admin-roles'] as const,
    permissionTree: ['admin-permission-tree'] as const,
    rolePermissions: (roleId: string) =>
        ['admin-role-permissions', roleId] as const,
    healthSummary: ['admin-health-summary'] as const,
    healthServices: ['admin-health-services'] as const,
    traffic: (from: string, to: string, granularity: string) =>
        ['admin-traffic', from, to, granularity] as const,
    topEndpoints: (from: string, to: string, limit: number) =>
        ['admin-top-endpoints', from, to, limit] as const,
    healthErrors: (from: string, to: string) =>
        ['admin-health-errors', from, to] as const,
    auditLogs: (
        actorId: string,
        role: string,
        severity: string,
        from: string,
        to: string,
        page: number,
        size: number,
    ) =>
        [
            'admin-audit-logs',
            actorId,
            role,
            severity,
            from,
            to,
            page,
            size,
        ] as const,
    sessions: (
        tenantId: string,
        role: string,
        status: string,
        page: number,
        size: number,
    ) => ['admin-sessions', tenantId, role, status, page, size] as const,
    devices: (tenantId: string, status: string, page: number, size: number) =>
        ['admin-devices', tenantId, status, page, size] as const,
};

export const getSystemAdminRolesApi = async () => {
    const response =
        await apiClient.get<ApiResponse<SystemAdminRoleItem[]>>(
            `${ADMIN_ENDPOINT}/roles`,
        );

    return getApiResult(response);
};

export const getPermissionTreeApi = async () => {
    const response =
        await apiClient.get<ApiResponse<PermissionScopeNode[]>>(
            `${ADMIN_ENDPOINT}/permissions/tree`,
        );

    return getApiResult(response);
};

export const getRolePermissionsApi = async (roleId: string) => {
    const response =
        await apiClient.get<ApiResponse<PermissionScopeNode[]>>(
            `${ADMIN_ENDPOINT}/roles/${roleId}/permissions`,
        );

    return getApiResult(response);
};

export const replaceRolePermissionsApi = async (
    roleId: string,
    data: ReplaceRolePermissionsRequest,
) => {
    const response = await apiClient.put<
        ApiResponse<ReplaceRolePermissionsResponse>
    >(`${ADMIN_ENDPOINT}/roles/${roleId}/permissions`, data);

    return getApiResult(response);
};

export const getSystemHealthSummaryApi = async () => {
    const response =
        await apiClient.get<ApiResponse<SystemHealthSummary>>(
            `${ADMIN_ENDPOINT}/system-health/summary`,
        );

    return getApiResult(response);
};

export const getSystemHealthServicesApi = async () => {
    const response =
        await apiClient.get<ApiResponse<SystemHealthServiceItem[]>>(
            `${ADMIN_ENDPOINT}/system-health/services`,
        );

    return getApiResult(response);
};

export const getSystemHealthTrafficApi = async (filters: TrafficFilters) => {
    const response =
        await apiClient.get<ApiResponse<SystemTrafficPoint[]>>(
            `${ADMIN_ENDPOINT}/system-health/traffic`,
            { params: filters },
        );

    return getApiResult(response);
};

export const getSystemHealthTopEndpointsApi = async (
    filters: TopEndpointFilters,
) => {
    const response =
        await apiClient.get<ApiResponse<SystemTopEndpoint[]>>(
            `${ADMIN_ENDPOINT}/system-health/top-endpoints`,
            { params: filters },
        );

    return getApiResult(response);
};

export const getSystemHealthErrorsApi = async (filters: ErrorFilters) => {
    const response =
        await apiClient.get<ApiResponse<SystemHealthErrorItem[]>>(
            `${ADMIN_ENDPOINT}/system-health/errors`,
            { params: filters },
        );

    return getApiResult(response);
};

export const getAuditLogsApi = async (filters: AuditLogFilters) => {
    const response = await apiClient.get<
        ApiResponse<ApiPageResponse<AuditLogItem> | AuditLogItem[]>
    >(`${ADMIN_ENDPOINT}/audit/logs`, {
        params: compactParams(filters),
    });

    return normalizePage(
        getApiResult(response),
        filters.page ?? 0,
        filters.size ?? 20,
    );
};

export const getAdminSessionsApi = async (filters: AdminSessionFilters) => {
    const response = await apiClient.get<
        ApiResponse<ApiPageResponse<AdminSessionItem> | AdminSessionItem[]>
    >(`${ADMIN_ENDPOINT}/sessions`, {
        params: compactParams(filters),
    });

    return normalizePage(
        getApiResult(response),
        filters.page ?? 0,
        filters.size ?? 20,
    );
};

export const getAdminDevicesApi = async (filters: AdminDeviceFilters) => {
    const response = await apiClient.get<
        ApiResponse<ApiPageResponse<AdminDeviceItem> | AdminDeviceItem[]>
    >(`${ADMIN_ENDPOINT}/devices`, {
        params: compactParams(filters),
    });

    return normalizePage(
        getApiResult(response),
        filters.page ?? 0,
        filters.size ?? 20,
    );
};

export const revokeAdminSessionApi = async (
    sessionId: string,
    reason: string,
) => {
    const response = await apiClient.post<ApiResponse<unknown>>(
        `${ADMIN_ENDPOINT}/sessions/${sessionId}/revoke`,
        { reason },
    );

    return getApiResult(response);
};

export const forceLogoutAdminUserApi = async (
    userId: string,
    reason: string,
) => {
    const response = await apiClient.post<ApiResponse<unknown>>(
        `${ADMIN_ENDPOINT}/users/${userId}/force-logout`,
        { reason },
    );

    return getApiResult(response);
};

export const revokeAdminDeviceApi = async (
    deviceId: string,
    reason: string,
) => {
    const response = await apiClient.post<ApiResponse<unknown>>(
        `${ADMIN_ENDPOINT}/devices/${deviceId}/revoke`,
        { reason },
    );

    return getApiResult(response);
};
