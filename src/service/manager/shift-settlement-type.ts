export type ManagerShiftSettlementStatus = 'OPEN' | 'CLOSED';

export type ManagerShiftSettlementTransactionType =
    | 'PARKING_CASH'
    | 'SURCHARGE_CASH'
    | 'PENALTY_CASH'
    | 'LOST_CARD_FINE'
    | 'ADJUSTMENT';

export type ManagerShiftSettlementTransactionSource =
    | 'NORMAL_EXIT'
    | 'LOST_CARD_EXIT'
    | 'PENALTY_COLLECTION';

export interface ManagerShiftSettlementListParams {
    parkingId?: string;
    staffId?: string;
    status?: ManagerShiftSettlementStatus;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}

export interface ManagerShiftSettlementListItem {
    id: string;
    staffId: string;
    staffName?: string | null;
    staffUsername?: string | null;
    parkingId: string;
    parkingName?: string | null;
    kioskId: string;
    kioskName?: string | null;
    openedAt: string;
    closedAt?: string | null;
    status: ManagerShiftSettlementStatus | string;
    expectedCashAmount: number;
    countedCashAmount?: number | null;
    varianceAmount?: number | null;
    onlineAmount: number;
    transactionCount: number;
}

export interface ManagerShiftSettlementShift
    extends ManagerShiftSettlementListItem {
    cashParkingAmount: number;
    surchargeCashAmount: number;
    penaltyCashAmount: number;
    lostCardCashAmount: number;
    note?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface ManagerShiftSettlementTransaction {
    id: string;
    type: ManagerShiftSettlementTransactionType | string;
    source: ManagerShiftSettlementTransactionSource | string;
    amount: number;
    occurredAt: string;
    parkingSessionId?: string | null;
    penaltyCaseId?: string | null;
    note?: string | null;
}

export interface ManagerShiftSettlementDetail {
    shift: ManagerShiftSettlementShift;
    transactions: ManagerShiftSettlementTransaction[];
}

export interface ManagerShiftSettlementPageResponse {
    content: ManagerShiftSettlementListItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages?: number;
}
