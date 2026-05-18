import axios, {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';
import { getApiUrl } from './api-url';
import { useAuthStore } from '@/stores/use-auth-store';

const apiUrl = getApiUrl();

export interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    result?: T;
    errors?: Record<string, string>;
    timestamp?: string;
    path?: string;
}

export class ApiError extends Error {
    status?: number;
    code?: number;
    details?: Record<string, string>;

    constructor(
        message: string,
        options?: {
            status?: number;
            code?: number;
            details?: Record<string, string>;
        },
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = options?.status;
        this.code = options?.code;
        this.details = options?.details;
    }
}

// 2. Khởi tạo Axios Instance
export const apiClient: AxiosInstance = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().jwtToken;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

interface RetryConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

apiClient.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        const data = response.data;

        if (data && data.code !== undefined && data.code !== 1000) {
            throw new ApiError(data.message || 'Logical server error', {
                status: response.status,
                code: data.code,
                details: data.errors,
            });
        }

        return data as unknown as AxiosResponse;
    },
    async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as RetryConfig;
        const status = error.response?.status;
        const errorData = error.response?.data;

        // Xử lý 401 - Token hết hạn
        if (status === 401 && originalRequest) {
            // Nếu API đang gọi lại chính là API refresh bị 401 -> Refresh token cũng đã hết hạn/invalid
            if (originalRequest.url?.includes('/auth/refresh')) {
                useAuthStore.getState().setJwtToken(null);
                // useAuthStore.getState().logout(); // Mở comment nếu bạn có action logout
                return Promise.reject(
                    new ApiError(
                        'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.',
                        { status: 401 },
                    ),
                );
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] =
                            `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshResponse = await axios.post<
                    ApiResponse<{ accessToken: string }>
                >(`${apiUrl}/auth/refresh`, {}, { withCredentials: true });

                const newToken = refreshResponse.data.result?.accessToken;

                if (!newToken) {
                    throw new Error('Cannot get new Refresh Token');
                }

                useAuthStore.getState().setJwtToken(newToken);

                processQueue(null, newToken);

                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as Error, null);
                useAuthStore.getState().setJwtToken(null);
                return Promise.reject(
                    new ApiError('Refresh token thất bại.', { status: 401 }),
                );
            } finally {
                isRefreshing = false;
            }
        }

        const message =
            errorData?.message ||
            error.message ||
            'Lỗi hệ thống không xác định';
        const code = errorData?.code;
        const details = errorData?.errors;

        return Promise.reject(new ApiError(message, { status, code, details }));
    },
);

export default apiClient;
