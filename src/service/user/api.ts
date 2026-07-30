// src/service/auth/api.ts

import axios from 'axios';
import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import { getApiUrl } from '@/lib/api/api-url';
import {
    AuthenticationResponse,
    LoginRequest,
    PasswordResetRequestValues,
    UserProfile,
} from './type';

const AUTH_ENDPOINT = '/auth';
const apiUrl = getApiUrl();

const getApiResult = <T>(response: ApiResponse<T>): T => {
    if (typeof response.result === 'undefined') {
        throw new Error(response.message || 'Empty response result');
    }

    return response.result;
};

export const loginApi = async (data: LoginRequest) => {
    const response = await apiClient.post<ApiResponse<AuthenticationResponse>>(
        `${AUTH_ENDPOINT}/login`,
        data,
    );

    return getApiResult(response.data);
};

export const refreshApi = async () => {
    const response = await axios.post<ApiResponse<AuthenticationResponse>>(
        `${apiUrl}${AUTH_ENDPOINT}/refresh`,
        {},
        {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        },
    );

    return getApiResult(response.data);
};

export const getMyProfileApi = async () => {
    const response = await apiClient.get<ApiResponse<UserProfile>>(
        `${AUTH_ENDPOINT}/me`,
    );

    return getApiResult(response.data);
};

export const logoutApi = async () => {
    await apiClient.post<ApiResponse<void>>(`${AUTH_ENDPOINT}/logout`);
};

export const logoutAllApi = async () => {
    await apiClient.post<ApiResponse<void>>(`${AUTH_ENDPOINT}/logout-all`);
};

export const requestStaffPasswordResetApi = async (
    data: PasswordResetRequestValues,
) => {
    const response = await apiClient.post<ApiResponse<void>>(
        `${AUTH_ENDPOINT}/password-reset-requests`,
        {
            email: data.email.trim().toLowerCase(),
        },
    );

    return response.data.message;
};
