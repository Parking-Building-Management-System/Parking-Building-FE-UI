import * as z from 'zod';

export interface StaffCheckInRequest {
    plateNumber: string;
    cardCode: string;
    vehicleTypeId: string;
    entryImageUrl?: string;
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
    currency?: string | null;
    paymentStatus?: string | null;
    paidAt?: string | null;
    exitDeadline?: string | null;
    message?: string | null;
    errorCode?: string | null;
    pricingRuleName?: string | null;
}

export interface StaffCompleteExitResponse {
    sessionId?: string | null;
    plateNumber?: string | null;
    cardCode?: string | null;
    checkInAt?: string | null;
    slotCode?: string | null;
    totalAmount?: number | null;
    collectedAmount?: number | null;
    currency?: string | null;
    paymentMode?: StaffExitPaymentMode | string | null;
    checkOutAt?: string | null;
    status?: string | null;
    slotStatus?: string | null;
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
    entryImageUrl: z
        .string()
        .trim()
        .url('Entry image URL must be valid.')
        .max(2048, 'Entry image URL must be 2048 characters or fewer.')
        .optional()
        .or(z.literal('')),
});

export type StaffCheckInFormValues = z.infer<typeof staffCheckInFormSchema>;
