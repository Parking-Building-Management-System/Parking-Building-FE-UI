import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    PenaltyRuleListParams,
    PenaltyRulePageResponse,
    PenaltyRuleRequest,
    PenaltyRuleResponse,
    PenaltyRuleStatusRequest,
} from '@/service/manager/penalty-type';

const MANAGER_ENDPOINT = '/manager';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

export const managerPenaltyQueryKeys = {
    rules: ['manager-penalty-rules'] as const,
    ruleList: (params: PenaltyRuleListParams = {}) =>
        [
            'manager-penalty-rules',
            params.parkingId ?? 'ALL_PARKINGS',
            params.type ?? 'ALL_TYPES',
            params.status ?? 'ALL_STATUSES',
            params.page ?? 0,
            params.size ?? 20,
        ] as const,
    rule: (id: string) => ['manager-penalty-rule', id] as const,
};

export const listPenaltyRulesApi = async (
    params: PenaltyRuleListParams = {},
) => {
    const response = await apiClient.get<ApiResponse<PenaltyRulePageResponse>>(
        `${MANAGER_ENDPOINT}/penalty-rules`,
        { params },
    );

    return getApiResult(response);
};

export const createPenaltyRuleApi = async (data: PenaltyRuleRequest) => {
    const response = await apiClient.post<
        ApiResponse<PenaltyRuleResponse>,
        AxiosResponse<ApiResponse<PenaltyRuleResponse>>,
        PenaltyRuleRequest
    >(`${MANAGER_ENDPOINT}/penalty-rules`, data);

    return getApiResult(response);
};

export const updatePenaltyRuleApi = async (
    id: string,
    data: PenaltyRuleRequest,
) => {
    const response = await apiClient.put<
        ApiResponse<PenaltyRuleResponse>,
        AxiosResponse<ApiResponse<PenaltyRuleResponse>>,
        PenaltyRuleRequest
    >(`${MANAGER_ENDPOINT}/penalty-rules/${id}`, data);

    return getApiResult(response);
};

export const updatePenaltyRuleStatusApi = async (
    id: string,
    data: PenaltyRuleStatusRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<PenaltyRuleResponse>,
        AxiosResponse<ApiResponse<PenaltyRuleResponse>>,
        PenaltyRuleStatusRequest
    >(`${MANAGER_ENDPOINT}/penalty-rules/${id}/status`, data);

    return getApiResult(response);
};

export const deletePenaltyRuleApi = async (id: string) => {
    await apiClient.delete<ApiResponse<void>>(
        `${MANAGER_ENDPOINT}/penalty-rules/${id}`,
    );
};
