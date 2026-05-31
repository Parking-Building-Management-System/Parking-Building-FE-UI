'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ALL_PARKINGS,
    ALL_STATUSES,
    StatusBadge,
    formatMinutes,
    formatMoney,
    getRuleScope,
    getRuleVehicleLabel,
} from '@/features/manager/pricing-shared';
import {
    listParkingsApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';
import {
    listPricingRulesApi,
    managerPricingQueryKeys,
} from '@/service/manager/pricing-api';
import {
    pricingRuleStatusValues,
    type PricingRuleListParams,
    type PricingRuleStatus,
} from '@/service/manager/pricing-type';

type PricingStatusFilter = PricingRuleStatus | typeof ALL_STATUSES;

export function PricingMatrix() {
    const [parkingId, setParkingId] = useState(ALL_PARKINGS);
    const [status, setStatus] = useState<PricingStatusFilter>(ALL_STATUSES);
    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });
    const params = useMemo<PricingRuleListParams>(
        () => ({
            parkingId: parkingId === ALL_PARKINGS ? undefined : parkingId,
            status: status === ALL_STATUSES ? undefined : status,
            page: 0,
            size: 100,
        }),
        [parkingId, status],
    );
    const rulesQuery = useQuery({
        queryKey: managerPricingQueryKeys.ruleList(params),
        queryFn: () => listPricingRulesApi(params),
        placeholderData: keepPreviousData,
    });
    const rules = rulesQuery.data?.content ?? [];

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Pricing Matrix
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        Compact view of pricing rules by parking scope and
                        vehicle type.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/manager/pricing/time-rules">
                        <Pencil data-icon="inline-start" />
                        Manage in Time Rules
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                    <Select value={parkingId} onValueChange={setParkingId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Parking" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_PARKINGS}>
                                All parkings
                            </SelectItem>
                            {(parkingsQuery.data ?? []).map((parking) => (
                                <SelectItem key={parking.id} value={parking.id}>
                                    {parking.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={status}
                        onValueChange={(value) =>
                            setStatus(value as PricingStatusFilter)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES}>
                                All statuses
                            </SelectItem>
                            {pricingRuleStatusValues.map((ruleStatus) => (
                                <SelectItem key={ruleStatus} value={ruleStatus}>
                                    {ruleStatus}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Matrix</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        {(rulesQuery.data?.totalElements ?? rules.length).toLocaleString()}{' '}
                        rules
                    </p>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Parking Scope</TableHead>
                                <TableHead>Vehicle Type</TableHead>
                                <TableHead>Free</TableHead>
                                <TableHead>First Block</TableHead>
                                <TableHead>Next Block</TableHead>
                                <TableHead>Daily Cap</TableHead>
                                <TableHead>Grace</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rulesQuery.isLoading && (
                                <TableRow>
                                    <TableCell colSpan={9}>
                                        <Skeleton className="h-6 w-full" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!rulesQuery.isLoading &&
                                rules.map((rule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell>
                                            {getRuleScope(rule)}
                                        </TableCell>
                                        <TableCell>
                                            {getRuleVehicleLabel(rule)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMinutes(rule.freeMinutes)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMinutes(
                                                rule.firstBlockMinutes,
                                            )}{' '}
                                            /{' '}
                                            {formatMoney(rule.firstBlockPrice)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMinutes(
                                                rule.nextBlockMinutes,
                                            )}{' '}
                                            / {formatMoney(rule.nextBlockPrice)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMoney(rule.dailyCapPrice)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMinutes(
                                                rule.graceMinutesAfterPayment,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge value={rule.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link href="/manager/pricing/time-rules">
                                                    Manage
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!rulesQuery.isLoading && rulesQuery.isError && (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        Pricing rules could not be loaded.
                                    </TableCell>
                                </TableRow>
                            )}
                            {!rulesQuery.isLoading &&
                                !rulesQuery.isError &&
                                rules.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="text-muted-foreground h-28 text-center"
                                        >
                                            No pricing rules found.
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
