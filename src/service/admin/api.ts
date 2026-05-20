import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    AdminDashboardStatsResponse,
    ApiPageResponse,
    ProvisionTenantRequest,
    RoleItem,
    TenantItem,
    UpsertVehicleTypeRequest,
    VehicleTypeItem,
} from './type';

const ADMIN_ENDPOINT = '/admin';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

export const adminQueryKeys = {
    dashboardStats: ['admin', 'dashboard-stats'] as const,
    tenants: ['admin', 'tenants'] as const,
    tenantList: (page: number, size: number) =>
        ['admin', 'tenants', { page, size }] as const,
    vehicleTypes: ['admin', 'vehicle-types'] as const,
    roles: ['admin', 'roles'] as const,
};

export const getDashboardStats = async () => {
    const response = await apiClient.get<
        ApiResponse<AdminDashboardStatsResponse>
    >(`${ADMIN_ENDPOINT}/dashboard/stats`);

    return getApiResult(response);
};

export const getTenants = async (page: number, size: number) => {
    const response = await apiClient.get<
        ApiResponse<ApiPageResponse<TenantItem>>
    >(`${ADMIN_ENDPOINT}/tenants`, {
        params: {
            page,
            size,
        },
    });

    return getApiResult(response);
};

export const provisionTenant = async (data: ProvisionTenantRequest) => {
    const response = await apiClient.post<ApiResponse<TenantItem>>(
        `${ADMIN_ENDPOINT}/tenants`,
        data,
    );

    return getApiResult(response);
};

export const toggleTenantStatus = async (id: string) => {
    const response = await apiClient.patch<ApiResponse<TenantItem>>(
        `${ADMIN_ENDPOINT}/tenants/${id}/status`,
    );

    return getApiResult(response);
};

export const getVehicleTypes = async () => {
    const response = await apiClient.get<ApiResponse<VehicleTypeItem[]>>(
        `${ADMIN_ENDPOINT}/master-data/vehicle-types`,
    );

    return getApiResult(response);
};

export const createVehicleType = async (data: UpsertVehicleTypeRequest) => {
    const response = await apiClient.post<ApiResponse<VehicleTypeItem>>(
        `${ADMIN_ENDPOINT}/master-data/vehicle-types`,
        data,
    );

    return getApiResult(response);
};

export const updateVehicleType = async (
    id: string,
    data: UpsertVehicleTypeRequest,
) => {
    const response = await apiClient.put<ApiResponse<VehicleTypeItem>>(
        `${ADMIN_ENDPOINT}/master-data/vehicle-types/${id}`,
        data,
    );

    return getApiResult(response);
};

export const deleteVehicleType = async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(
        `${ADMIN_ENDPOINT}/master-data/vehicle-types/${id}`,
    );

    return getApiResult(response);
};

export const getRoles = async () => {
    const response = await apiClient.get<ApiResponse<RoleItem[]>>(
        `${ADMIN_ENDPOINT}/master-data/roles`,
    );

    return getApiResult(response);
};
