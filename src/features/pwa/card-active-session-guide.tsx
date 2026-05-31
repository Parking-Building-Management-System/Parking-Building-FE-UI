'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    CheckCircle2,
    Copy,
    ExternalLink,
    IdCard,
    Loader2,
    MapPin,
    ParkingCircle,
    RefreshCw,
    XCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/axios-config';
import { cn } from '@/lib/utils';
import {
    createPwaPaymentIntentApi,
    getPwaCardActiveSessionApi,
    getPwaCheckoutQuoteApi,
    getPwaPaymentIntentApi,
    pwaQueryKeys,
    type PwaActiveSessionResponse,
    type PwaCheckoutQuoteResponse,
    type PwaCreatePaymentIntentResponse,
} from '@/service/pwa';

interface CardActiveSessionGuideProps {
    qrToken: string;
}

interface PaymentDisplayData {
    orderCode?: number | string | null;
    status?: string | null;
    amount?: number | null;
    currency?: string | null;
    paidAt?: string | null;
    exitDeadline?: string | null;
    plateNumber?: string | null;
    licensePlate?: string | null;
    cardCode?: string | null;
    checkoutUrl?: string | null;
    qrCode?: string | null;
}

const TERMINAL_PAYMENT_STATUSES = ['PAID', 'FAILED', 'CANCELLED', 'EXPIRED'];

const isHttpUrl = (value?: string | null) =>
    !!value && /^https?:\/\//i.test(value);

const hasCoordinate = (value?: number | null) =>
    typeof value === 'number' && Number.isFinite(value);

const isTerminalPaymentStatus = (status?: string | null) =>
    !!status && TERMINAL_PAYMENT_STATUSES.includes(status);

const isPendingPaymentStatus = (status?: string | null) =>
    !status || status === 'PENDING';

const getOrderCode = (value?: PaymentDisplayData | null) => {
    if (!value) {
        return null;
    }

    return value.orderCode ?? null;
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '';
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

const formatDuration = (value?: number | null) => {
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

const formatCountdown = (milliseconds: number) => {
    if (milliseconds <= 0) {
        return 'Expired';
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
};

const getPwaErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        const normalizedMessage = (error.message || '').toLowerCase();

        if (
            normalizedMessage.includes('card_qr_not_found') ||
            normalizedMessage.includes('card_not_found')
        ) {
            return 'Mã thẻ không hợp lệ.';
        }

        if (normalizedMessage.includes('card_not_active')) {
            return 'Thẻ này đang bị khóa hoặc không hoạt động.';
        }

        if (normalizedMessage.includes('no_active_session_for_card')) {
            return 'Thẻ này hiện không có lượt gửi xe đang hoạt động.';
        }

        return 'Không thể tải thông tin gửi xe.';
    }

    return 'Không thể tải thông tin gửi xe.';
};

const getPaymentErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        const normalizedMessage = (error.message || '').toLowerCase();

        if (
            normalizedMessage.includes('payos_not_configured') ||
            normalizedMessage.includes('payment_provider_disabled')
        ) {
            return 'Online payment is not available right now.';
        }

        if (normalizedMessage.includes('pricing_rule_not_configured')) {
            return 'No pricing rule is configured for this parking session.';
        }

        if (normalizedMessage.includes('no_active_session_for_card')) {
            return 'This card has no active parking session.';
        }

        if (normalizedMessage.includes('card_qr_not_found')) {
            return 'This parking card QR is not valid.';
        }

        if (normalizedMessage.includes('card_not_active')) {
            return 'This parking card is not active.';
        }

        if (normalizedMessage.includes('session_already_paid')) {
            return 'This parking session has already been paid.';
        }

        return error.message || 'Payment could not be started.';
    }

    return 'Network error. Please try again.';
};

export function CardActiveSessionGuide({
    qrToken,
}: CardActiveSessionGuideProps) {
    const activeSessionQuery = useQuery({
        queryKey: pwaQueryKeys.activeSession(qrToken),
        queryFn: () => getPwaCardActiveSessionApi(qrToken),
        enabled: qrToken.length > 0,
        refetchInterval: false,
    });

    return (
        <main className="bg-background text-foreground min-h-svh">
            <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-5 sm:px-6">
                <header className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
                            <ParkingCircle className="size-5" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold">SmartPark</p>
                            <p className="text-muted-foreground text-xs">
                                Hướng dẫn gửi xe
                            </p>
                        </div>
                    </div>
                    <StatusBadge status={activeSessionQuery.data?.status} />
                </header>

                {activeSessionQuery.isLoading ? (
                    <StatePanel
                        icon={<Loader2 className="size-8 animate-spin" />}
                        title="Đang tải thông tin gửi xe"
                        description="Vui lòng chờ trong giây lát."
                    />
                ) : activeSessionQuery.isError ? (
                    <StatePanel
                        icon={<AlertCircle className="size-8" />}
                        title={getPwaErrorMessage(activeSessionQuery.error)}
                        description="Kiểm tra lại mã QR hoặc liên hệ nhân viên bãi xe."
                        action={
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => activeSessionQuery.refetch()}
                            >
                                Tải lại
                            </Button>
                        }
                    />
                ) : activeSessionQuery.data ? (
                    <ActiveSessionContent
                        qrToken={qrToken}
                        session={activeSessionQuery.data}
                    />
                ) : (
                    <StatePanel
                        icon={<AlertCircle className="size-8" />}
                        title="Không thể tải thông tin gửi xe."
                        description="Mã QR chưa có dữ liệu phiên gửi xe."
                    />
                )}
            </div>
        </main>
    );
}

function ActiveSessionContent({
    qrToken,
    session,
}: {
    qrToken: string;
    session: PwaActiveSessionResponse;
}) {
    const plateNumber = session.plateNumber ?? session.licensePlate ?? '-';
    const checkInTime = formatDateTime(
        session.checkInTime ?? session.entryTime ?? session.checkInAt,
    );
    const detailItems = [
        { label: 'Biển số', value: plateNumber },
        { label: 'Mã thẻ', value: session.cardCode },
        { label: 'Bãi xe', value: session.parkingName },
        { label: 'Tầng', value: session.floorName },
        { label: 'Khu vực', value: session.zoneName },
        { label: 'Slot', value: session.slotCode },
    ];

    if (checkInTime) {
        detailItems.push({ label: 'Giờ vào', value: checkInTime });
    }

    return (
        <div className="space-y-4">
            <section className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md border">
                        <IdCard className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-muted-foreground text-xs">
                            Phiên gửi xe đang hoạt động
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-normal break-all">
                            {plateNumber}
                        </h1>
                        {session.guideText && (
                            <p className="text-muted-foreground mt-2 text-sm">
                                {session.guideText}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-2 sm:grid-cols-2">
                {detailItems.map((item) => (
                    <div
                        key={item.label}
                        className="bg-card rounded-lg border px-3 py-3 shadow-sm"
                    >
                        <p className="text-muted-foreground text-xs">
                            {item.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold break-all">
                            {item.value || '-'}
                        </p>
                    </div>
                ))}
            </section>

            <MapSection session={session} />
            <CheckoutQuotePanel qrToken={qrToken} />
        </div>
    );
}

function CheckoutQuotePanel({ qrToken }: { qrToken: string }) {
    const quoteQuery = useQuery({
        queryKey: pwaQueryKeys.checkoutQuote(qrToken),
        queryFn: () => getPwaCheckoutQuoteApi(qrToken),
        enabled: qrToken.length > 0,
        retry: false,
        refetchInterval: false,
    });

    return (
        <section className="bg-card rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Checkout quote</h2>
                    <p className="text-muted-foreground text-xs">
                        Review the amount before online payment.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={quoteQuery.isLoading || quoteQuery.isFetching}
                    onClick={() => quoteQuery.refetch()}
                >
                    {quoteQuery.isFetching ? 'Refreshing...' : 'Refresh quote'}
                </Button>
            </div>

            {quoteQuery.isLoading ? (
                <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                    Loading checkout quote...
                </div>
            ) : quoteQuery.isError ? (
                <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                    {getQuoteErrorMessage(quoteQuery.error)}
                </div>
            ) : quoteQuery.data ? (
                <CheckoutQuoteContent
                    qrToken={qrToken}
                    quote={quoteQuery.data}
                    onQuoteRefresh={() => quoteQuery.refetch()}
                />
            ) : (
                <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                    Checkout quote is not available yet.
                </div>
            )}
        </section>
    );
}

function CheckoutQuoteContent({
    onQuoteRefresh,
    qrToken,
    quote,
}: {
    onQuoteRefresh: () => void;
    qrToken: string;
    quote: PwaCheckoutQuoteResponse;
}) {
    const [createdIntent, setCreatedIntent] =
        useState<PwaCreatePaymentIntentResponse | null>(null);
    const currency = quote.currency || 'VND';
    const state = quote.state || 'ACTIVE_UNPAID';
    const breakdown = quote.breakdown ?? quote.pricingBreakdown ?? [];
    const nextAction = quote.nextAction;
    const existingIntent = quote.existingPaymentIntent ?? null;

    const createPaymentIntentMutation = useMutation({
        mutationFn: () => createPwaPaymentIntentApi(qrToken),
        onSuccess: (paymentIntent) => {
            setCreatedIntent(paymentIntent);
            if (paymentIntent.status === 'PAID') {
                onQuoteRefresh();
            }
        },
        onError: (error) => {
            toast.error(getPaymentErrorMessage(error));
        },
    });

    if (state === 'NO_PRICING_RULE') {
        return (
            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                No pricing rule is configured for this parking session. Please
                contact parking staff.
            </div>
        );
    }

    if (state === 'NO_ACTIVE_SESSION') {
        return (
            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                This card has no active parking session.
            </div>
        );
    }

    if (
        quote.paymentStatus === 'PAID' ||
        nextAction === 'EXIT_WITHIN_GRACE_PERIOD' ||
        createdIntent?.status === 'PAID'
    ) {
        return (
            <PaidSuccessPanel
                payment={createdIntent ?? quote}
                fallbackQuote={quote}
            />
        );
    }

    if (
        createdIntent ||
        (nextAction === 'CONTINUE_PAYMENT' && existingIntent)
    ) {
        return (
            <PaymentPendingPanel
                fallbackQuote={quote}
                initialPayment={createdIntent ?? existingIntent ?? {}}
                isCreating={createPaymentIntentMutation.isPending}
                onCreateNew={() => createPaymentIntentMutation.mutate()}
            />
        );
    }

    return (
        <div className="space-y-4">
            <QuoteSummary quote={quote} />

            {breakdown.length > 0 && (
                <PricingBreakdown breakdown={breakdown} currency={currency} />
            )}

            <div className="space-y-2">
                {quote.paymentAvailable &&
                nextAction === 'CREATE_PAYMENT_INTENT' ? (
                    <Button
                        type="button"
                        className="h-10 w-full"
                        disabled={createPaymentIntentMutation.isPending}
                        onClick={() => createPaymentIntentMutation.mutate()}
                    >
                        {createPaymentIntentMutation.isPending ? (
                            <Loader2
                                className="animate-spin"
                                data-icon="inline-start"
                            />
                        ) : null}
                        {createPaymentIntentMutation.isPending
                            ? 'Starting payment...'
                            : 'Pay & Exit'}
                    </Button>
                ) : (
                    <Button type="button" className="w-full" disabled>
                        Pay & Exit
                    </Button>
                )}

                <PaymentActionMessage
                    nextAction={nextAction}
                    quote={quote}
                    error={createPaymentIntentMutation.error}
                />
            </div>
        </div>
    );
}

function QuoteSummary({ quote }: { quote: PwaCheckoutQuoteResponse }) {
    const currency = quote.currency || 'VND';

    return (
        <div className="grid gap-2 sm:grid-cols-2">
            <QuoteMetric
                label="Check-in time"
                value={formatDateTime(quote.checkInAt)}
            />
            <QuoteMetric
                label="Duration"
                value={formatDuration(quote.durationMinutes)}
            />
            <QuoteMetric
                label="Current amount"
                value={formatMoney(quote.amount, currency)}
            />
            <QuoteMetric
                label="Pricing rule"
                value={quote.pricingRuleName || '-'}
            />
        </div>
    );
}

function PricingBreakdown({
    breakdown,
    currency,
}: {
    breakdown: PwaCheckoutQuoteResponse['pricingBreakdown'];
    currency: string;
}) {
    return (
        <div className="space-y-2">
            {(breakdown ?? []).map((item, index) => (
                <div
                    key={`${item.label}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm"
                >
                    <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-muted-foreground text-xs">
                            {formatDuration(item.minutes)}
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
    );
}

function PaymentActionMessage({
    error,
    nextAction,
    quote,
}: {
    error: unknown;
    nextAction?: string | null;
    quote: PwaCheckoutQuoteResponse;
}) {
    if (error) {
        return (
            <p className="text-destructive text-center text-xs">
                {getPaymentErrorMessage(error)}
            </p>
        );
    }

    if (nextAction === 'PAYMENT_PROVIDER_DISABLED') {
        return (
            <p className="text-muted-foreground text-center text-xs">
                Online payment is not available right now.
            </p>
        );
    }

    if (!quote.paymentAvailable) {
        return (
            <p className="text-muted-foreground text-center text-xs">
                Online payment is not available right now.
            </p>
        );
    }

    return (
        <p className="text-muted-foreground text-center text-xs">
            {quote.quotedAt
                ? `Quote refreshed at ${formatDateTime(quote.quotedAt)}.`
                : 'Create a PayOS payment link for this checkout quote.'}
        </p>
    );
}

function PaymentPendingPanel({
    fallbackQuote,
    initialPayment,
    isCreating,
    onCreateNew,
}: {
    fallbackQuote: PwaCheckoutQuoteResponse;
    initialPayment: PaymentDisplayData;
    isCreating: boolean;
    onCreateNew: () => void;
}) {
    const orderCode = getOrderCode(initialPayment);
    const statusQuery = useQuery({
        queryKey: orderCode
            ? pwaQueryKeys.paymentIntent(orderCode)
            : ['pwa-payment-intent', 'missing-order-code'],
        queryFn: () => getPwaPaymentIntentApi(orderCode ?? ''),
        enabled: !!orderCode,
        retry: false,
        refetchInterval:
            orderCode && isPendingPaymentStatus(initialPayment.status)
                ? (query) =>
                      isPendingPaymentStatus(query.state.data?.status)
                          ? 4000
                          : false
                : false,
    });

    const payment = statusQuery.data ?? initialPayment;
    const status = payment.status ?? 'PENDING';

    if (status === 'PAID') {
        return (
            <PaidSuccessPanel payment={payment} fallbackQuote={fallbackQuote} />
        );
    }

    if (isTerminalPaymentStatus(status)) {
        return (
            <PaymentTerminalPanel
                fallbackQuote={fallbackQuote}
                isCreating={isCreating}
                payment={payment}
                onCreateNew={onCreateNew}
            />
        );
    }

    const checkoutUrl =
        payment.checkoutUrl ?? fallbackQuote.existingPaymentIntent?.checkoutUrl;
    const qrCode = payment.qrCode;

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold">Payment pending</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Complete payment in your banking app or PayOS
                            checkout.
                        </p>
                    </div>
                    <PaymentStatusBadge status={status} />
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <QuoteMetric
                    label="Amount"
                    value={formatMoney(
                        payment.amount ?? fallbackQuote.amount,
                        payment.currency ?? fallbackQuote.currency ?? 'VND',
                    )}
                />
                <QuoteMetric
                    label="Order code"
                    value={String(orderCode ?? '-')}
                />
                <QuoteMetric
                    label="Plate"
                    value={
                        payment.plateNumber ??
                        fallbackQuote.plateNumber ??
                        fallbackQuote.licensePlate ??
                        '-'
                    }
                />
                <QuoteMetric
                    label="Card"
                    value={payment.cardCode ?? fallbackQuote.cardCode ?? '-'}
                />
            </div>

            {qrCode ? (
                <div className="flex justify-center">
                    <div className="rounded-md border bg-white p-3 shadow-sm">
                        <QRCodeSVG
                            value={qrCode}
                            size={188}
                            level="M"
                            marginSize={2}
                        />
                    </div>
                </div>
            ) : null}

            {checkoutUrl ? (
                <div className="bg-background rounded-md border px-3 py-2 text-xs break-all">
                    {checkoutUrl}
                </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-3">
                <Button
                    type="button"
                    disabled={!checkoutUrl}
                    onClick={() => openPaymentLink(checkoutUrl)}
                >
                    <ExternalLink data-icon="inline-start" />
                    Open PayOS
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={!checkoutUrl}
                    onClick={() => copyPaymentLink(checkoutUrl)}
                >
                    <Copy data-icon="inline-start" />
                    Copy Link
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={!orderCode || statusQuery.isFetching}
                    onClick={() => statusQuery.refetch()}
                >
                    {statusQuery.isFetching ? (
                        <Loader2
                            className="animate-spin"
                            data-icon="inline-start"
                        />
                    ) : (
                        <RefreshCw data-icon="inline-start" />
                    )}
                    Refresh
                </Button>
            </div>

            {statusQuery.isError ? (
                <p className="text-destructive text-center text-xs">
                    {getPaymentErrorMessage(statusQuery.error)}
                </p>
            ) : (
                <p className="text-muted-foreground text-center text-xs">
                    Payment status refreshes every few seconds while pending.
                </p>
            )}
        </div>
    );
}

function PaymentTerminalPanel({
    fallbackQuote,
    isCreating,
    onCreateNew,
    payment,
}: {
    fallbackQuote: PwaCheckoutQuoteResponse;
    isCreating: boolean;
    onCreateNew: () => void;
    payment: PaymentDisplayData;
}) {
    const status = payment.status ?? 'FAILED';
    const statusText =
        status === 'EXPIRED'
            ? 'Payment intent expired'
            : status === 'CANCELLED'
              ? 'Payment cancelled'
              : 'Payment failed';

    return (
        <div className="space-y-4">
            <div className="border-destructive/30 bg-destructive/10 rounded-md border p-4">
                <div className="flex items-start gap-3">
                    <XCircle className="text-destructive mt-0.5 size-5 shrink-0" />
                    <div>
                        <p className="font-semibold">{statusText}</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            The payment was not completed. You can try creating
                            a new PayOS payment link, or ask parking staff for
                            help.
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                <QuoteMetric
                    label="Amount"
                    value={formatMoney(
                        payment.amount ?? fallbackQuote.amount,
                        payment.currency ?? fallbackQuote.currency ?? 'VND',
                    )}
                />
                <QuoteMetric
                    label="Order code"
                    value={String(getOrderCode(payment) ?? '-')}
                />
            </div>
            <Button
                type="button"
                className="w-full"
                disabled={isCreating}
                onClick={onCreateNew}
            >
                {isCreating ? (
                    <Loader2
                        className="animate-spin"
                        data-icon="inline-start"
                    />
                ) : null}
                {isCreating ? 'Creating new payment...' : 'Create new payment'}
            </Button>
        </div>
    );
}

function PaidSuccessPanel({
    fallbackQuote,
    payment,
}: {
    fallbackQuote: PwaCheckoutQuoteResponse;
    payment: PaymentDisplayData;
}) {
    const [now, setNow] = useState(0);
    const amount = payment.amount ?? fallbackQuote.amount;
    const currency = payment.currency ?? fallbackQuote.currency ?? 'VND';
    const paidAt = payment.paidAt ?? fallbackQuote.paidAt;
    const exitDeadline = payment.exitDeadline ?? fallbackQuote.exitDeadline;
    const deadlineTimestamp = exitDeadline
        ? new Date(exitDeadline).getTime()
        : Number.NaN;
    const graceExpired =
        now > 0 &&
        Number.isFinite(deadlineTimestamp) &&
        deadlineTimestamp <= now;

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    'rounded-md border p-4',
                    graceExpired
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-emerald-500/30 bg-emerald-500/10',
                )}
            >
                <div className="flex items-start gap-3">
                    <CheckCircle2
                        className={cn(
                            'mt-0.5 size-5 shrink-0',
                            graceExpired
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-emerald-700 dark:text-emerald-300',
                        )}
                    />
                    <div>
                        <p className="font-semibold">Payment successful</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {graceExpired
                                ? 'Grace period expired. Please go to the exit cashier for surcharge handling.'
                                : 'Please exit within the grace period. Hand the card to the staff at the exit gate.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <QuoteMetric
                    label="Amount"
                    value={formatMoney(amount, currency)}
                />
                <QuoteMetric label="Paid at" value={formatDateTime(paidAt)} />
                <QuoteMetric
                    label="Exit deadline"
                    value={formatDateTime(exitDeadline)}
                />
                <QuoteMetric
                    label="Countdown"
                    value={<DeadlineCountdown exitDeadline={exitDeadline} />}
                />
                <QuoteMetric
                    label="Plate"
                    value={
                        payment.plateNumber ??
                        fallbackQuote.plateNumber ??
                        fallbackQuote.licensePlate ??
                        '-'
                    }
                />
                <QuoteMetric
                    label="Card"
                    value={payment.cardCode ?? fallbackQuote.cardCode ?? '-'}
                />
            </div>
        </div>
    );
}

function DeadlineCountdown({ exitDeadline }: { exitDeadline?: string | null }) {
    const [now, setNow] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    if (!exitDeadline) {
        return <>-</>;
    }

    const timestamp = new Date(exitDeadline).getTime();

    if (!Number.isFinite(timestamp)) {
        return <>{exitDeadline}</>;
    }

    return <>{now > 0 ? formatCountdown(timestamp - now) : '-'}</>;
}

function QuoteMetric({ label, value }: { label: string; value?: ReactNode }) {
    return (
        <div className="rounded-md border px-3 py-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 text-sm font-semibold break-all">
                {value || '-'}
            </p>
        </div>
    );
}

function PaymentStatusBadge({ status }: { status?: string | null }) {
    return (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {status || 'PENDING'}
        </span>
    );
}

async function copyPaymentLink(checkoutUrl?: string | null) {
    if (!checkoutUrl) {
        toast.error('Payment link is not available.');
        return;
    }

    try {
        await navigator.clipboard.writeText(checkoutUrl);
        toast.success('Payment link copied.');
    } catch {
        toast.error('Could not copy payment link.');
    }
}

function openPaymentLink(checkoutUrl?: string | null) {
    if (!checkoutUrl) {
        toast.error('Payment link is not available.');
        return;
    }

    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
}

function getQuoteErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        const normalizedMessage = (error.message || '').toLowerCase();

        if (
            normalizedMessage.includes('no_pricing_rule') ||
            normalizedMessage.includes('pricing_rule')
        ) {
            return 'No pricing rule is configured for this parking session.';
        }

        if (normalizedMessage.includes('no_active_session')) {
            return 'This card has no active parking session.';
        }

        if (normalizedMessage.includes('card_qr_not_found')) {
            return 'This parking card QR is not valid.';
        }

        if (normalizedMessage.includes('card_not_active')) {
            return 'This parking card is not active.';
        }

        return 'Checkout quote API could not be loaded.';
    }

    return 'Checkout quote API could not be loaded.';
}

function MapSection({ session }: { session: PwaActiveSessionResponse }) {
    const mapState = useMemo(() => getMapState(session), [session]);
    const canShowPin =
        mapState.src &&
        hasCoordinate(session.xCoordinate) &&
        hasCoordinate(session.yCoordinate);

    return (
        <section className="bg-card rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Bản đồ vị trí</h2>
                    <p className="text-muted-foreground text-xs">
                        Tọa độ slot dùng phần trăm theo sơ đồ tầng.
                    </p>
                </div>
                <MapPin className="text-primary size-5" />
            </div>

            {mapState.src ? (
                <div className="bg-muted/30 overflow-auto rounded-md border p-2">
                    <div className="bg-background relative inline-block overflow-hidden rounded-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={mapState.src}
                            alt="Floor map"
                            className="block max-h-[70svh] max-w-full object-contain"
                        />
                        {canShowPin ? (
                            <SlotPin
                                slotCode={session.slotCode}
                                xCoordinate={session.xCoordinate ?? 0}
                                yCoordinate={session.yCoordinate ?? 0}
                            />
                        ) : null}
                    </div>
                    {!canShowPin && (
                        <p className="text-muted-foreground mt-3 text-sm">
                            Slot đã được gán nhưng chưa có tọa độ trên bản đồ.
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-muted-foreground bg-background rounded-md border border-dashed p-6 text-center text-sm">
                    {mapState.message}
                </div>
            )}
        </section>
    );
}

function SlotPin({
    slotCode,
    xCoordinate,
    yCoordinate,
}: {
    slotCode?: string | null;
    xCoordinate: number;
    yCoordinate: number;
}) {
    const x = Math.min(100, Math.max(0, xCoordinate));
    const y = Math.min(100, Math.max(0, yCoordinate));

    return (
        <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: `${x}%`, top: `${y}%` }}
        >
            <div className="bg-primary text-primary-foreground border-background flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold shadow-sm">
                <MapPin className="size-3" />
                <span>{slotCode || 'Slot'}</span>
            </div>
        </div>
    );
}

function getMapState(session: PwaActiveSessionResponse) {
    if (session.mapDisplayUrl) {
        return { src: session.mapDisplayUrl, message: '' };
    }

    if (isHttpUrl(session.mapImageUrl)) {
        return { src: session.mapImageUrl ?? '', message: '' };
    }

    if (session.mapImageUrl) {
        return {
            src: '',
            message: 'Bản đồ chưa có URL hiển thị công khai.',
        };
    }

    return { src: '', message: 'Map chưa được cấu hình.' };
}

function StatusBadge({ status }: { status?: string | null }) {
    const displayStatus = status || 'ACTIVE';

    return (
        <span
            className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold',
                displayStatus === 'ACTIVE'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-border bg-muted text-muted-foreground',
            )}
        >
            {displayStatus}
        </span>
    );
}

function StatePanel({
    action,
    description,
    icon,
    title,
}: {
    action?: ReactNode;
    description: string;
    icon: ReactNode;
    title: string;
}) {
    return (
        <div className="bg-card flex min-h-80 flex-col items-center justify-center rounded-lg border p-6 text-center shadow-sm">
            <div className="bg-muted mb-4 rounded-full p-4">{icon}</div>
            <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
