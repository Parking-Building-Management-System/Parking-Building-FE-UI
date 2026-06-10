import * as z from 'zod';

export const parkingStatusValues = [
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE',
] as const;

export const zoneStatusValues = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const;

export const slotStatusValues = [
    'AVAILABLE',
    'OCCUPIED',
    'RESERVED',
    'MAINTENANCE',
    'LOCKED',
] as const;

export const slotBulkStatusValues = [
    'AVAILABLE',
    'MAINTENANCE',
    'LOCKED',
] as const;

export const parkingStatusSchema = z.enum(parkingStatusValues);
export const zoneStatusSchema = z.enum(zoneStatusValues);
export const slotStatusSchema = z.enum(slotStatusValues);
export const slotBulkStatusSchema = z.enum(slotBulkStatusValues);

export type ParkingStatus = (typeof parkingStatusValues)[number];
export type ZoneStatus = (typeof zoneStatusValues)[number];
export type SlotStatus = (typeof slotStatusValues)[number];
export type SlotBulkStatus = (typeof slotBulkStatusValues)[number];
export const rfidCardStatusValues = ['ACTIVE', 'INACTIVE', 'LOST'] as const;
export const rfidCardStatusSchema = z.enum(rfidCardStatusValues);
export type RfidCardStatus = (typeof rfidCardStatusValues)[number];

export interface ApiPageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface ParkingResponse {
    id: string;
    code: string;
    name: string;
    address: string | null;
    totalCapacity: number;
    status: ParkingStatus;
}

export interface ParkingRequest {
    code: string;
    name: string;
    address?: string | null;
    status?: ParkingStatus | null;
}

export interface ParkingStatusResponse {
    id: string;
    status: ParkingStatus;
}

export interface ParkingTopologyResponse {
    id: string;
    code: string;
    name: string;
    status: ParkingStatus;
    totalCapacity: number;
    floors: FloorTopologyResponse[];
}

export interface FloorTopologyResponse {
    id: string;
    code: string;
    name: string;
    displayOrder: number;
    zones: ZoneTopologyResponse[];
}

export interface ZoneTopologyResponse {
    id: string;
    code: string;
    name: string;
    vehicleTypeCode: string | null;
    vehicleTypeName: string | null;
    capacity: number;
    slotCount: number;
    status: ZoneStatus;
}

export interface FloorRequest {
    code: string;
    name: string;
    displayOrder: number;
    active?: boolean;
}

export interface FloorResponse {
    id: string;
    parkingId: string;
    code: string;
    name: string;
    displayOrder: number;
    active: boolean;
}

export interface FloorMapRequest {
    mapImageUrl: string;
}

export interface FloorMapResponse {
    floorId: string;
    floorName: string;
    parkingId: string;
    parkingName: string;
    mapImageUrl: string | null;
    coordinateMode: 'PERCENT';
    slots: FloorMapSlotResponse[];
}

export interface FloorMapSlotResponse {
    slotId: string;
    slotCode: string;
    zoneId: string;
    zoneName: string;
    status: SlotStatus;
    xCoordinate: number | null;
    yCoordinate: number | null;
    hasCoordinate: boolean;
}

export interface SlotCoordinateRequest {
    xCoordinate: number;
    yCoordinate: number;
}

export interface SlotCoordinateBulkItem extends SlotCoordinateRequest {
    slotId: string;
}

export interface SlotCoordinateBulkRequest {
    items: SlotCoordinateBulkItem[];
}

export interface SlotCoordinateBulkResponse {
    updatedCount: number;
}

export interface StoragePresignUploadRequest {
    fileName: string;
    contentType: string;
    folder: string;
}

export interface StoragePresignUploadResponse {
    objectKey: string;
    uploadUrl: string;
    method: string;
    headers: Record<string, string>;
    expiresInSeconds: number;
    publicUrl: string | null;
}

export interface StoragePresignDownloadResponse {
    downloadUrl: string;
    expiresInSeconds: number;
}

export interface ZoneRequest {
    code: string;
    name: string;
    vehicleTypeCode: string;
    capacity: number;
    status?: ZoneStatus | null;
}

export interface ZoneResponse {
    id: string;
    parkingId: string;
    floorId: string;
    code: string;
    name: string;
    vehicleTypeCode: string | null;
    vehicleTypeName: string | null;
    capacity: number;
    status: ZoneStatus;
}

export interface SlotResponse {
    id: string;
    parkingId: string;
    parkingName: string;
    floorId: string | null;
    floorName: string | null;
    zoneId: string;
    zoneName: string;
    code: string;
    slotNumber: string;
    status: SlotStatus;
}

export interface SlotRequest {
    code: string;
    slotNumber: string;
    status?: SlotStatus | null;
}

export interface SlotSearchParams {
    parkingId?: string;
    floorId?: string;
    zoneId?: string;
    status?: SlotStatus;
    slotCode?: string;
    exact?: boolean;
    page?: number;
    size?: number;
}

export interface SlotBulkStatusRequest {
    slotIds: string[];
    newStatus: SlotBulkStatus;
}

export interface SlotBulkStatusResponse {
    updatedCount: number;
    newStatus: SlotBulkStatus;
}

export interface SlotImportResponse {
    insertedCount: number;
}

export interface SlotExportFile {
    blob: Blob;
    filename: string;
}

export interface RfidCardResponse {
    id: string;
    code: string;
    status: RfidCardStatus;
    createdAt?: string;
}

export interface RfidCardListParams {
    status?: RfidCardStatus;
    page?: number;
    size?: number;
}

export interface RfidCardGenerateRequest {
    count?: number;
    prefix?: string;
}

export interface RfidCardStatusRequest {
    status: RfidCardStatus;
}

export interface GlobalVehicleTypeResponse {
    id: string;
    name: string;
    code: string;
    active: boolean;
    status?: string;
    createdAt?: string;
}

export const parkingRequestSchema = z.object({
    code: z.string().trim().min(1, 'Parking code is required.').max(50),
    name: z.string().trim().min(1, 'Parking name is required.').max(100),
    address: z.string().trim().max(255).optional().nullable(),
    status: parkingStatusSchema.nullish(),
});

export const floorRequestSchema = z.object({
    code: z.string().trim().min(1, 'Floor code is required.').max(50),
    name: z.string().trim().min(1, 'Floor name is required.').max(100),
    displayOrder: z.number().int('Display order must be an integer.'),
    active: z.boolean().optional(),
});

export const zoneRequestSchema = z.object({
    code: z.string().trim().min(1, 'Zone code is required.').max(50),
    name: z.string().trim().min(1, 'Zone name is required.').max(255),
    vehicleTypeCode: z
        .string()
        .trim()
        .min(1, 'Vehicle type is required.')
        .max(50),
    capacity: z
        .number()
        .int('Capacity must be an integer.')
        .min(0, 'Capacity must be at least 0.'),
    status: zoneStatusSchema.nullish(),
});

export const createZoneFormSchema = zoneRequestSchema.extend({
    floorId: z.string().trim().min(1, 'Floor is required.'),
});

export const slotSearchParamsSchema = z.object({
    parkingId: z.string().trim().optional(),
    floorId: z.string().trim().optional(),
    zoneId: z.string().trim().optional(),
    status: slotStatusSchema.optional(),
    slotCode: z.string().trim().optional(),
    exact: z.boolean().optional(),
    page: z.number().int().min(0).optional(),
    size: z.number().int().min(1).max(100).optional(),
});

export const slotRequestSchema = z.object({
    code: z.string().trim().min(1, 'Slot code is required.').max(50),
    slotNumber: z
        .string()
        .trim()
        .min(1, 'Slot number is required.')
        .max(50),
    status: slotStatusSchema.nullish(),
});

export const slotBulkStatusRequestSchema = z.object({
    slotIds: z.array(z.string().trim().min(1)).min(1),
    newStatus: slotBulkStatusSchema,
});

export const rfidCardGenerateRequestSchema = z.object({
    count: z
        .number()
        .int('Count must be an integer.')
        .min(1, 'Count must be at least 1.')
        .max(10000, 'Count must be 10,000 or fewer.')
        .optional(),
    prefix: z.string().trim().max(20).optional(),
});

export type CreateZoneFormValues = z.infer<typeof createZoneFormSchema>;
export type ParkingFormValues = z.infer<typeof parkingRequestSchema>;
export type SlotFormValues = z.infer<typeof slotRequestSchema>;
export type SlotPageResponse = ApiPageResponse<SlotResponse>;
export type RfidCardPageResponse = ApiPageResponse<RfidCardResponse>;
