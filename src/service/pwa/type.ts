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

export type PwaPaymentStatus =
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'CANCELLED'
    | 'EXPIRED';

export type PwaCheckoutNextAction =
    | 'CREATE_PAYMENT_INTENT'
    | 'CONTINUE_PAYMENT'
    | 'EXIT_WITHIN_GRACE_PERIOD'
    | 'PAYMENT_PROVIDER_DISABLED';

export interface PwaPricingBreakdownItem {
    label: string;
    minutes?: number | null;
    quantity?: number | null;
    unitPrice?: number | null;
    amount: number;
}

export interface PwaExistingPaymentIntent {
    orderCode?: number | string | null;
    status?: PwaPaymentStatus | string | null;
    checkoutUrl?: string | null;
    expiresAt?: string | null;
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
    nextAction?: PwaCheckoutNextAction | string | null;
    paymentStatus?: PwaPaymentStatus | string | null;
    paidAt?: string | null;
    exitDeadline?: string | null;
    existingPaymentIntent?: PwaExistingPaymentIntent | null;
    message?: string | null;
}

export interface PwaCreatePaymentIntentResponse {
    paymentIntentId?: string | null;
    orderCode: number | string;
    amount?: number | null;
    currency?: string | null;
    status: PwaPaymentStatus | string;
    provider?: string | null;
    checkoutUrl?: string | null;
    qrCode?: string | null;
    expiresAt?: string | null;
    description?: string | null;
    paidAt?: string | null;
    exitDeadline?: string | null;
    sessionId?: string | null;
    plateNumber?: string | null;
    cardCode?: string | null;
}

export interface PwaPaymentIntentStatusResponse {
    orderCode: number | string;
    status: PwaPaymentStatus | string;
    amount?: number | null;
    currency?: string | null;
    paidAt?: string | null;
    exitDeadline?: string | null;
    sessionId?: string | null;
    plateNumber?: string | null;
    cardCode?: string | null;
    checkoutUrl?: string | null;
    qrCode?: string | null;
}
