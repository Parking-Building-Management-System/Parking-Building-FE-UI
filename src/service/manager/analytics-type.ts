export const analyticsPeriodTypeValues = [
    'DAY',
    'WEEK',
    'MONTH',
    'QUARTER',
    'YEAR',
    'CUSTOM',
] as const;

export type AnalyticsPeriodType = (typeof analyticsPeriodTypeValues)[number];
export type AnalyticsComparison = 'SAME_PERIOD_LAST_YEAR';
export type AnalyticsDirection =
    | 'UP'
    | 'DOWN'
    | 'UNCHANGED'
    | 'NOT_AVAILABLE';

export interface ManagerAnalyticsParams {
    parkingId: string;
    periodType: AnalyticsPeriodType;
    date?: string;
    year?: number;
    month?: number;
    quarter?: number;
    from?: string;
    to?: string;
    comparison: AnalyticsComparison;
    vehicleTypeId?: string;
}

export interface AnalyticsPeriod {
    from: string;
    to: string;
    label: string;
    timeZone: string;
}

export interface AnalyticsCountComparison {
    current: number;
    comparison: number;
    change: number;
    changePercent: number | null;
    direction: AnalyticsDirection;
}

export interface AnalyticsDecimalComparison {
    current: number | null;
    comparison: number | null;
    change: number | null;
    changePercent: number | null;
    direction: AnalyticsDirection;
}

export interface AnalyticsRevenueBreakdown {
    payos: number;
    parkingCash: number;
    surchargeCash: number;
    penaltyCash: number;
    lostCardFine: number;
    total: number;
}

export interface AnalyticsRevenue {
    metric: AnalyticsDecimalComparison;
    currentBreakdown: AnalyticsRevenueBreakdown;
    comparisonBreakdown: AnalyticsRevenueBreakdown;
}

export interface AnalyticsCurrentOccupancy {
    totalUsableSlots: number;
    occupiedSlots: number;
    availableSlots: number;
    reservedSlots: number;
    occupancyRate: number | null;
    comparisonAvailable: boolean;
    note: string;
}

export interface AnalyticsAverageOccupancy {
    averageOccupancyRate: AnalyticsDecimalComparison;
    currentAverageActiveSessions: number;
    comparisonAverageActiveSessions: number;
    currentUsableCapacity: number;
    approximation: boolean;
    denominator: 'CURRENT_USABLE_CAPACITY';
    note: string;
}

export interface AnalyticsTrafficPoint {
    bucketStart: string;
    label: string;
    entries: number;
    exits: number;
}

export interface AnalyticsVehicleTypeSummary {
    vehicleTypeId: string;
    code: string;
    name: string;
    entries: AnalyticsCountComparison;
    exits: AnalyticsCountComparison;
    revenue: AnalyticsDecimalComparison;
    currentOccupancy: AnalyticsCurrentOccupancy;
    averageOccupancy: AnalyticsAverageOccupancy;
}

export interface AnalyticsPeakHour {
    vehicleTypeId: string;
    vehicleTypeCode: string;
    vehicleTypeName: string;
    hour: number;
    label: string;
    entryCount: number;
    exitCount: number;
}

export interface ManagerAnalyticsOverview {
    period: AnalyticsPeriod;
    comparisonPeriod: AnalyticsPeriod;
    comparison: AnalyticsComparison;
    selectedVehicleTypeId: string | null;
    entries: AnalyticsCountComparison;
    exits: AnalyticsCountComparison;
    revenue: AnalyticsRevenue;
    currentOccupancy: AnalyticsCurrentOccupancy;
    averageOccupancy: AnalyticsAverageOccupancy;
    trafficTrend: AnalyticsTrafficPoint[];
    comparisonTrafficTrend: AnalyticsTrafficPoint[];
    byVehicleType: AnalyticsVehicleTypeSummary[];
    peakHours: AnalyticsPeakHour[];
}
