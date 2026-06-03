import * as z from 'zod';

import type {
    FireExtinguisherStatus,
    FireExtinguisherType,
    FireInspectionResult,
} from '@/service/manager/fire-safety-type';
import { fireInspectionResultValues } from '@/service/manager/fire-safety-type';

export interface DueFireInspectionItem {
    id: string;
    code: string;
    type: FireExtinguisherType;
    status: FireExtinguisherStatus;
    parkingId?: string | null;
    parkingName?: string | null;
    floorId?: string | null;
    floorName?: string | null;
    floorCode?: string | null;
    zoneId?: string | null;
    zoneName?: string | null;
    locationDescription?: string | null;
    expiryDate?: string | null;
    nextInspectionAt?: string | null;
}

export interface StaffFireInspectionDueParams {
    floorId?: string;
    status?: FireExtinguisherStatus;
}

export interface SubmitFireInspectionRequest {
    fireExtinguisherId: string;
    result: FireInspectionResult;
    pressureOk: boolean;
    sealOk: boolean;
    locationOk: boolean;
    expiryOk: boolean;
    photoObjectKey?: string;
    photoUrl?: string;
    note?: string;
    nextInspectionAt?: string;
}

export interface FireInspectionPhotoPresignUploadRequest {
    fileName: string;
    contentType: string;
}

export interface FireInspectionPhotoPresignUploadResponse {
    uploadUrl: string;
    objectKey: string;
    method: 'PUT' | string;
    headers?: Record<string, string>;
    expiresInSeconds?: number;
}

export const staffFireInspectionFormSchema = z.object({
    fireExtinguisherId: z
        .string()
        .trim()
        .min(1, 'Select a fire extinguisher.'),
    result: z.enum(fireInspectionResultValues),
    pressureOk: z.boolean(),
    sealOk: z.boolean(),
    locationOk: z.boolean(),
    expiryOk: z.boolean(),
    photoUrl: z
        .string()
        .trim()
        .url('Photo URL must be valid.')
        .optional()
        .or(z.literal('')),
    note: z.string().trim().max(1000).optional(),
    nextInspectionAt: z.string().trim().optional(),
});

export type StaffFireInspectionFormValues = z.infer<
    typeof staffFireInspectionFormSchema
>;
