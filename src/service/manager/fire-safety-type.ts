import * as z from 'zod';

import type { ApiPageResponse } from '@/service/manager/facility-type';

export const fireExtinguisherTypeValues = [
    'CO2',
    'POWDER',
    'FOAM',
    'WATER',
    'OTHER',
] as const;

export const fireExtinguisherStatusValues = [
    'ACTIVE',
    'EXPIRED',
    'MISSING',
    'DAMAGED',
    'MAINTENANCE',
    'REPLACED',
] as const;

export const fireInspectionResultValues = [
    'OK',
    'NEEDS_REPLACEMENT',
    'DAMAGED',
    'MISSING',
    'EXPIRED',
] as const;

export type FireExtinguisherType =
    (typeof fireExtinguisherTypeValues)[number];
export type FireExtinguisherStatus =
    (typeof fireExtinguisherStatusValues)[number];
export type FireInspectionResult = (typeof fireInspectionResultValues)[number];

export interface FireExtinguisher {
    id: string;
    parkingId: string;
    parkingName?: string | null;
    floorId: string;
    floorName?: string | null;
    floorCode?: string | null;
    zoneId?: string | null;
    zoneName?: string | null;
    code: string;
    type: FireExtinguisherType;
    status: FireExtinguisherStatus;
    locationDescription: string;
    xCoordinate?: number | null;
    yCoordinate?: number | null;
    manufactureDate?: string | null;
    expiryDate?: string | null;
    lastInspectionAt?: string | null;
    nextInspectionAt?: string | null;
    note?: string | null;
}

export interface FireExtinguisherSummary {
    total: number;
    active: number;
    expired: number;
    missing: number;
    damaged: number;
    maintenance: number;
    dueInspection: number;
    expiringSoon: number;
}

export interface FireSafetyMapPin {
    id: string;
    code: string;
    type: FireExtinguisherType;
    status: FireExtinguisherStatus;
    zoneId?: string | null;
    zoneName?: string | null;
    locationDescription?: string | null;
    xCoordinate?: number | null;
    yCoordinate?: number | null;
    expiryDate?: string | null;
    nextInspectionAt?: string | null;
    hasCoordinate: boolean;
}

export interface FireSafetyMap {
    parkingId: string;
    parkingName: string;
    floorId: string;
    floorName: string;
    floorCode?: string | null;
    mapImageUrl?: string | null;
    coordinateMode: 'PERCENT';
    extinguishers: FireSafetyMapPin[];
}

export interface FireExtinguisherInspectionLog {
    id: string;
    fireExtinguisherId?: string | null;
    extinguisherCode?: string | null;
    code?: string | null;
    result: FireInspectionResult | string;
    inspectorId?: string | null;
    inspectorName?: string | null;
    parkingId?: string | null;
    parkingName?: string | null;
    floorId?: string | null;
    floorName?: string | null;
    floorCode?: string | null;
    zoneId?: string | null;
    zoneName?: string | null;
    pressureOk?: boolean | null;
    sealOk?: boolean | null;
    locationOk?: boolean | null;
    expiryOk?: boolean | null;
    photoUrl?: string | null;
    note?: string | null;
    inspectedAt?: string | null;
    nextInspectionAt?: string | null;
}

export interface CreateFireExtinguisherRequest {
    parkingId: string;
    floorId: string;
    zoneId?: string | null;
    code: string;
    type: FireExtinguisherType;
    locationDescription: string;
    xCoordinate?: number | null;
    yCoordinate?: number | null;
    manufactureDate?: string | null;
    expiryDate?: string | null;
    nextInspectionAt?: string | null;
    status: FireExtinguisherStatus;
    note?: string | null;
}

export type UpdateFireExtinguisherRequest = CreateFireExtinguisherRequest;

export interface UpdateFireExtinguisherStatusRequest {
    status: FireExtinguisherStatus;
}

export interface UpdateFireExtinguisherCoordinateRequest {
    xCoordinate: number;
    yCoordinate: number;
}

export interface FireExtinguisherListParams {
    parkingId?: string;
    floorId?: string;
    zoneId?: string;
    status?: FireExtinguisherStatus;
    type?: FireExtinguisherType;
    search?: string;
    expiringWithinDays?: number;
    page?: number;
    size?: number;
}

export interface FireInspectionLogListParams {
    extinguisherId?: string;
    parkingId?: string;
    floorId?: string;
    result?: FireInspectionResult;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}

export type FireExtinguisherPageResponse =
    ApiPageResponse<FireExtinguisher>;
export type FireInspectionLogPageResponse =
    ApiPageResponse<FireExtinguisherInspectionLog>;

export const fireExtinguisherFormSchema = z
    .object({
        parkingId: z.string().trim().min(1, 'Parking is required.'),
        floorId: z.string().trim().min(1, 'Floor is required.'),
        zoneId: z.string().trim().optional(),
        code: z.string().trim().min(1, 'Code is required.').max(80),
        type: z.enum(fireExtinguisherTypeValues),
        locationDescription: z
            .string()
            .trim()
            .min(1, 'Location is required.')
            .max(255),
        xCoordinate: z.coerce
            .number()
            .min(0, 'X must be from 0 to 100.')
            .max(100, 'X must be from 0 to 100.')
            .optional()
            .or(z.literal('')),
        yCoordinate: z.coerce
            .number()
            .min(0, 'Y must be from 0 to 100.')
            .max(100, 'Y must be from 0 to 100.')
            .optional()
            .or(z.literal('')),
        manufactureDate: z.string().trim().optional(),
        expiryDate: z.string().trim().optional(),
        nextInspectionAt: z.string().trim().optional(),
        status: z.enum(fireExtinguisherStatusValues),
        note: z.string().trim().max(1000).optional(),
    })
    .refine(
        (value) =>
            (value.xCoordinate === '' && value.yCoordinate === '') ||
            (typeof value.xCoordinate === 'number' &&
                typeof value.yCoordinate === 'number') ||
            (typeof value.xCoordinate === 'undefined' &&
                typeof value.yCoordinate === 'undefined'),
        {
            message: 'Enter both X and Y coordinates, or leave both blank.',
            path: ['xCoordinate'],
        },
    );

export type FireExtinguisherFormValues = z.infer<
    typeof fireExtinguisherFormSchema
>;
