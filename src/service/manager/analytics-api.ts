import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    ManagerAnalyticsOverview,
    ManagerAnalyticsParams,
} from './analytics-type';

const MANAGER_ANALYTICS_ENDPOINT = '/manager/analytics/overview';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }
    return response.data.result;
};

export const normalizeManagerAnalyticsParams = (
    params: ManagerAnalyticsParams,
) => ({
    parkingId: params.parkingId,
    periodType: params.periodType,
    comparison: params.comparison,
    ...(params.date ? { date: params.date } : {}),
    ...(typeof params.year === 'number' ? { year: params.year } : {}),
    ...(typeof params.month === 'number' ? { month: params.month } : {}),
    ...(typeof params.quarter === 'number'
        ? { quarter: params.quarter }
        : {}),
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
    ...(params.vehicleTypeId
        ? { vehicleTypeId: params.vehicleTypeId }
        : {}),
});

export const managerAnalyticsQueryKeys = {
    all: ['manager', 'analytics'] as const,
    overview: (params: ManagerAnalyticsParams) =>
        [
            'manager',
            'analytics',
            'overview',
            normalizeManagerAnalyticsParams(params),
        ] as const,
};

export const getManagerAnalyticsOverviewApi = async (
    params: ManagerAnalyticsParams,
) => {
    const response = await apiClient.get<
        ApiResponse<ManagerAnalyticsOverview>
    >(MANAGER_ANALYTICS_ENDPOINT, {
        params: normalizeManagerAnalyticsParams(params),
    });
    return getApiResult(response);
};
