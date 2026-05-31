export const pricingRuleStatusValues = ['ACTIVE', 'INACTIVE'] as const;

export type PricingRuleStatus = (typeof pricingRuleStatusValues)[number];

export interface PricingRuleListParams {
    parkingId?: string;
    vehicleTypeId?: string;
    vehicleTypeCode?: string;
    status?: PricingRuleStatus;
    search?: string;
    page?: number;
    size?: number;
}

export interface PricingRuleResponse {
    id: string;
    name: string;
    parkingId?: string | null;
    parkingName?: string | null;
    vehicleTypeId?: string | null;
    vehicleTypeCode?: string | null;
    vehicleTypeName?: string | null;
    freeMinutes: number;
    firstBlockMinutes: number;
    firstBlockPrice: number;
    nextBlockMinutes: number;
    nextBlockPrice: number;
    dailyCapPrice?: number | null;
    graceMinutesAfterPayment: number;
    status: PricingRuleStatus;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface PricingRulePageResponse {
    content: PricingRuleResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages?: number;
}

export interface PricingRuleRequest {
    name: string;
    parkingId?: string | null;
    vehicleTypeId: string;
    freeMinutes: number;
    firstBlockMinutes: number;
    firstBlockPrice: number;
    nextBlockMinutes: number;
    nextBlockPrice: number;
    dailyCapPrice?: number | null;
    graceMinutesAfterPayment: number;
    status?: PricingRuleStatus;
}

export interface PricingRuleStatusRequest {
    status: PricingRuleStatus;
}

export interface PricingPreviewRequest {
    checkInAt: string;
    checkOutAt: string;
    vehicleTypeId?: string;
    vehicleTypeCode?: string;
    parkingId?: string | null;
}

export interface PricingBreakdownItem {
    label: string;
    minutes?: number | null;
    quantity?: number | null;
    unitPrice?: number | null;
    amount: number;
}

export interface PricingPreviewResponse {
    amount: number;
    currency?: string | null;
    durationMinutes?: number | null;
    chargeableMinutes?: number | null;
    freeMinutesApplied?: number | null;
    dailyCapApplied?: boolean | null;
    ruleId?: string | null;
    ruleName?: string | null;
    breakdown?: PricingBreakdownItem[];
    pricingBreakdown?: PricingBreakdownItem[];
}
