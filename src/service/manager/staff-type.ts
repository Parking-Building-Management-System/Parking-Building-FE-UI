export const managerStaffStatusValues = [
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
] as const;

export type ManagerStaffStatus = (typeof managerStaffStatusValues)[number];

export interface ManagerStaffItem {
    id: string;
    username: string;
    fullName: string;
    phone: string;
    status: ManagerStaffStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface ManagerStaffPageResponse {
    content: ManagerStaffItem[];
    page: number;
    size: number;
    totalElements: number;
}

export interface ManagerStaffListParams {
    search?: string;
    status?: ManagerStaffStatus;
    page?: number;
    size?: number;
}

export interface CreateManagerStaffRequest {
    username: string;
    initialPassword: string;
    fullName: string;
    phone: string;
    status?: ManagerStaffStatus;
}

export interface UpdateManagerStaffRequest {
    fullName: string;
    phone: string;
    status?: ManagerStaffStatus;
}

export interface UpdateManagerStaffStatusRequest {
    status: ManagerStaffStatus;
}

export interface ResetManagerStaffPasswordRequest {
    newPassword: string;
}
