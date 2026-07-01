'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Banknote,
    CheckCircle2,
    ClipboardCheck,
    Coins,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/features/admin/error-message';
import { cn } from '@/lib/utils';
import {
    closeCurrentShiftApi,
    getCurrentShiftApi,
    getShiftSettlementPreviewApi,
    staffQueryKeys,
    startShiftApi,
    type StaffCashShift,
    type StaffCashTransaction,
} from '@/service/staff';

const formatMoney = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const transactionTypeLabels: Record<string, string> = {
    PARKING_CASH: 'Parking cash',
    SURCHARGE_CASH: 'Surcharge cash',
    PENALTY_CASH: 'Penalty cash',
    LOST_CARD_FINE: 'Lost card fine',
    ADJUSTMENT: 'Adjustment',
};

const sourceLabels: Record<string, string> = {
    NORMAL_EXIT: 'Normal exit',
    LOST_CARD_EXIT: 'Lost card exit',
    PENALTY_COLLECTION: 'Penalty collection',
};

export function StaffCashShiftSettlement() {
    const queryClient = useQueryClient();
    const [countedCashAmount, setCountedCashAmount] = useState('');
    const [note, setNote] = useState('');
    const [closedSummary, setClosedSummary] = useState<StaffCashShift | null>(
        null,
    );

    const currentShiftQuery = useQuery({
        queryKey: staffQueryKeys.currentShift,
        queryFn: getCurrentShiftApi,
    });

    const openShift = currentShiftQuery.data?.shift ?? null;
    const hasOpenShift = Boolean(currentShiftQuery.data?.hasOpenShift && openShift);

    const previewQuery = useQuery({
        queryKey: staffQueryKeys.shiftSettlementPreview,
        queryFn: getShiftSettlementPreviewApi,
        enabled: hasOpenShift,
        refetchInterval: hasOpenShift ? 30000 : false,
    });

    const expectedCashAmount = previewQuery.data?.expectedCashAmount ?? 0;
    const countedCashNumber = Number(countedCashAmount || 0);
    const clientVariance = Number.isFinite(countedCashNumber)
        ? countedCashNumber - expectedCashAmount
        : null;

    const startShiftMutation = useMutation({
        mutationFn: startShiftApi,
        onSuccess: async () => {
            setClosedSummary(null);
            toast.success('Shift started.');
            await queryClient.invalidateQueries({
                queryKey: staffQueryKeys.currentShift,
            });
            await queryClient.invalidateQueries({
                queryKey: staffQueryKeys.shiftSettlementPreview,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to start shift.'));
        },
    });

    const closeShiftMutation = useMutation({
        mutationFn: closeCurrentShiftApi,
        onSuccess: async (summary) => {
            setClosedSummary(summary);
            setCountedCashAmount('');
            setNote('');
            toast.success('Shift closed.');
            await queryClient.invalidateQueries({
                queryKey: staffQueryKeys.currentShift,
            });
            await queryClient.invalidateQueries({
                queryKey: staffQueryKeys.shiftSettlementPreview,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to close shift.'));
        },
    });

    const isBusy =
        currentShiftQuery.isLoading ||
        startShiftMutation.isPending ||
        closeShiftMutation.isPending;

    const canClose =
        hasOpenShift &&
        countedCashAmount.trim() !== '' &&
        Number.isFinite(countedCashNumber) &&
        countedCashNumber >= 0 &&
        !closeShiftMutation.isPending;

    const previewCards = useMemo(
        () => [
            {
                label: 'Cash parking',
                value: previewQuery.data?.cashParkingAmount ?? 0,
            },
            {
                label: 'Surcharge cash',
                value: previewQuery.data?.surchargeCashAmount ?? 0,
            },
            {
                label: 'Penalty cash',
                value: previewQuery.data?.penaltyCashAmount ?? 0,
            },
            {
                label: 'Lost card cash',
                value: previewQuery.data?.lostCardCashAmount ?? 0,
            },
            {
                label: 'Expected cash',
                value: previewQuery.data?.expectedCashAmount ?? 0,
                strong: true,
            },
            {
                label: 'Online PayOS',
                value: previewQuery.data?.onlineAmount ?? 0,
            },
        ],
        [previewQuery.data],
    );

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        STAFF
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Cash Shift / Giao ca
                    </h1>
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        currentShiftQuery.refetch();
                        previewQuery.refetch();
                    }}
                    disabled={isBusy}
                >
                    <RefreshCw data-icon="inline-start" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Current shift</CardTitle>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {hasOpenShift
                                    ? 'OPEN'
                                    : closedSummary
                                      ? 'Last shift closed'
                                      : 'No open shift'}
                            </p>
                        </div>
                        {hasOpenShift ? (
                            <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-emerald-700">
                                OPEN
                            </span>
                        ) : (
                            <Button
                                onClick={() => startShiftMutation.mutate()}
                                disabled={isBusy}
                            >
                                {startShiftMutation.isPending ? (
                                    <Loader2
                                        data-icon="inline-start"
                                        className="animate-spin"
                                    />
                                ) : (
                                    <ClipboardCheck data-icon="inline-start" />
                                )}
                                Start Shift
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <ShiftInfo shift={openShift ?? closedSummary} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Blind close</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="countedCashAmount">
                                Counted cash amount
                            </Label>
                            <Input
                                id="countedCashAmount"
                                inputMode="numeric"
                                type="number"
                                min="0"
                                step="1000"
                                value={countedCashAmount}
                                disabled={!hasOpenShift || closeShiftMutation.isPending}
                                onChange={(event) =>
                                    setCountedCashAmount(event.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shiftNote">Note</Label>
                            <textarea
                                id="shiftNote"
                                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
                                value={note}
                                disabled={!hasOpenShift || closeShiftMutation.isPending}
                                onChange={(event) => setNote(event.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <AmountLine
                                label="Expected"
                                value={expectedCashAmount}
                            />
                            <AmountLine
                                label="Variance"
                                value={clientVariance}
                                highlight
                            />
                        </div>
                        <Button
                            className="w-full"
                            disabled={!canClose}
                            onClick={() =>
                                closeShiftMutation.mutate({
                                    countedCashAmount: countedCashNumber,
                                    note: note.trim() || undefined,
                                })
                            }
                        >
                            {closeShiftMutation.isPending ? (
                                <Loader2
                                    data-icon="inline-start"
                                    className="animate-spin"
                                />
                            ) : (
                                <CheckCircle2 data-icon="inline-start" />
                            )}
                            Close Shift
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Settlement preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {hasOpenShift ? (
                        <>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                                {previewCards.map((card) => (
                                    <div
                                        key={card.label}
                                        className="rounded-md border p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-muted-foreground text-xs font-medium">
                                                {card.label}
                                            </p>
                                            {card.strong ? (
                                                <Banknote className="text-muted-foreground size-4" />
                                            ) : (
                                                <Coins className="text-muted-foreground size-4" />
                                            )}
                                        </div>
                                        <p
                                            className={cn(
                                                'mt-2 text-lg font-semibold',
                                                card.strong && 'text-emerald-700',
                                            )}
                                        >
                                            {formatMoney(card.value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="text-muted-foreground text-sm">
                                Transaction count:{' '}
                                <span className="text-foreground font-medium">
                                    {previewQuery.data?.transactionCount ?? 0}
                                </span>
                            </div>
                            <RecentTransactions
                                transactions={
                                    previewQuery.data?.recentTransactions ?? []
                                }
                                loading={previewQuery.isLoading}
                            />
                        </>
                    ) : (
                        <div className="text-muted-foreground rounded-md border p-4 text-sm">
                            Start a shift to load settlement totals.
                        </div>
                    )}
                </CardContent>
            </Card>

            {closedSummary ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Closed summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-4">
                        <AmountLine
                            label="Expected cash"
                            value={closedSummary.expectedCashAmount}
                        />
                        <AmountLine
                            label="Counted cash"
                            value={closedSummary.countedCashAmount}
                        />
                        <AmountLine
                            label="Variance"
                            value={closedSummary.varianceAmount}
                            highlight
                        />
                        <AmountLine
                            label="Online PayOS"
                            value={closedSummary.onlineAmount}
                        />
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}

function ShiftInfo({ shift }: { shift?: StaffCashShift | null }) {
    if (!shift) {
        return (
            <div className="text-muted-foreground rounded-md border p-4 text-sm">
                No shift is open for this staff account.
            </div>
        );
    }

    return (
        <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <InfoLine label="Parking" value={shift.parkingName ?? shift.parkingId} />
            <InfoLine label="Kiosk" value={shift.kioskName ?? shift.kioskId} />
            <InfoLine label="Opened" value={formatDateTime(shift.openedAt)} />
            <InfoLine label="Closed" value={formatDateTime(shift.closedAt)} />
        </div>
    );
}

function InfoLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs font-medium">{label}</p>
            <p className="mt-1 truncate font-medium">{value}</p>
        </div>
    );
}

function AmountLine({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value?: number | null;
    highlight?: boolean;
}) {
    const numeric = typeof value === 'number' ? value : 0;

    return (
        <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs font-medium">{label}</p>
            <p
                className={cn(
                    'mt-1 text-lg font-semibold',
                    highlight &&
                        (numeric < 0
                            ? 'text-red-700'
                            : numeric > 0
                              ? 'text-amber-700'
                              : 'text-emerald-700'),
                )}
            >
                {formatMoney(value)}
            </p>
        </div>
    );
}

function RecentTransactions({
    transactions,
    loading,
}: {
    transactions: StaffCashTransaction[];
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="text-muted-foreground rounded-md border p-4 text-sm">
                Loading transactions...
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-muted-foreground rounded-md border p-4 text-sm">
                No cash transactions yet.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell>{formatDateTime(transaction.occurredAt)}</TableCell>
                        <TableCell>
                            {transactionTypeLabels[transaction.type] ??
                                transaction.type}
                        </TableCell>
                        <TableCell>
                            {sourceLabels[transaction.source] ??
                                transaction.source}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {formatMoney(transaction.amount)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
