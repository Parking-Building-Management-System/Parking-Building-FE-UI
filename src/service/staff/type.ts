import * as z from 'zod';

export interface StaffCheckInRequest {
    plateNumber: string;
    cardCode: string;
    vehicleTypeId: string;
    entryImageUrl: string;
    licensePlateImageUrl: string;
    parkingId?: string;
}

export interface StaffCheckInResponse {
    sessionId?: string;
    plateNumber: string;
    cardCode: string;
    qrToken?: string | null;
    pwaAccessPath?: string | null;
    assignedSlotId?: string;
    assignedSlotCode: string;
    zoneId?: string;
    zoneName: string;
    vehicleTypeId?: string | null;
    vehicleTypeCode?: string | null;
    vehicleTypeName?: string | null;
    entryImageUrl?: string | null;
    licensePlateImageUrl?: string | null;
    parkingId?: string;
    parkingName?: string | null;
    entryTime: string;
    status: string;
}

export type StaffExitDecision =
    | 'ALLOW_EXIT'
    | 'COLLECT_CASH'
    | 'GRACE_EXPIRED_SURCHARGE'
    | 'BLOCKED';

export type StaffExitPaymentMode = 'ONLINE' | 'CASH' | 'SURCHARGE_CASH';

export interface StaffExitPreviewRequest {
    cardCode: string;
}

export interface StaffCompleteExitRequest {
    sessionId: string;
    cardCode: string;
    paymentMode: StaffExitPaymentMode;
    collectedAmount: number;
    note?: string;
}

export interface StaffExitPreviewResponse {
    exitDecision: StaffExitDecision | string;
    decision?: StaffExitDecision | string;
    sessionId?: string | null;
    plateNumber?: string | null;
    cardCode?: string | null;
    slotCode?: string | null;
    floorName?: string | null;
    zoneName?: string | null;
    parkingName?: string | null;
    checkInAt?: string | null;
    durationMinutes?: number | null;
    amountDue?: number | null;
    surchargeAmount?: number | null;
    totalAmount?: number | null;
    parkingAmountDue?: number | null;
    surchargeAmountDue?: number | null;
    penaltyAmountDue?: number | null;
    totalAmountDue?: number | null;
    penaltyCases?: StaffPenaltyCase[];
    hasUnpaidPenalties?: boolean | null;
    currency?: string | null;
    paymentStatus?: string | null;
    paidAt?: string | null;
    exitDeadline?: string | null;
    message?: string | null;
    errorCode?: string | null;
    pricingRuleName?: string | null;
    entryImageUrl?: string | null;
    licensePlateImageUrl?: string | null;
}

export type PenaltyCaseStatus =
    | 'REPORTED'
    | 'APPLIED'
    | 'WAIVED'
    | 'COLLECTED';

export type PenaltyType =
    | 'OCCUPIED_ASSIGNED_SLOT'
    | 'ILLEGAL_PARKING'
    | 'LOST_CARD'
    | 'BLOCKING_LANE'
    | 'OTHER';

export interface StaffPenaltyCase {
    id: string;
    type: PenaltyType | string;
    name?: string | null;
    amount: number;
    currency?: string | null;
    status: PenaltyCaseStatus | string;
    targetLicensePlate?: string | null;
    offenderLicensePlate?: string | null;
    reportedSlotCode?: string | null;
    reassignedSlotCode?: string | null;
    evidenceImageUrl?: string | null;
    identityImageUrl?: string | null;
    vehicleImageUrl?: string | null;
    licensePlateImageUrl?: string | null;
    note?: string | null;
    createdAt?: string | null;
    collectedAt?: string | null;
}

export interface StaffParkingSessionPhotoPresignUploadRequest {
    fileName: string;
    contentType: string;
    photoType: 'ENTRY_OVERVIEW' | 'LICENSE_PLATE';
}

export interface StaffParkingSessionPhotoPresignUploadResponse {
    uploadUrl: string;
    objectKey: string;
    method: 'PUT' | string;
    headers?: Record<string, string>;
    expiresInSeconds?: number;
}

export interface StaffCompleteExitResponse {
    sessionId?: string | null;
    plateNumber?: string | null;
    cardCode?: string | null;
    checkInAt?: string | null;
    slotCode?: string | null;
    totalAmount?: number | null;
    penaltyAmountDue?: number | null;
    totalAmountDue?: number | null;
    collectedAmount?: number | null;
    currency?: string | null;
    paymentMode?: StaffExitPaymentMode | string | null;
    checkOutAt?: string | null;
    status?: string | null;
    slotStatus?: string | null;
    cardStatus?: string | null;
    message?: string | null;
}

export interface StaffLostCardPhotoPresignUploadRequest {
    fileName: string;
    contentType: string;
    photoType: 'IDENTITY_DOCUMENT' | 'VEHICLE' | 'LICENSE_PLATE';
}

export interface StaffLostCardPhotoPresignUploadResponse {
    uploadUrl: string;
    objectKey: string;
    method: 'PUT' | string;
    headers?: Record<string, string>;
    expiresInSeconds?: number;
    publicUrl?: string | null;
}

export interface StaffLostCardPreviewResponse {
    sessionId: string;
    plateNumber: string;
    vehicleTypeId?: string | null;
    vehicleType?: string | null;
    parkingId?: string | null;
    parkingName?: string | null;
    zoneId?: string | null;
    zoneName?: string | null;
    slotId?: string | null;
    slotCode?: string | null;
    checkInAt?: string | null;
    entryImageUrl?: string | null;
    licensePlateImageUrl?: string | null;
    parkingAmountDue?: number | null;
    surchargeAmountDue?: number | null;
    existingPenaltyAmount?: number | null;
    lostCardPenaltyAmount?: number | null;
    totalDueIfLostCard?: number | null;
    currency?: string | null;
    currentRfidCardCode?: string | null;
    activePenaltyCases?: StaffPenaltyCase[];
}

export interface StaffLostCardCaseRequest {
    sessionId: string;
    identityImageUrl: string;
    vehicleImageUrl: string;
    licensePlateImageUrl: string;
    note?: string;
}

export interface StaffLostCardCaseResponse {
    penaltyCase: StaffPenaltyCase;
    message?: string | null;
}

export interface StaffLostCardCompleteExitRequest {
    sessionId: string;
    lostCardCaseId: string;
    collectedAmount: number;
    note?: string;
}

export interface StaffLostCardCompleteExitResponse {
    sessionId?: string | null;
    status?: string | null;
    plateNumber?: string | null;
    checkOutAt?: string | null;
    parkingAmountDue?: number | null;
    surchargeAmountDue?: number | null;
    penaltyAmountDue?: number | null;
    totalAmountDue?: number | null;
    collectedAmount?: number | null;
    currency?: string | null;
    slotCode?: string | null;
    slotStatus?: string | null;
    cardCode?: string | null;
    cardStatus?: string | null;
    message?: string | null;
}

export interface AvailableRfidCard {
    id: string;
    code: string;
    label?: string | null;
    status: 'ACTIVE' | string;
}

export interface StaffVehicleType {
    id: string;
    code: string;
    name: string;
    displayName?: string | null;
    label?: string | null;
    active?: boolean;
    status?: string | null;
    createdAt?: string;
}

export const staffCheckInFormSchema = z.object({
    plateNumber: z
        .string()
        .trim()
        .min(1, 'Plate number is required.')
        .max(32, 'Plate number must be 32 characters or fewer.'),
    vehicleTypeId: z.string().trim().min(1, 'Vehicle type is required.'),
    cardCode: z
        .string()
        .trim()
        .min(1, 'Card code is required.')
        .max(64, 'Card code must be 64 characters or fewer.'),
});

export type StaffCheckInFormValues = z.infer<typeof staffCheckInFormSchema>;
