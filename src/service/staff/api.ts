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
    StaffLostCardPhotoPresignUploadRequest,
    StaffLostCardPhotoPresignUploadResponse,
    StaffLostCardPreviewResponse,
    StaffLostCardCaseRequest,
    StaffLostCardCaseResponse,
    StaffLostCardCompleteExitRequest,
    StaffLostCardCompleteExitResponse,
    StaffCashShift,
    StaffCashShiftCloseRequest,
    StaffCashSettlementPreviewResponse,
    StaffCurrentCashShiftResponse,
    StaffViolationReportApproveRequest,
    StaffViolationReportRejectRequest,
    StaffViolationReportResponse,
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
    lostCardPreview: (plateNumber: string) =>
        ['staff', 'lost-card', 'preview', plateNumber] as const,
    lostCardCase: ['staff', 'lost-card', 'case'] as const,
    lostCardCompleteExit: ['staff', 'lost-card', 'complete-exit'] as const,
    vehicleTypes: ['staff', 'master-data', 'vehicle-types'] as const,
    availableRfidCards: (search: string) =>
        ['staff-available-rfid-cards', search] as const,
    currentShift: ['staff', 'shifts', 'current'] as const,
    shiftSettlementPreview: [
        'staff',
        'shifts',
        'current',
        'settlement-preview',
    ] as const,
    violationReports: ['staff', 'violation-reports'] as const,
    violationReport: (reportId: string) =>
        ['staff', 'violation-reports', reportId] as const,
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

export const presignLostCardPhotoUploadApi = async (
    data: StaffLostCardPhotoPresignUploadRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StaffLostCardPhotoPresignUploadResponse>,
        AxiosResponse<ApiResponse<StaffLostCardPhotoPresignUploadResponse>>,
        StaffLostCardPhotoPresignUploadRequest
    >(`${STAFF_ENDPOINT}/lost-card/photos/presign-upload`, data);

    return getApiResult(response);
};

export const uploadLostCardPhotoFile = async (
    file: File,
    presign: StaffLostCardPhotoPresignUploadResponse,
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

export const listViolationReportsApi = async (params?: {
    status?: string;
    reportedPlate?: string;
    from?: string;
    to?: string;
}) => {
    const { reportedPlate, ...filters } = params ?? {};
    const normalizedReportedPlate = reportedPlate?.trim();
    const response = await apiClient.get<
        ApiResponse<StaffViolationReportResponse[]>
    >(`${STAFF_ENDPOINT}/violation-reports`, {
        params: {
            ...filters,
            ...(normalizedReportedPlate
                ? { reportedPlate: normalizedReportedPlate }
                : {}),
        },
    });

    return getApiResult(response);
};

export const getViolationReportApi = async (reportId: string) => {
    const response = await apiClient.get<ApiResponse<StaffViolationReportResponse>>(
        `${STAFF_ENDPOINT}/violation-reports/${reportId}`,
    );

    return getApiResult(response);
};

export const approveViolationReportApi = async (
    reportId: string,
    data: StaffViolationReportApproveRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StaffViolationReportResponse>,
        AxiosResponse<ApiResponse<StaffViolationReportResponse>>,
        StaffViolationReportApproveRequest
    >(`${STAFF_ENDPOINT}/violation-reports/${reportId}/approve`, data);

    return getApiResult(response);
};

export const rejectViolationReportApi = async (
    reportId: string,
    data: StaffViolationReportRejectRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StaffViolationReportResponse>,
        AxiosResponse<ApiResponse<StaffViolationReportResponse>>,
        StaffViolationReportRejectRequest
    >(`${STAFF_ENDPOINT}/violation-reports/${reportId}/reject`, data);

    return getApiResult(response);
};

export const previewLostCardApi = async (plateNumber: string) => {
    const response = await apiClient.get<
        ApiResponse<StaffLostCardPreviewResponse>
    >(`${STAFF_ENDPOINT}/lost-card/preview`, {
        params: { plateNumber },
    });

    return getApiResult(response);
};

export const createLostCardCaseApi = async (
    data: StaffLostCardCaseRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StaffLostCardCaseResponse>,
        AxiosResponse<ApiResponse<StaffLostCardCaseResponse>>,
        StaffLostCardCaseRequest
    >(`${STAFF_ENDPOINT}/lost-card/cases`, data);

    return getApiResult(response);
};

export const completeLostCardExitApi = async (
    data: StaffLostCardCompleteExitRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StaffLostCardCompleteExitResponse>,
        AxiosResponse<ApiResponse<StaffLostCardCompleteExitResponse>>,
        StaffLostCardCompleteExitRequest
    >(`${STAFF_ENDPOINT}/lost-card/complete-exit`, data);

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

export const startShiftApi = async () => {
    const response = await apiClient.post<ApiResponse<StaffCashShift>>(
        `${STAFF_ENDPOINT}/shifts/start`,
    );

    return getApiResult(response);
};

export const getCurrentShiftApi = async () => {
    const response = await apiClient.get<
        ApiResponse<StaffCurrentCashShiftResponse>
    >(`${STAFF_ENDPOINT}/shifts/current`);

    return getApiResult(response);
};

export const getShiftSettlementPreviewApi = async () => {
    const response = await apiClient.get<
        ApiResponse<StaffCashSettlementPreviewResponse>
    >(`${STAFF_ENDPOINT}/shifts/current/settlement-preview`);

    return getApiResult(response);
};

export const closeCurrentShiftApi = async (
    data: StaffCashShiftCloseRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StaffCashShift>,
        AxiosResponse<ApiResponse<StaffCashShift>>,
        StaffCashShiftCloseRequest
    >(`${STAFF_ENDPOINT}/shifts/current/close`, data);

    return getApiResult(response);
};
