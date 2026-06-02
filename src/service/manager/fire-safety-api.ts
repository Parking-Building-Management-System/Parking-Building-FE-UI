import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    CreateFireExtinguisherRequest,
    FireExtinguisher,
    FireExtinguisherListParams,
    FireExtinguisherPageResponse,
    FireExtinguisherSummary,
    FireInspectionLogListParams,
    FireInspectionLogPageResponse,
    FireSafetyMap,
    UpdateFireExtinguisherCoordinateRequest,
    UpdateFireExtinguisherRequest,
    UpdateFireExtinguisherStatusRequest,
} from '@/service/manager/fire-safety-type';

const MANAGER_ENDPOINT = '/manager';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

export const managerFireSafetyQueryKeys = {
    extinguishers: (filters: FireExtinguisherListParams) =>
        ['manager-fire-extinguishers', filters] as const,
    extinguisher: (id: string) => ['manager-fire-extinguisher', id] as const,
    summary: ['manager-fire-extinguisher-summary'] as const,
    map: (floorId: string) => ['manager-fire-safety-map', floorId] as const,
    inspectionLogs: (filters: FireInspectionLogListParams) =>
        ['manager-fire-inspection-logs', filters] as const,
};

export const listFireExtinguishersApi = async (
    params: FireExtinguisherListParams,
) => {
    const response = await apiClient.get<
        ApiResponse<FireExtinguisherPageResponse>
    >(`${MANAGER_ENDPOINT}/fire-extinguishers`, { params });

    return getApiResult(response);
};

export const createFireExtinguisherApi = async (
    data: CreateFireExtinguisherRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<FireExtinguisher>,
        AxiosResponse<ApiResponse<FireExtinguisher>>,
        CreateFireExtinguisherRequest
    >(`${MANAGER_ENDPOINT}/fire-extinguishers`, data);

    return getApiResult(response);
};

export const getFireExtinguisherApi = async (id: string) => {
    const response = await apiClient.get<ApiResponse<FireExtinguisher>>(
        `${MANAGER_ENDPOINT}/fire-extinguishers/${id}`,
    );

    return getApiResult(response);
};

export const updateFireExtinguisherApi = async (
    id: string,
    data: UpdateFireExtinguisherRequest,
) => {
    const response = await apiClient.put<
        ApiResponse<FireExtinguisher>,
        AxiosResponse<ApiResponse<FireExtinguisher>>,
        UpdateFireExtinguisherRequest
    >(`${MANAGER_ENDPOINT}/fire-extinguishers/${id}`, data);

    return getApiResult(response);
};

export const updateFireExtinguisherStatusApi = async (
    id: string,
    data: UpdateFireExtinguisherStatusRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<FireExtinguisher>,
        AxiosResponse<ApiResponse<FireExtinguisher>>,
        UpdateFireExtinguisherStatusRequest
    >(`${MANAGER_ENDPOINT}/fire-extinguishers/${id}/status`, data);

    return getApiResult(response);
};

export const updateFireExtinguisherCoordinateApi = async (
    id: string,
    data: UpdateFireExtinguisherCoordinateRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<FireExtinguisher>,
        AxiosResponse<ApiResponse<FireExtinguisher>>,
        UpdateFireExtinguisherCoordinateRequest
    >(`${MANAGER_ENDPOINT}/fire-extinguishers/${id}/coordinate`, data);

    return getApiResult(response);
};

export const deleteFireExtinguisherApi = async (id: string) => {
    await apiClient.delete<ApiResponse<null>>(
        `${MANAGER_ENDPOINT}/fire-extinguishers/${id}`,
    );
};

export const getFireExtinguisherSummaryApi = async () => {
    const response = await apiClient.get<ApiResponse<FireExtinguisherSummary>>(
        `${MANAGER_ENDPOINT}/fire-extinguishers/summary`,
    );

    return getApiResult(response);
};

export const getFireSafetyMapApi = async (floorId: string) => {
    const response = await apiClient.get<ApiResponse<FireSafetyMap>>(
        `${MANAGER_ENDPOINT}/floors/${floorId}/fire-safety-map`,
    );

    return getApiResult(response);
};

export const listFireInspectionLogsApi = async (
    params: FireInspectionLogListParams,
) => {
    const response = await apiClient.get<
        ApiResponse<FireInspectionLogPageResponse>
    >(`${MANAGER_ENDPOINT}/fire-inspections/logs`, { params });

    return getApiResult(response);
};
