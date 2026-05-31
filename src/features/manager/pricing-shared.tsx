import type {
    PricingBreakdownItem,
    PricingRuleResponse,
} from '@/service/manager/pricing-type';

export const ALL_PARKINGS = 'ALL_PARKINGS';
export const TENANT_DEFAULT = 'TENANT_DEFAULT';
export const ALL_VEHICLE_TYPES = 'ALL_VEHICLE_TYPES';
export const ALL_STATUSES = 'ALL_STATUSES';
export const DEFAULT_PAGE = 0;
export const DEFAULT_PAGE_SIZE = 20;

export const formatMoney = (value?: number | null, currency = 'VND') => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'VND' ? 0 : 2,
    }).format(value);
};

export const formatMinutes = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    if (value < 60) {
        return `${value} min`;
    }

    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

export const getRuleScope = (rule: PricingRuleResponse) =>
    rule.parkingName || (rule.parkingId ? 'Parking override' : 'Tenant default');

export const getRuleVehicleLabel = (rule: PricingRuleResponse) =>
    rule.vehicleTypeName || rule.vehicleTypeCode || rule.vehicleTypeId || '-';

export const getRuleVehicleTypeId = (
    rule: PricingRuleResponse,
    vehicleTypes: Array<{ id: string; code: string }>,
) =>
    rule.vehicleTypeId ||
    vehicleTypes.find((type) => type.code === rule.vehicleTypeCode)?.id ||
    '';

export const getBreakdownItems = <T extends PricingBreakdownItem>(
    value?: { breakdown?: T[]; pricingBreakdown?: T[] } | null,
) => value?.breakdown ?? value?.pricingBreakdown ?? [];

export function StatusBadge({ value }: { value: string }) {
    return (
        <span className="bg-muted inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
            {value}
        </span>
    );
}
