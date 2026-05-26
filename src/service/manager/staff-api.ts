import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    CreateManagerStaffRequest,
    ManagerStaffItem,
    ManagerStaffListParams,
    ManagerStaffPageResponse,
    ResetManagerStaffPasswordRequest,
    UpdateManagerStaffRequest,
    UpdateManagerStaffStatusRequest,
} from './staff-type';

const MANAGER_ENDPOINT = '/manager';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

export const managerStaffQueryKeys = {
    staff: ['manager', 'staff'] as const,
    staffList: (params: ManagerStaffListParams) =>
        ['manager', 'staff', params] as const,
    staffDetail: (id: string) => ['manager', 'staff', id] as const,
};

export const listManagerStaffApi = async (
    params: ManagerStaffListParams,
) => {
    const response = await apiClient.get<ApiResponse<ManagerStaffPageResponse>>(
        `${MANAGER_ENDPOINT}/staff`,
        { params },
    );
    const result = getApiResult(response);

    return {
        content: result.content,
        page: result.page,
        size: result.size,
        totalElements: result.totalElements,
    };
};

export const createManagerStaffApi = async (
    data: CreateManagerStaffRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<ManagerStaffItem>,
        AxiosResponse<ApiResponse<ManagerStaffItem>>,
        CreateManagerStaffRequest
    >(`${MANAGER_ENDPOINT}/staff`, data);

    return getApiResult(response);
};

export const getManagerStaffApi = async (id: string) => {
    const response = await apiClient.get<ApiResponse<ManagerStaffItem>>(
        `${MANAGER_ENDPOINT}/staff/${id}`,
    );

    return getApiResult(response);
};

export const updateManagerStaffApi = async (
    id: string,
    data: UpdateManagerStaffRequest,
) => {
    const response = await apiClient.put<
        ApiResponse<ManagerStaffItem>,
        AxiosResponse<ApiResponse<ManagerStaffItem>>,
        UpdateManagerStaffRequest
    >(`${MANAGER_ENDPOINT}/staff/${id}`, data);

    return getApiResult(response);
};

export const updateManagerStaffStatusApi = async (
    id: string,
    data: UpdateManagerStaffStatusRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<ManagerStaffItem>,
        AxiosResponse<ApiResponse<ManagerStaffItem>>,
        UpdateManagerStaffStatusRequest
    >(`${MANAGER_ENDPOINT}/staff/${id}/status`, data);

    return getApiResult(response);
};

export const resetManagerStaffPasswordApi = async (
    id: string,
    data: ResetManagerStaffPasswordRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<ManagerStaffItem>,
        AxiosResponse<ApiResponse<ManagerStaffItem>>,
        ResetManagerStaffPasswordRequest
    >(`${MANAGER_ENDPOINT}/staff/${id}/reset-password`, data);

    return getApiResult(response);
};
