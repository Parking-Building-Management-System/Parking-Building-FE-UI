export const managerPasswordResetStatusValues = [
    'PENDING',
    'COMPLETED',
    'REJECTED',
] as const;

export type ManagerPasswordResetStatus =
    (typeof managerPasswordResetStatusValues)[number];

export interface ManagerPasswordResetRequestItem {
    id: string;
    staffId: string;
    staffFullName: string;
    staffUsername: string;
    staffStatus: string;
    requestedEmail: string;
    requestedAt: string;
    status: ManagerPasswordResetStatus;
    reviewedAt?: string | null;
    reviewedById?: string | null;
    reviewedByName?: string | null;
    completedAt?: string | null;
    rejectionReason?: string | null;
}

export interface ManagerPasswordResetPageResponse {
    content: ManagerPasswordResetRequestItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface ManagerPasswordResetListParams {
    status?: ManagerPasswordResetStatus;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}

export interface CompleteManagerPasswordResetRequest {
    newPassword: string;
    confirmPassword: string;
}

export interface RejectManagerPasswordResetRequest {
    reason: string;
}
