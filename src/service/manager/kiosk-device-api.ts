import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    ApproveDeviceRequest,
    CreateKioskRequest,
    DeviceApprovalItem,
    KioskItem,
    KioskListParams,
    KioskStaffItem,
    UpdateKioskRequest,
    UpdateKioskStatusRequest,
} from '@/service/manager/kiosk-device-type';

const MANAGER_ENDPOINT = '/manager';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

type NormalizedList<T> = T[] & { totalElements?: number };

const normalizeList = <T>(
    result: T[] | { content?: T[]; totalElements?: number },
): NormalizedList<T> => {
    if (Array.isArray(result)) {
        return result;
    }

    return Object.assign(result.content ?? [], {
        totalElements: result.totalElements,
    });
};

export const managerKioskDeviceQueryKeys = {
    kiosks: ['manager', 'kiosks'] as const,
    kioskList: (params: KioskListParams = {}) =>
        [
            'manager',
            'kiosks',
            'list',
            params.parkingId ?? 'ALL_PARKINGS',
            params.status ?? 'ALL_STATUSES',
            params.type ?? 'ALL_TYPES',
        ] as const,
    kiosk: (id: string) => ['manager', 'kiosks', id] as const,
    kioskStaff: (id: string) => ['manager', 'kiosks', id, 'staff'] as const,
    deviceApprovals: ['manager', 'device-approvals'] as const,
};

export const listManagerKiosksApi = async (
    params: KioskListParams = {},
) => {
    const response = await apiClient.get<
        ApiResponse<KioskItem[] | { content?: KioskItem[]; totalElements?: number }>
    >(`${MANAGER_ENDPOINT}/kiosks`, { params });

    return normalizeList(getApiResult(response));
};

export const createManagerKioskApi = async (data: CreateKioskRequest) => {
    const response = await apiClient.post<
        ApiResponse<KioskItem>,
        AxiosResponse<ApiResponse<KioskItem>>,
        CreateKioskRequest
    >(`${MANAGER_ENDPOINT}/kiosks`, data);

    return getApiResult(response);
};

export const getManagerKioskApi = async (id: string) => {
    const response = await apiClient.get<ApiResponse<KioskItem>>(
        `${MANAGER_ENDPOINT}/kiosks/${id}`,
    );

    return getApiResult(response);
};

export const updateManagerKioskApi = async (
    id: string,
    data: UpdateKioskRequest,
) => {
    const response = await apiClient.put<
        ApiResponse<KioskItem>,
        AxiosResponse<ApiResponse<KioskItem>>,
        UpdateKioskRequest
    >(`${MANAGER_ENDPOINT}/kiosks/${id}`, data);

    return getApiResult(response);
};

export const updateManagerKioskStatusApi = async (
    id: string,
    data: UpdateKioskStatusRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<KioskItem>,
        AxiosResponse<ApiResponse<KioskItem>>,
        UpdateKioskStatusRequest
    >(`${MANAGER_ENDPOINT}/kiosks/${id}/status`, data);

    return getApiResult(response);
};

export const deleteManagerKioskApi = async (id: string) => {
    await apiClient.delete<ApiResponse<void>>(`${MANAGER_ENDPOINT}/kiosks/${id}`);
};

export const listManagerKioskStaffApi = async (id: string) => {
    const response = await apiClient.get<
        ApiResponse<
            KioskStaffItem[] | { content?: KioskStaffItem[]; totalElements?: number }
        >
    >(`${MANAGER_ENDPOINT}/kiosks/${id}/staff`);

    return normalizeList(getApiResult(response));
};

export const assignManagerKioskStaffApi = async (
    kioskId: string,
    staffId: string,
) => {
    await apiClient.post<ApiResponse<void>>(
        `${MANAGER_ENDPOINT}/kiosks/${kioskId}/staff/${staffId}`,
    );
};

export const removeManagerKioskStaffApi = async (
    kioskId: string,
    staffId: string,
) => {
    await apiClient.delete<ApiResponse<void>>(
        `${MANAGER_ENDPOINT}/kiosks/${kioskId}/staff/${staffId}`,
    );
};

export const listManagerDeviceApprovalsApi = async () => {
    const response = await apiClient.get<
        ApiResponse<
            | DeviceApprovalItem[]
            | { content?: DeviceApprovalItem[]; totalElements?: number }
        >
    >(`${MANAGER_ENDPOINT}/device-approvals`);

    return normalizeList(getApiResult(response));
};

export const approveManagerDeviceApi = async (
    id: string,
    data: ApproveDeviceRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<DeviceApprovalItem>,
        AxiosResponse<ApiResponse<DeviceApprovalItem>>,
        ApproveDeviceRequest
    >(`${MANAGER_ENDPOINT}/device-approvals/${id}/approve`, data);

    return getApiResult(response);
};

export const rejectManagerDeviceApprovalApi = async (id: string) => {
    await apiClient.post<ApiResponse<void>>(
        `${MANAGER_ENDPOINT}/device-approvals/${id}/reject`,
    );
};

export const revokeManagerDeviceApi = async (id: string) => {
    await apiClient.post<ApiResponse<void>>(
        `${MANAGER_ENDPOINT}/devices/${id}/revoke`,
    );
};
