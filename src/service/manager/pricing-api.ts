import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    PricingPreviewRequest,
    PricingPreviewResponse,
    PricingRuleListParams,
    PricingRulePageResponse,
    PricingRuleRequest,
    PricingRuleResponse,
    PricingRuleStatusRequest,
} from '@/service/manager/pricing-type';

const MANAGER_ENDPOINT = '/manager';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

export const managerPricingQueryKeys = {
    rules: ['manager-pricing-rules'] as const,
    ruleList: (params: PricingRuleListParams = {}) =>
        [
            'manager-pricing-rules',
            params.parkingId ?? 'ALL_PARKINGS',
            params.vehicleTypeId ?? params.vehicleTypeCode ?? 'ALL_VEHICLES',
            params.status ?? 'ALL_STATUSES',
            params.search ?? '',
            params.page ?? 0,
            params.size ?? 20,
        ] as const,
    rule: (id: string) => ['manager-pricing-rule', id] as const,
    preview: (ruleId: string, checkInAt: string, checkOutAt: string) =>
        ['manager-pricing-preview', ruleId, checkInAt, checkOutAt] as const,
};

export const listPricingRulesApi = async (
    params: PricingRuleListParams = {},
) => {
    const response = await apiClient.get<ApiResponse<PricingRulePageResponse>>(
        `${MANAGER_ENDPOINT}/pricing/rules`,
        { params },
    );

    return getApiResult(response);
};

export const createPricingRuleApi = async (data: PricingRuleRequest) => {
    const response = await apiClient.post<
        ApiResponse<PricingRuleResponse>,
        AxiosResponse<ApiResponse<PricingRuleResponse>>,
        PricingRuleRequest
    >(`${MANAGER_ENDPOINT}/pricing/rules`, data);

    return getApiResult(response);
};

export const getPricingRuleApi = async (id: string) => {
    const response = await apiClient.get<ApiResponse<PricingRuleResponse>>(
        `${MANAGER_ENDPOINT}/pricing/rules/${id}`,
    );

    return getApiResult(response);
};

export const updatePricingRuleApi = async (
    id: string,
    data: PricingRuleRequest,
) => {
    const response = await apiClient.put<
        ApiResponse<PricingRuleResponse>,
        AxiosResponse<ApiResponse<PricingRuleResponse>>,
        PricingRuleRequest
    >(`${MANAGER_ENDPOINT}/pricing/rules/${id}`, data);

    return getApiResult(response);
};

export const updatePricingRuleStatusApi = async (
    id: string,
    data: PricingRuleStatusRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<PricingRuleResponse>,
        AxiosResponse<ApiResponse<PricingRuleResponse>>,
        PricingRuleStatusRequest
    >(`${MANAGER_ENDPOINT}/pricing/rules/${id}/status`, data);

    return getApiResult(response);
};

export const deletePricingRuleApi = async (id: string) => {
    await apiClient.delete<ApiResponse<void>>(
        `${MANAGER_ENDPOINT}/pricing/rules/${id}`,
    );
};

export const previewPricingRuleApi = async (
    id: string,
    data: PricingPreviewRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<PricingPreviewResponse>,
        AxiosResponse<ApiResponse<PricingPreviewResponse>>,
        PricingPreviewRequest
    >(`${MANAGER_ENDPOINT}/pricing/rules/${id}/preview`, data);

    return getApiResult(response);
};
