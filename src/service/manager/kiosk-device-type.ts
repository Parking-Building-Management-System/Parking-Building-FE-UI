export const kioskTypeValues = ['ENTRY', 'EXIT', 'MIXED'] as const;
export const kioskStatusValues = ['ACTIVE', 'INACTIVE'] as const;
export const deviceApprovalStatusValues = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'SUSPENDED',
] as const;

export type KioskType = (typeof kioskTypeValues)[number];
export type KioskStatus = (typeof kioskStatusValues)[number];
export type DeviceApprovalStatus = (typeof deviceApprovalStatusValues)[number];

export interface KioskItem {
    id: string;
    parkingId: string;
    parkingName?: string | null;
    code?: string | null;
    name: string;
    type: KioskType;
    status: KioskStatus;
    assignedStaffCount?: number | null;
    staffCount?: number | null;
    lastHeartbeatAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface KioskListParams {
    parkingId?: string;
    status?: KioskStatus;
    type?: KioskType;
}

export interface CreateKioskRequest {
    parkingId: string;
    name: string;
    type: KioskType;
    status?: KioskStatus;
}

export interface UpdateKioskRequest {
    name: string;
    type: KioskType;
    status?: KioskStatus;
}

export interface UpdateKioskStatusRequest {
    status: KioskStatus;
}

export interface KioskStaffItem {
    id?: string;
    staffId?: string;
    staffUserId?: string;
    userId?: string;
    username: string;
    fullName?: string | null;
    phone?: string | null;
    status?: string;
    assignedAt?: string;
    isActive?: boolean;
}

export interface DeviceApprovalItem {
    id: string;
    deviceId?: string | null;
    staffId?: string | null;
    userId?: string | null;
    staffUsername?: string | null;
    username?: string | null;
    staffFullName?: string | null;
    fullName?: string | null;
    deviceLabel?: string | null;
    label?: string | null;
    fingerprint: string;
    status: DeviceApprovalStatus;
    requestedAt?: string | null;
    createdAt?: string | null;
    kioskId?: string | null;
    kioskName?: string | null;
    parkingName?: string | null;
    expiresAt?: string | null;
}

export interface ApproveDeviceRequest {
    kioskId: string;
    expiresAt?: string | null;
}
