import * as z from 'zod';

export type Role =
    | 'SYSTEM_ADMIN'
    | 'STAFF'
    | 'PARKING_MANAGER'
    | 'PARKING_USER';

export interface UserProfile {
    id: string;
    tenantId: string;
    username: string;
    fullName: string;
    phone: string;
    roles: Role[];
    permissions: string[];
    workContext?: StaffWorkContext | null;
}

export interface StaffWorkContext {
    kioskId: string;
    kioskName: string;
    kioskType: 'ENTRY' | 'EXIT' | 'BOTH';
    parkingId: string;
    parkingName: string;
}

export interface AuthenticationResponse {
    authenticated: boolean;
    accessToken: string;
    refreshToken: string;
}

export const loginSchema = z.object({
    username: z.string().min(1, {
        message: 'Username is required.',
    }),
    password: z.string().min(1, {
        message: 'Password is required.',
    }),
    deviceFingerprint: z.string().min(1, {
        message: 'Device fingerprint is required.',
    }),
    deviceLabel: z.string().optional(),
});

export const loginFormSchema = loginSchema.pick({
    username: true,
    password: true,
});

export type LoginRequest = z.infer<typeof loginSchema>;

export type LoginFormValues = z.infer<typeof loginFormSchema>;
