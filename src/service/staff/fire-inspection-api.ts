import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    DueFireInspectionItem,
    StaffFireInspectionDueParams,
    SubmitFireInspectionRequest,
} from '@/service/staff/fire-inspection-type';

const STAFF_ENDPOINT = '/staff';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

const compactParams = <T extends object>(params: T) =>
    Object.fromEntries(
        Object.entries(params)
            .map(([key, value]) => [
                key,
                typeof value === 'string' ? value.trim() : value,
            ])
            .filter(([, value]) => value != null && value !== ''),
    ) as Partial<T>;

export const staffFireInspectionQueryKeys = {
    due: (filters: StaffFireInspectionDueParams) =>
        ['staff-fire-inspections-due', filters] as const,
};

export const listDueFireInspectionsApi = async (
    params: StaffFireInspectionDueParams,
) => {
    const response = await apiClient.get<ApiResponse<DueFireInspectionItem[]>>(
        `${STAFF_ENDPOINT}/fire-inspections/due`,
        { params: compactParams(params) },
    );

    return getApiResult(response);
};

export const submitFireInspectionApi = async (
    data: SubmitFireInspectionRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<unknown>,
        AxiosResponse<ApiResponse<unknown>>,
        SubmitFireInspectionRequest
    >(`${STAFF_ENDPOINT}/fire-inspections`, data);

    return getApiResult(response);
};
