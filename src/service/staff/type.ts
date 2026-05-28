import * as z from 'zod';

export interface StaffCheckInRequest {
    plateNumber: string;
    cardCode: string;
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
    parkingId?: string;
    parkingName?: string | null;
    entryTime: string;
    status: string;
}

export const staffCheckInFormSchema = z.object({
    plateNumber: z
        .string()
        .trim()
        .min(1, 'Plate number is required.')
        .max(32, 'Plate number must be 32 characters or fewer.'),
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
