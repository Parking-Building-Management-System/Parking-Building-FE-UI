'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
    Calculator,
    CreditCard,
    Grid3X3,
    ParkingCircle,
    Plus,
} from 'lucide-react';

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
        rules.map((rule) => rule.vehicleTypeId ?? rule.vehicleTypeCode).filter(Boolean),
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
                        Configure pricing rules used by driver checkout quotes.
                        Payments, invoices, subscriptions, and debts remain
                        pending for later flows.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href="/manager/pricing/time-rules">
                            <Plus data-icon="inline-start" />
                            Create Time Rule
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/manager/pricing/matrix">
                            <Grid3X3 data-icon="inline-start" />
                            Pricing Matrix
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
                        <CardTitle>Flow 2A Scope</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p className="text-muted-foreground">
                            This slice wires rule setup and PWA quote display.
                            Online payment, VietQR, webhook handling, invoices,
                            debts, and Staff Exit Gate are intentionally pending.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/manager/pricing/time-rules">
                                Manage Time Rules
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
