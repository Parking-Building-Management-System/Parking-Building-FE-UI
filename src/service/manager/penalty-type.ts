export const penaltyRuleStatusValues = ['ACTIVE', 'INACTIVE'] as const;

export const penaltyTypeValues = [
    'OCCUPIED_ASSIGNED_SLOT',
    'ILLEGAL_PARKING',
    'LOST_CARD',
    'BLOCKING_LANE',
    'OTHER',
] as const;

export type PenaltyRuleStatus = (typeof penaltyRuleStatusValues)[number];
export type PenaltyType = (typeof penaltyTypeValues)[number];

export interface PenaltyRuleListParams {
    parkingId?: string;
    type?: PenaltyType;
    status?: PenaltyRuleStatus;
    page?: number;
    size?: number;
}

export interface PenaltyRuleResponse {
    id: string;
    code: string;
    name: string;
    parkingId?: string | null;
    parkingName?: string | null;
    type: PenaltyType;
    amount: number;
    currency?: string | null;
    requiresPhoto: boolean;
    description?: string | null;
    status: PenaltyRuleStatus;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface PenaltyRulePageResponse {
    content: PenaltyRuleResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages?: number;
}

export interface PenaltyRuleRequest {
    code?: string | null;
    name: string;
    parkingId?: string | null;
    type: PenaltyType;
    amount: number;
    currency?: string | null;
    requiresPhoto: boolean;
    description?: string | null;
    status?: PenaltyRuleStatus;
}

export interface PenaltyRuleStatusRequest {
    status: PenaltyRuleStatus;
}
