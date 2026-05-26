import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    StaffCheckInRequest,
    StaffCheckInResponse,
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
};

export const checkInParkingSessionApi = async (data: StaffCheckInRequest) => {
    const response = await apiClient.post<
        ApiResponse<StaffCheckInResponse>,
        AxiosResponse<ApiResponse<StaffCheckInResponse>>,
        StaffCheckInRequest
    >(`${STAFF_ENDPOINT}/parking-sessions/check-in`, data);

    return getApiResult(response);
};
