export type PwaCoordinateMode = 'PERCENT';

export interface PwaActiveSessionResponse {
    sessionId?: string;
    plateNumber?: string | null;
    licensePlate?: string | null;
    cardCode?: string | null;
    parkingName?: string | null;
    floorName?: string | null;
    zoneName?: string | null;
    slotCode?: string | null;
    xCoordinate?: number | null;
    yCoordinate?: number | null;
    coordinateMode?: PwaCoordinateMode | string | null;
    mapImageUrl?: string | null;
    mapDisplayUrl?: string | null;
    mapUrlExpiresInSeconds?: number | null;
    status?: string | null;
    guideText?: string | null;
    checkInTime?: string | null;
    entryTime?: string | null;
    checkInAt?: string | null;
}

export type PwaCheckoutQuoteState =
    | 'ACTIVE_UNPAID'
    | 'PAID'
    | 'COMPLETED'
    | 'NO_ACTIVE_SESSION'
    | 'NO_PRICING_RULE';

export interface PwaPricingBreakdownItem {
    label: string;
    minutes?: number | null;
    quantity?: number | null;
    unitPrice?: number | null;
    amount: number;
}

export interface PwaCheckoutQuoteResponse {
    state?: PwaCheckoutQuoteState | string | null;
    sessionId?: string | null;
    plateNumber?: string | null;
    licensePlate?: string | null;
    cardCode?: string | null;
    status?: string | null;
    checkInAt?: string | null;
    checkOutAt?: string | null;
    quotedAt?: string | null;
    durationMinutes?: number | null;
    chargeableMinutes?: number | null;
    vehicleTypeId?: string | null;
    vehicleTypeName?: string | null;
    parkingName?: string | null;
    floorName?: string | null;
    zoneName?: string | null;
    slotCode?: string | null;
    amount?: number | null;
    currency?: string | null;
    pricingRuleId?: string | null;
    pricingRuleName?: string | null;
    breakdown?: PwaPricingBreakdownItem[];
    pricingBreakdown?: PwaPricingBreakdownItem[];
    paymentAvailable?: boolean | null;
    nextAction?: string | null;
    message?: string | null;
}
