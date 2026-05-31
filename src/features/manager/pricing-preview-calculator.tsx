'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/features/admin/error-message';
import {
    formatMinutes,
    formatMoney,
    getBreakdownItems,
    getRuleVehicleTypeId,
} from '@/features/manager/pricing-shared';
import { previewPricingRuleApi } from '@/service/manager/pricing-api';
import type {
    PricingPreviewResponse,
    PricingRuleResponse,
} from '@/service/manager/pricing-type';

interface PricingPreviewCalculatorProps {
    rules: PricingRuleResponse[];
    vehicleTypes: Array<{ id: string; code: string; name: string }>;
}

export function PricingPreviewCalculator({
    rules,
    vehicleTypes,
}: PricingPreviewCalculatorProps) {
    const [ruleId, setRuleId] = useState('');
    const [checkInAt, setCheckInAt] = useState(getDateTimeLocalOffset(-120));
    const [checkOutAt, setCheckOutAt] = useState(getDateTimeLocalOffset(0));
    const selectedRule = useMemo(
        () => rules.find((rule) => rule.id === ruleId),
        [ruleId, rules],
    );
    const previewMutation = useMutation({
        mutationFn: () => {
            if (!selectedRule) {
                throw new Error('Select a pricing rule first.');
            }

            if (!checkInAt || !checkOutAt || checkOutAt <= checkInAt) {
                throw new Error('Check-out time must be after check-in time.');
            }

            return previewPricingRuleApi(selectedRule.id, {
                checkInAt,
                checkOutAt,
                parkingId: selectedRule.parkingId ?? null,
                vehicleTypeId: getRuleVehicleTypeId(
                    selectedRule,
                    vehicleTypes,
                ),
                vehicleTypeCode: selectedRule.vehicleTypeCode ?? undefined,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to preview pricing.'));
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="size-5" />
                    Preview Calculator
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                    Test a rule with check-in and check-out times before using
                    it in the PWA quote flow.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <Select value={ruleId} onValueChange={setRuleId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pricing rule" />
                        </SelectTrigger>
                        <SelectContent>
                            {rules.map((rule) => (
                                <SelectItem key={rule.id} value={rule.id}>
                                    {rule.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="datetime-local"
                        value={checkInAt}
                        onChange={(event) => setCheckInAt(event.target.value)}
                    />
                    <Input
                        type="datetime-local"
                        value={checkOutAt}
                        onChange={(event) => setCheckOutAt(event.target.value)}
                    />
                </div>
                <Button
                    disabled={!ruleId || previewMutation.isPending}
                    onClick={() => previewMutation.mutate()}
                >
                    {previewMutation.isPending ? 'Calculating...' : 'Preview'}
                </Button>
                {previewMutation.isPending ? (
                    <Skeleton className="h-32 w-full" />
                ) : previewMutation.data ? (
                    <PreviewResult result={previewMutation.data} />
                ) : (
                    <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                        Select a rule and calculate a sample amount.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function PreviewResult({ result }: { result: PricingPreviewResponse }) {
    const currency = result.currency || 'VND';
    const breakdown = getBreakdownItems(result);

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="grid gap-3 md:grid-cols-3">
                <Metric
                    label="Amount"
                    value={formatMoney(result.amount, currency)}
                />
                <Metric
                    label="Duration"
                    value={formatMinutes(result.durationMinutes)}
                />
                <Metric
                    label="Chargeable"
                    value={formatMinutes(result.chargeableMinutes)}
                />
            </div>
            {breakdown.length > 0 ? (
                <div className="space-y-2">
                    {breakdown.map((item, index) => (
                        <div
                            key={`${item.label}-${index}`}
                            className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm"
                        >
                            <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-muted-foreground text-xs">
                                    {formatMinutes(item.minutes)}
                                    {typeof item.quantity === 'number'
                                        ? ` x ${item.quantity}`
                                        : ''}
                                </p>
                            </div>
                            <span className="font-semibold">
                                {formatMoney(item.amount, currency)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    );
}

function getDateTimeLocalOffset(offsetMinutes: number) {
    const date = new Date();
    date.setMinutes(date.getMinutes() + offsetMinutes);

    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16);
}
