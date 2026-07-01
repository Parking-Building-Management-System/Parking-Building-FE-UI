import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    ManagerShiftSettlementDetail,
    ManagerShiftSettlementListParams,
    ManagerShiftSettlementPageResponse,
} from '@/service/manager/shift-settlement-type';

const MANAGER_ENDPOINT = '/manager';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

export const managerShiftSettlementQueryKeys = {
    settlements: ['manager', 'shifts', 'settlements'] as const,
    settlementList: (params: ManagerShiftSettlementListParams) =>
        [
            'manager',
            'shifts',
            'settlements',
            params.parkingId ?? 'ALL_PARKINGS',
            params.staffId ?? 'ALL_STAFF',
            params.status ?? 'ALL_STATUSES',
            params.from ?? '',
            params.to ?? '',
            params.page ?? 0,
            params.size ?? 20,
        ] as const,
    settlementDetail: (id: string) =>
        ['manager', 'shifts', 'settlements', id] as const,
};

export const getShiftSettlementsApi = async (
    params: ManagerShiftSettlementListParams,
) => {
    const response = await apiClient.get<
        ApiResponse<ManagerShiftSettlementPageResponse>
    >(`${MANAGER_ENDPOINT}/shifts/settlements`, { params });

    return getApiResult(response);
};

export const getShiftSettlementDetailApi = async (id: string) => {
    const response = await apiClient.get<
        ApiResponse<ManagerShiftSettlementDetail>
    >(`${MANAGER_ENDPOINT}/shifts/settlements/${id}`);

    return getApiResult(response);
};
