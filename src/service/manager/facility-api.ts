import type { AxiosResponse } from 'axios';

import apiClient, { ApiResponse } from '@/lib/api/axios-config';
import type {
    FloorRequest,
    FloorResponse,
    GlobalVehicleTypeResponse,
    ParkingResponse,
    ParkingStatusResponse,
    ParkingTopologyResponse,
    SlotBulkStatusRequest,
    SlotBulkStatusResponse,
    SlotExportFile,
    SlotImportResponse,
    SlotPageResponse,
    SlotSearchParams,
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
    topology: (parkingId: string) =>
        ['manager', 'facility', 'parkings', parkingId, 'topology'] as const,
    floors: (parkingId: string) =>
        ['manager', 'facility', 'parkings', parkingId, 'floors'] as const,
    floor: (floorId: string) =>
        ['manager', 'facility', 'floors', floorId] as const,
    zones: (floorId: string) =>
        ['manager', 'facility', 'floors', floorId, 'zones'] as const,
    zone: (zoneId: string) => ['manager', 'facility', 'zones', zoneId] as const,
    slots: ['manager', 'facility', 'slots'] as const,
    slotList: (params: SlotSearchParams) =>
        ['manager', 'facility', 'slots', params] as const,
    vehicleTypes: ['manager', 'facility', 'vehicle-types'] as const,
};

export const listParkingsApi = async () => {
    const response = await apiClient.get<ApiResponse<ParkingResponse[]>>(
        `${MANAGER_ENDPOINT}/parkings`,
    );

    return getApiResult(response);
};

export const toggleParkingStatusApi = async (id: string) => {
    const response = await apiClient.patch<ApiResponse<ParkingStatusResponse>>(
        `${MANAGER_ENDPOINT}/parkings/${id}/status`,
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

export const bulkUpdateSlotStatusApi = async (data: SlotBulkStatusRequest) => {
    const response = await apiClient.patch<
        ApiResponse<SlotBulkStatusResponse>,
        AxiosResponse<ApiResponse<SlotBulkStatusResponse>>,
        SlotBulkStatusRequest
    >(`${MANAGER_ENDPOINT}/slots/bulk-status`, data);

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
