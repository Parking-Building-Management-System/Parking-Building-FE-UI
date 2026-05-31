import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    FloorRequest,
    FloorMapRequest,
    FloorMapResponse,
    FloorResponse,
    GlobalVehicleTypeResponse,
    ParkingRequest,
    ParkingResponse,
    ParkingStatusResponse,
    ParkingTopologyResponse,
    RfidCardGenerateRequest,
    RfidCardListParams,
    RfidCardPageResponse,
    RfidCardResponse,
    RfidCardStatusRequest,
    SlotBulkStatusRequest,
    SlotBulkStatusResponse,
    SlotCoordinateBulkRequest,
    SlotCoordinateBulkResponse,
    SlotCoordinateRequest,
    SlotExportFile,
    SlotImportResponse,
    SlotRequest,
    SlotPageResponse,
    SlotSearchParams,
    SlotResponse,
    StoragePresignDownloadResponse,
    StoragePresignUploadRequest,
    StoragePresignUploadResponse,
    ZoneRequest,
    ZoneResponse,
} from '@/service/manager/facility-type';

const MANAGER_ENDPOINT = '/manager';
const DEFAULT_SLOT_EXPORT_FILENAME = 'smartpark-slots.xlsx';

const getApiResult = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (typeof response.data.result === 'undefined') {
        throw new Error(response.data.message || 'Empty response result');
    }

    return response.data.result;
};

const parseExportFilename = (contentDisposition?: string) => {
    if (!contentDisposition) {
        return DEFAULT_SLOT_EXPORT_FILENAME;
    }

    const filenameMatch =
        /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(
            contentDisposition,
        );
    const rawFilename = filenameMatch?.[1] ?? filenameMatch?.[2];

    if (!rawFilename) {
        return DEFAULT_SLOT_EXPORT_FILENAME;
    }

    return decodeURIComponent(rawFilename.trim());
};

export const managerFacilityQueryKeys = {
    parkings: ['manager', 'facility', 'parkings'] as const,
    parking: (parkingId: string) =>
        ['manager', 'facility', 'parkings', parkingId] as const,
    topology: (parkingId: string) =>
        ['manager', 'facility', 'parkings', parkingId, 'topology'] as const,
    floors: (parkingId: string) =>
        ['manager', 'facility', 'parkings', parkingId, 'floors'] as const,
    floor: (floorId: string) =>
        ['manager', 'facility', 'floors', floorId] as const,
    floorMap: (floorId: string) =>
        ['manager', 'facility', 'floors', floorId, 'map'] as const,
    storageDownload: (objectKey: string) =>
        ['manager', 'facility', 'storage', 'download', objectKey] as const,
    zones: (floorId: string) =>
        ['manager', 'facility', 'floors', floorId, 'zones'] as const,
    zone: (zoneId: string) => ['manager', 'facility', 'zones', zoneId] as const,
    slots: ['manager', 'facility', 'slots'] as const,
    slotList: (params: SlotSearchParams) =>
        [
            'manager',
            'facility',
            'slots',
            'list',
            params.zoneId ?? 'ALL_ZONES',
            params.status ?? 'ALL_STATUSES',
            params.slotCode ?? '',
            params.exact ?? false,
            params.page ?? 0,
            params.size ?? 20,
        ] as const,
    slot: (slotId: string) => ['manager', 'facility', 'slots', slotId] as const,
    rfidCards: ['manager', 'facility', 'rfid-cards'] as const,
    rfidCardList: (params: RfidCardListParams) =>
        [
            'manager',
            'facility',
            'rfid-cards',
            'list',
            params.status ?? 'ALL_STATUSES',
            params.page ?? 0,
            params.size ?? 20,
        ] as const,
    vehicleTypes: ['manager', 'facility', 'vehicle-types'] as const,
};

export const listParkingsApi = async () => {
    const response = await apiClient.get<ApiResponse<ParkingResponse[]>>(
        `${MANAGER_ENDPOINT}/parkings`,
    );

    return getApiResult(response);
};

export const createParkingApi = async (data: ParkingRequest) => {
    const response = await apiClient.post<
        ApiResponse<ParkingResponse>,
        AxiosResponse<ApiResponse<ParkingResponse>>,
        ParkingRequest
    >(`${MANAGER_ENDPOINT}/parkings`, data);

    return getApiResult(response);
};

export const getParkingApi = async (id: string) => {
    const response = await apiClient.get<ApiResponse<ParkingResponse>>(
        `${MANAGER_ENDPOINT}/parkings/${id}`,
    );

    return getApiResult(response);
};

export const updateParkingApi = async (id: string, data: ParkingRequest) => {
    const response = await apiClient.put<
        ApiResponse<ParkingResponse>,
        AxiosResponse<ApiResponse<ParkingResponse>>,
        ParkingRequest
    >(`${MANAGER_ENDPOINT}/parkings/${id}`, data);

    return getApiResult(response);
};

export const toggleParkingStatusApi = async (id: string) => {
    const response = await apiClient.patch<ApiResponse<ParkingStatusResponse>>(
        `${MANAGER_ENDPOINT}/parkings/${id}/status`,
    );

    return getApiResult(response);
};

export const updateParkingStatusApi = async (
    id: string,
    data: Pick<ParkingRequest, 'status'>,
) => {
    const response = await apiClient.patch<ApiResponse<ParkingStatusResponse>>(
        `${MANAGER_ENDPOINT}/parkings/${id}/status`,
        data,
    );

    return getApiResult(response);
};

export const getParkingTopologyApi = async (parkingId: string) => {
    const response = await apiClient.get<ApiResponse<ParkingTopologyResponse>>(
        `${MANAGER_ENDPOINT}/parkings/${parkingId}/topology`,
    );

    return getApiResult(response);
};

export const listFloorsApi = async (parkingId: string) => {
    const response = await apiClient.get<ApiResponse<FloorResponse[]>>(
        `${MANAGER_ENDPOINT}/parkings/${parkingId}/floors`,
    );

    return getApiResult(response);
};

export const createFloorApi = async (parkingId: string, data: FloorRequest) => {
    const response = await apiClient.post<
        ApiResponse<FloorResponse>,
        AxiosResponse<ApiResponse<FloorResponse>>,
        FloorRequest
    >(`${MANAGER_ENDPOINT}/parkings/${parkingId}/floors`, data);

    return getApiResult(response);
};

export const getFloorApi = async (id: string) => {
    const response = await apiClient.get<ApiResponse<FloorResponse>>(
        `${MANAGER_ENDPOINT}/floors/${id}`,
    );

    return getApiResult(response);
};

export const updateFloorApi = async (id: string, data: FloorRequest) => {
    const response = await apiClient.put<
        ApiResponse<FloorResponse>,
        AxiosResponse<ApiResponse<FloorResponse>>,
        FloorRequest
    >(`${MANAGER_ENDPOINT}/floors/${id}`, data);

    return getApiResult(response);
};

export const deleteFloorApi = async (id: string) => {
    await apiClient.delete<ApiResponse<null>>(
        `${MANAGER_ENDPOINT}/floors/${id}`,
    );
};

export const getFloorMapApi = async (id: string) => {
    const response = await apiClient.get<ApiResponse<FloorMapResponse>>(
        `${MANAGER_ENDPOINT}/floors/${id}/map`,
    );

    return getApiResult(response);
};

export const updateFloorMapApi = async (
    id: string,
    data: FloorMapRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<FloorMapResponse>,
        AxiosResponse<ApiResponse<FloorMapResponse>>,
        FloorMapRequest
    >(`${MANAGER_ENDPOINT}/floors/${id}/map`, data);

    return getApiResult(response);
};

export const listZonesApi = async (floorId: string) => {
    const response = await apiClient.get<ApiResponse<ZoneResponse[]>>(
        `${MANAGER_ENDPOINT}/floors/${floorId}/zones`,
    );

    return getApiResult(response);
};

export const createZoneApi = async (floorId: string, data: ZoneRequest) => {
    const response = await apiClient.post<
        ApiResponse<ZoneResponse>,
        AxiosResponse<ApiResponse<ZoneResponse>>,
        ZoneRequest
    >(`${MANAGER_ENDPOINT}/floors/${floorId}/zones`, data);

    return getApiResult(response);
};

export const getZoneApi = async (id: string) => {
    const response = await apiClient.get<ApiResponse<ZoneResponse>>(
        `${MANAGER_ENDPOINT}/zones/${id}`,
    );

    return getApiResult(response);
};

export const updateZoneApi = async (id: string, data: ZoneRequest) => {
    const response = await apiClient.put<
        ApiResponse<ZoneResponse>,
        AxiosResponse<ApiResponse<ZoneResponse>>,
        ZoneRequest
    >(`${MANAGER_ENDPOINT}/zones/${id}`, data);

    return getApiResult(response);
};

export const deleteZoneApi = async (id: string) => {
    await apiClient.delete<ApiResponse<null>>(
        `${MANAGER_ENDPOINT}/zones/${id}`,
    );
};

export const listSlotsApi = async (params: SlotSearchParams) => {
    const response = await apiClient.get<ApiResponse<SlotPageResponse>>(
        `${MANAGER_ENDPOINT}/slots`,
        { params },
    );

    return getApiResult(response);
};

export const createSlotApi = async (zoneId: string, data: SlotRequest) => {
    const response = await apiClient.post<
        ApiResponse<SlotResponse>,
        AxiosResponse<ApiResponse<SlotResponse>>,
        SlotRequest
    >(`${MANAGER_ENDPOINT}/zones/${zoneId}/slots`, data);

    return getApiResult(response);
};

export const getSlotApi = async (id: string) => {
    const response = await apiClient.get<ApiResponse<SlotResponse>>(
        `${MANAGER_ENDPOINT}/slots/${id}`,
    );

    return getApiResult(response);
};

export const updateSlotApi = async (id: string, data: SlotRequest) => {
    const response = await apiClient.put<
        ApiResponse<SlotResponse>,
        AxiosResponse<ApiResponse<SlotResponse>>,
        SlotRequest
    >(`${MANAGER_ENDPOINT}/slots/${id}`, data);

    return getApiResult(response);
};

export const deleteSlotApi = async (id: string) => {
    await apiClient.delete<ApiResponse<null>>(`${MANAGER_ENDPOINT}/slots/${id}`);
};

export const updateSlotStatusApi = async (
    id: string,
    data: Pick<SlotRequest, 'status'>,
) => {
    const response = await apiClient.patch<
        ApiResponse<SlotResponse>,
        AxiosResponse<ApiResponse<SlotResponse>>,
        Pick<SlotRequest, 'status'>
    >(`${MANAGER_ENDPOINT}/slots/${id}/status`, data);

    return getApiResult(response);
};

export const bulkUpdateSlotStatusApi = async (data: SlotBulkStatusRequest) => {
    const response = await apiClient.patch<
        ApiResponse<SlotBulkStatusResponse>,
        AxiosResponse<ApiResponse<SlotBulkStatusResponse>>,
        SlotBulkStatusRequest
    >(`${MANAGER_ENDPOINT}/slots/bulk-status`, data);

    return getApiResult(response);
};

export const updateSlotCoordinateApi = async (
    id: string,
    data: SlotCoordinateRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<SlotResponse>,
        AxiosResponse<ApiResponse<SlotResponse>>,
        SlotCoordinateRequest
    >(`${MANAGER_ENDPOINT}/slots/${id}/coordinate`, data);

    return getApiResult(response);
};

export const bulkUpdateSlotCoordinatesApi = async (
    data: SlotCoordinateBulkRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<SlotCoordinateBulkResponse>,
        AxiosResponse<ApiResponse<SlotCoordinateBulkResponse>>,
        SlotCoordinateBulkRequest
    >(`${MANAGER_ENDPOINT}/slots/coordinates`, data);

    return getApiResult(response);
};

export const presignStorageUploadApi = async (
    data: StoragePresignUploadRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<StoragePresignUploadResponse>,
        AxiosResponse<ApiResponse<StoragePresignUploadResponse>>,
        StoragePresignUploadRequest
    >(`${MANAGER_ENDPOINT}/storage/presign-upload`, data);

    return getApiResult(response);
};

export const presignStorageDownloadApi = async (objectKey: string) => {
    const response = await apiClient.get<
        ApiResponse<StoragePresignDownloadResponse>
    >(`${MANAGER_ENDPOINT}/storage/presign-download`, {
        params: { objectKey },
    });

    return getApiResult(response);
};

export const importSlotsApi = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<
        ApiResponse<SlotImportResponse>,
        AxiosResponse<ApiResponse<SlotImportResponse>>,
        FormData
    >(`${MANAGER_ENDPOINT}/slots/import`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return getApiResult(response);
};

export const exportSlotsApi = async (): Promise<SlotExportFile> => {
    const response = await apiClient.get<Blob>(
        `${MANAGER_ENDPOINT}/slots/export`,
        {
            responseType: 'blob',
            headers: {
                Accept: 'application/vnd.ms-excel',
            },
        },
    );
    const dispositionHeader = response.headers['content-disposition'];
    const contentDisposition = Array.isArray(dispositionHeader)
        ? dispositionHeader[0]
        : dispositionHeader;

    return {
        blob: response.data,
        filename: parseExportFilename(contentDisposition),
    };
};

export const listGlobalVehicleTypesApi = async () => {
    const response = await apiClient.get<
        ApiResponse<GlobalVehicleTypeResponse[]>
    >(`${MANAGER_ENDPOINT}/master-data/vehicle-types`);

    return getApiResult(response);
};

export const listRfidCardsApi = async (params: RfidCardListParams) => {
    const response = await apiClient.get<ApiResponse<RfidCardPageResponse>>(
        `${MANAGER_ENDPOINT}/rfid-cards`,
        { params },
    );

    return getApiResult(response);
};

export const generateRfidCardsApi = async (
    data: RfidCardGenerateRequest,
) => {
    const response = await apiClient.post<
        ApiResponse<RfidCardPageResponse | RfidCardResponse[]>,
        AxiosResponse<ApiResponse<RfidCardPageResponse | RfidCardResponse[]>>,
        RfidCardGenerateRequest
    >(`${MANAGER_ENDPOINT}/rfid-cards/generate`, data);

    return getApiResult(response);
};

export const updateRfidCardStatusApi = async (
    id: string,
    data: RfidCardStatusRequest,
) => {
    const response = await apiClient.patch<
        ApiResponse<RfidCardResponse>,
        AxiosResponse<ApiResponse<RfidCardResponse>>,
        RfidCardStatusRequest
    >(`${MANAGER_ENDPOINT}/rfid-cards/${id}/status`, data);

    return getApiResult(response);
};
