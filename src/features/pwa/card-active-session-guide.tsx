'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    IdCard,
    Loader2,
    MapPin,
    ParkingCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/axios-config';
import { cn } from '@/lib/utils';
import {
    getPwaCardActiveSessionApi,
    getPwaCheckoutQuoteApi,
    pwaQueryKeys,
    type PwaActiveSessionResponse,
    type PwaCheckoutQuoteResponse,
} from '@/service/pwa';

interface CardActiveSessionGuideProps {
    qrToken: string;
}

const isHttpUrl = (value?: string | null) =>
    !!value && /^https?:\/\//i.test(value);

const hasCoordinate = (value?: number | null) =>
    typeof value === 'number' && Number.isFinite(value);

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
        <main className="min-h-svh bg-background text-foreground">
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
            <section className="rounded-lg border bg-card p-4 shadow-sm">
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
                        className="rounded-lg border bg-card px-3 py-3 shadow-sm"
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
        <section className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Checkout quote</h2>
                    <p className="text-muted-foreground text-xs">
                        Online payment is coming next.
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
                <CheckoutQuoteContent quote={quoteQuery.data} />
            ) : (
                <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                    Checkout quote is not available yet.
                </div>
            )}
        </section>
    );
}

function CheckoutQuoteContent({ quote }: { quote: PwaCheckoutQuoteResponse }) {
    const currency = quote.currency || 'VND';
    const state = quote.state || 'ACTIVE_UNPAID';
    const breakdown = quote.breakdown ?? quote.pricingBreakdown ?? [];

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

    return (
        <div className="space-y-4">
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

            {breakdown.length > 0 && (
                <div className="space-y-2">
                    {breakdown.map((item, index) => (
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
            )}

            <div className="space-y-2">
                <Button type="button" className="w-full" disabled>
                    Pay & Exit
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                    Online payment is coming next.
                    {quote.quotedAt
                        ? ` Quote refreshed at ${formatDateTime(quote.quotedAt)}.`
                        : ''}
                </p>
            </div>
        </div>
    );
}

function QuoteMetric({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded-md border px-3 py-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 text-sm font-semibold break-all">
                {value || '-'}
            </p>
        </div>
    );
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
        <section className="rounded-lg border bg-card p-4 shadow-sm">
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
                <div className="overflow-auto rounded-md border bg-muted/30 p-2">
                    <div className="relative inline-block overflow-hidden rounded-md bg-background">
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
                <div className="text-muted-foreground rounded-md border border-dashed bg-background p-6 text-center text-sm">
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
            <div className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full border border-background px-2 py-1 text-xs font-semibold shadow-sm">
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
        <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border bg-card p-6 text-center shadow-sm">
            <div className="bg-muted mb-4 rounded-full p-4">{icon}</div>
            <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
