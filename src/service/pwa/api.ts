import axios, { type AxiosResponse } from 'axios';

import { ApiError, type ApiResponse } from '@/lib/api/axios-config';
import { getApiUrl } from '@/lib/api/api-url';
import type { PwaActiveSessionResponse } from '@/service/pwa/type';

const PWA_ENDPOINT = '/pwa';

const publicApiClient = axios.create({
    baseURL: getApiUrl(),
    withCredentials: false,
    headers: {
        Accept: 'application/json',
    },
});

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    const data = response.data;

    if (data.code !== undefined && data.code !== 1000) {
        throw new ApiError(data.message || 'Logical server error', {
            status: response.status,
            code: data.code,
            details: data.errors,
        });
    }

    if (typeof data.result === 'undefined') {
        throw new Error(data.message || 'Empty response result');
    }

    return data.result;
};

export const pwaQueryKeys = {
    activeSession: (qrToken: string) => ['pwa-active-session', qrToken] as const,
};

export const getPwaCardActiveSessionApi = async (qrToken: string) => {
    try {
        const response = await publicApiClient.get<
            ApiResponse<PwaActiveSessionResponse>
        >(`${PWA_ENDPOINT}/cards/${encodeURIComponent(qrToken)}/active-session`);

        return getApiResult(response);
    } catch (error) {
        if (axios.isAxiosError<ApiResponse>(error)) {
            throw new ApiError(
                error.response?.data?.message ||
                    error.message ||
                    'Cannot load active session',
                {
                    status: error.response?.status,
                    code: error.response?.data?.code,
                    details: error.response?.data?.errors,
                },
            );
        }

        throw error;
    }
};
