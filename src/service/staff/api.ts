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
    StaffParkingSessionPhotoPresignUploadRequest,
    StaffParkingSessionPhotoPresignUploadResponse,
    StaffVehicleType,
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
    vehicleTypes: ['staff', 'master-data', 'vehicle-types'] as const,
    availableRfidCards: (search: string) =>
        ['staff-available-rfid-cards', search] as const,
};

const normalizeOptionalString = (value: unknown) => {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const normalizeStaffVehicleType = (
    item: StaffVehicleType & Record<string, unknown>,
): StaffVehicleType | null => {
    const id = normalizeOptionalString(item.id);
    const code = normalizeOptionalString(item.code);
    const name =
        normalizeOptionalString(item.name) ??
        normalizeOptionalString(item.displayName) ??
        normalizeOptionalString(item.label) ??
        code;

    if (!id || !code || !name) {
        return null;
    }

    const status = normalizeOptionalString(item.status);
    const active =
        typeof item.active === 'boolean'
            ? item.active
            : status
              ? status.toUpperCase() === 'ACTIVE'
              : true;

    return {
        id,
        code,
        name,
        displayName: normalizeOptionalString(item.displayName) ?? null,
        label: normalizeOptionalString(item.label) ?? null,
        active,
        status: status ?? null,
        createdAt: normalizeOptionalString(item.createdAt),
    };
};

export const checkInParkingSessionApi = async (data: StaffCheckInRequest) => {
    const response = await apiClient.post<
        ApiResponse<StaffCheckInResponse>,
        AxiosResponse<ApiResponse<StaffCheckInResponse>>,
        StaffCheckInRequest
    >(`${STAFF_ENDPOINT}/parking-sessions/check-in`, data);

    return getApiResult(response);
};

export const presignParkingSessionPhotoUploadApi = async (
    data: StaffParkingSessionPhotoPresignUploadRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StaffParkingSessionPhotoPresignUploadResponse>,
        AxiosResponse<ApiResponse<StaffParkingSessionPhotoPresignUploadResponse>>,
        StaffParkingSessionPhotoPresignUploadRequest
    >(`${STAFF_ENDPOINT}/parking-sessions/photos/presign-upload`, data);

    return getApiResult(response);
};

export const uploadParkingSessionPhotoFile = async (
    file: File,
    presign: StaffParkingSessionPhotoPresignUploadResponse,
) => {
    let uploadResponse: Response;

    try {
        uploadResponse = await fetch(presign.uploadUrl, {
            method: presign.method || 'PUT',
            headers: {
                ...presign.headers,
                'Content-Type':
                    presign.headers?.['Content-Type'] ?? file.type,
            },
            body: file,
        });
    } catch {
        throw new Error(
            'Photo upload failed. Storage CORS or network access may need configuration.',
        );
    }

    if (!uploadResponse.ok) {
        throw new Error(`Photo upload failed. HTTP ${uploadResponse.status}.`);
    }
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

export const getStaffVehicleTypes = async () => {
    const response = await apiClient.get<ApiResponse<unknown[]>>(
        `${STAFF_ENDPOINT}/master-data/vehicle-types`,
    );

    return getApiResult(response)
        .map((item) =>
            normalizeStaffVehicleType(
                item as StaffVehicleType & Record<string, unknown>,
            ),
        )
        .filter((item): item is StaffVehicleType => item !== null);
};

export const listAvailableRfidCardsApi = async (
    search = '',
    limit = 50,
) => {
    const normalizedSearch = search.trim();
    const response = await apiClient.get<ApiResponse<AvailableRfidCard[]>>(
        `${STAFF_ENDPOINT}/rfid-cards/available`,
        {
            params: {
                ...(normalizedSearch ? { search: normalizedSearch } : {}),
                limit,
            },
        },
    );

    return getApiResult(response);
};
