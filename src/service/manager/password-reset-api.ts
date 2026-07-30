import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    CompleteManagerPasswordResetRequest,
    ManagerPasswordResetListParams,
    ManagerPasswordResetPageResponse,
    ManagerPasswordResetRequestItem,
    RejectManagerPasswordResetRequest,
} from './password-reset-type';

const PASSWORD_RESET_ENDPOINT = '/manager/password-reset-requests';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

export const managerPasswordResetQueryKeys = {
    all: ['manager', 'password-reset-requests'] as const,
    lists: ['manager', 'password-reset-requests', 'list'] as const,
    list: (params: ManagerPasswordResetListParams) =>
        [
            'manager',
            'password-reset-requests',
            'list',
            params.status ?? 'ALL_STATUSES',
            params.search ?? '',
            params.from ?? '',
            params.to ?? '',
            params.page ?? 0,
            params.size ?? 20,
        ] as const,
    detail: (id: string) =>
        ['manager', 'password-reset-requests', 'detail', id] as const,
};

export const listManagerPasswordResetRequestsApi = async (
    params: ManagerPasswordResetListParams,
) => {
    const response = await apiClient.get<
        ApiResponse<ManagerPasswordResetPageResponse>
    >(PASSWORD_RESET_ENDPOINT, { params });

    return getApiResult(response);
};

export const getManagerPasswordResetRequestApi = async (id: string) => {
    const response = await apiClient.get<
        ApiResponse<ManagerPasswordResetRequestItem>
    >(`${PASSWORD_RESET_ENDPOINT}/${id}`);

    return getApiResult(response);
};

export const completeManagerPasswordResetRequestApi = async (
    id: string,
    data: CompleteManagerPasswordResetRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<ManagerPasswordResetRequestItem>,
        AxiosResponse<ApiResponse<ManagerPasswordResetRequestItem>>,
        CompleteManagerPasswordResetRequest
    >(`${PASSWORD_RESET_ENDPOINT}/${id}/complete`, data);

    return getApiResult(response);
};

export const rejectManagerPasswordResetRequestApi = async (
    id: string,
    data: RejectManagerPasswordResetRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<ManagerPasswordResetRequestItem>,
        AxiosResponse<ApiResponse<ManagerPasswordResetRequestItem>>,
        RejectManagerPasswordResetRequest
    >(`${PASSWORD_RESET_ENDPOINT}/${id}/reject`, data);

    return getApiResult(response);
};
