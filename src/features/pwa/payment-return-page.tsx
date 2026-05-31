'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    ParkingCircle,
    RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/axios-config';
import { cn } from '@/lib/utils';
import { getPwaPaymentIntentApi, pwaQueryKeys } from '@/service/pwa';

type PaymentReturnKind = 'success' | 'cancel';

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString('vi-VN');
};

const formatMoney = (value?: number | null, currency = 'VND') => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'VND' ? 0 : 2,
    }).format(value);
};

export function PaymentReturnPage({ kind }: { kind: PaymentReturnKind }) {
    return (
        <Suspense fallback={<PaymentReturnShell />}>
            <PaymentReturnContent kind={kind} />
        </Suspense>
    );
}

function PaymentReturnContent({ kind }: { kind: PaymentReturnKind }) {
    const searchParams = useSearchParams();
    const orderCode = useMemo(
        () =>
            searchParams.get('orderCode') ||
            searchParams.get('code') ||
            searchParams.get('id') ||
            '',
        [searchParams],
    );

    const paymentQuery = useQuery({
        queryKey: orderCode
            ? pwaQueryKeys.paymentIntent(orderCode)
            : ['pwa-payment-intent', 'missing-order-code'],
        queryFn: () => getPwaPaymentIntentApi(orderCode),
        enabled: orderCode.length > 0,
        retry: false,
        refetchInterval: false,
    });

    const isSuccess = kind === 'success';

    return (
        <main className="bg-background text-foreground min-h-svh">
            <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-4 py-5 sm:px-6">
                <header className="mb-5 flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
                        <ParkingCircle className="size-5" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold">SmartPark</p>
                        <p className="text-muted-foreground text-xs">
                            Payment return
                        </p>
                    </div>
                </header>

                <section className="bg-card rounded-lg border p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-md border',
                                isSuccess
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                            )}
                        >
                            {isSuccess ? (
                                <CheckCircle2 className="size-5" />
                            ) : (
                                <AlertCircle className="size-5" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold tracking-normal">
                                {isSuccess
                                    ? 'Returned from PayOS'
                                    : 'Payment was cancelled'}
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Return to your parking card page to refresh
                                payment status.
                            </p>
                        </div>
                    </div>

                    {orderCode ? (
                        <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                                <span className="text-muted-foreground">
                                    Order code
                                </span>
                                <span className="font-semibold break-all">
                                    {orderCode}
                                </span>
                            </div>

                            {paymentQuery.isLoading ? (
                                <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed p-3 text-sm">
                                    <Loader2 className="size-4 animate-spin" />
                                    Checking payment status...
                                </div>
                            ) : paymentQuery.isError ? (
                                <div className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                                    {getStatusErrorMessage(paymentQuery.error)}
                                </div>
                            ) : paymentQuery.data ? (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <ReturnMetric
                                        label="Status"
                                        value={paymentQuery.data.status}
                                    />
                                    <ReturnMetric
                                        label="Amount"
                                        value={formatMoney(
                                            paymentQuery.data.amount,
                                            paymentQuery.data.currency ?? 'VND',
                                        )}
                                    />
                                    <ReturnMetric
                                        label="Paid at"
                                        value={formatDateTime(
                                            paymentQuery.data.paidAt,
                                        )}
                                    />
                                    <ReturnMetric
                                        label="Exit deadline"
                                        value={formatDateTime(
                                            paymentQuery.data.exitDeadline,
                                        )}
                                    />
                                </div>
                            ) : null}

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={!orderCode || paymentQuery.isFetching}
                                onClick={() => paymentQuery.refetch()}
                            >
                                {paymentQuery.isFetching ? (
                                    <Loader2
                                        className="animate-spin"
                                        data-icon="inline-start"
                                    />
                                ) : (
                                    <RefreshCw data-icon="inline-start" />
                                )}
                                Refresh status
                            </Button>
                        </div>
                    ) : (
                        <div className="text-muted-foreground mt-5 rounded-md border border-dashed p-4 text-sm">
                            No order code was provided by PayOS. Return to your
                            parking card page to refresh payment status.
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function PaymentReturnShell() {
    return (
        <main className="bg-background text-foreground min-h-svh">
            <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-4 py-5 sm:px-6">
                <header className="mb-5 flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
                        <ParkingCircle className="size-5" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold">SmartPark</p>
                        <p className="text-muted-foreground text-xs">
                            Payment return
                        </p>
                    </div>
                </header>
                <section className="text-muted-foreground bg-card rounded-lg border p-5 text-sm shadow-sm">
                    Loading payment return details...
                </section>
            </div>
        </main>
    );
}

function ReturnMetric({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) {
    return (
        <div className="rounded-md border px-3 py-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 text-sm font-semibold break-all">
                {value || '-'}
            </p>
        </div>
    );
}

function getStatusErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        return error.message || 'Payment status could not be loaded.';
    }

    return 'Payment status could not be loaded.';
}
