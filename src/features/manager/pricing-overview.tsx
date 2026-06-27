'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Calculator,
    CreditCard,
    ParkingCircle,
    SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    formatMoney,
    getRuleScope,
    getRuleVehicleLabel,
} from '@/features/manager/pricing-shared';
import {
    listPricingRulesApi,
    managerPricingQueryKeys,
} from '@/service/manager/pricing-api';

export function PricingOverview() {
    const rulesQuery = useQuery({
        queryKey: managerPricingQueryKeys.ruleList({ page: 0, size: 100 }),
        queryFn: () => listPricingRulesApi({ page: 0, size: 100 }),
        retry: false,
    });
    const rules = rulesQuery.data?.content ?? [];
    const activeRules = rules.filter((rule) => rule.status === 'ACTIVE');
    const inactiveRules = rules.filter((rule) => rule.status === 'INACTIVE');
    const coveredVehicles = new Set(
        rules
            .map((rule) => rule.vehicleTypeId ?? rule.vehicleTypeCode)
            .filter(Boolean),
    ).size;
    const parkingOverrides = rules.filter((rule) => !!rule.parkingId).length;

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Pricing & Billing
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        Pricing rules are used by Driver PWA checkout quotes,
                        PayOS payment, and Staff Exit Gate decisions.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href="/manager/pricing/config">
                            <SlidersHorizontal data-icon="inline-start" />
                            Pricing Config
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Active Rules"
                    value={activeRules.length}
                    loading={rulesQuery.isLoading}
                    icon={CreditCard}
                />
                <StatCard
                    label="Inactive Rules"
                    value={inactiveRules.length}
                    loading={rulesQuery.isLoading}
                    icon={CreditCard}
                />
                <StatCard
                    label="Vehicle Types Covered"
                    value={coveredVehicles}
                    loading={rulesQuery.isLoading}
                    icon={Calculator}
                />
                <StatCard
                    label="Parking Overrides"
                    value={parkingOverrides}
                    loading={rulesQuery.isLoading}
                    icon={ParkingCircle}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Pricing Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {rulesQuery.isLoading ? (
                            <Skeleton className="h-28 w-full" />
                        ) : rulesQuery.isError ? (
                            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                                Pricing rules API could not be loaded.
                            </p>
                        ) : rules.length === 0 ? (
                            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                                No pricing rules yet. Create a time rule before
                                enabling checkout quotes.
                            </p>
                        ) : (
                            rules.slice(0, 6).map((rule) => (
                                <div
                                    key={rule.id}
                                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {rule.name}
                                        </p>
                                        <p className="text-muted-foreground truncate text-xs">
                                            {getRuleScope(rule)} ·{' '}
                                            {getRuleVehicleLabel(rule)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            {formatMoney(rule.firstBlockPrice)}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {rule.status}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Demo Flow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p className="text-muted-foreground">
                            Manager configures a pricing rule, Driver PWA uses
                            it for checkout quote and payment, then Staff Exit
                            Gate uses payment state to allow exit, collect cash,
                            or apply surcharge.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/manager/pricing/config">
                                Open Pricing Config
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    loading,
    icon: Icon,
}: {
    label: string;
    value: number;
    loading: boolean;
    icon: typeof CreditCard;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-sm">{label}</CardTitle>
                <div className="bg-muted flex size-9 items-center justify-center rounded-lg border">
                    <Icon className="size-4" />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-9 w-20" />
                ) : (
                    <p className="text-3xl font-semibold">
                        {value.toLocaleString()}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
