import { ApiError } from '@/lib/api/axios-config';

export const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) {
        return error.message || fallback;
    }

    if (error instanceof Error) {
        return error.message || fallback;
    }

    return fallback;
};
