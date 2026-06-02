import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    StaffCompleteExitRequest,
    StaffCompleteExitResponse,
    StaffCheckInRequest,
    StaffCheckInResponse,
    StaffExitPreviewRequest,
    StaffExitPreviewResponse,
    AvailableRfidCard,
} from '@/service/staff/type';

const STAFF_ENDPOINT = '/staff';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

export const staffQueryKeys = {
    parkingSessions: ['staff', 'parking-sessions'] as const,
    exitPreview: ['staff', 'parking-sessions', 'exit-preview'] as const,
    completeExit: ['staff', 'parking-sessions', 'complete-exit'] as const,
    availableRfidCards: (search: string) =>
        ['staff-available-rfid-cards', search] as const,
};

export const checkInParkingSessionApi = async (data: StaffCheckInRequest) => {
    const response = await apiClient.post<
        ApiResponse<StaffCheckInResponse>,
        AxiosResponse<ApiResponse<StaffCheckInResponse>>,
        StaffCheckInRequest
    >(`${STAFF_ENDPOINT}/parking-sessions/check-in`, data);

    return getApiResult(response);
};

export const previewParkingSessionExitApi = async (
    data: StaffExitPreviewRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StaffExitPreviewResponse>,
        AxiosResponse<ApiResponse<StaffExitPreviewResponse>>,
        StaffExitPreviewRequest
    >(`${STAFF_ENDPOINT}/parking-sessions/exit-preview`, data);

    return getApiResult(response);
};

export const completeParkingSessionExitApi = async (
    data: StaffCompleteExitRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StaffCompleteExitResponse>,
        AxiosResponse<ApiResponse<StaffCompleteExitResponse>>,
        StaffCompleteExitRequest
    >(`${STAFF_ENDPOINT}/parking-sessions/complete-exit`, data);

    return getApiResult(response);
};

export const listAvailableRfidCardsApi = async (
    search = '',
    limit = 50,
) => {
    const response = await apiClient.get<ApiResponse<AvailableRfidCard[]>>(
        `${STAFF_ENDPOINT}/rfid-cards/available`,
        { params: { search: search.trim() || undefined, limit } },
    );

    return getApiResult(response);
};
