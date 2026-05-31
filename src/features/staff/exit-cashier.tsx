'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    AlertCircle,
    Banknote,
    CheckCircle2,
    CreditCard,
    DoorOpen,
    IdCard,
    Loader2,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/axios-config';
import { cn } from '@/lib/utils';
import {
    completeParkingSessionExitApi,
    previewParkingSessionExitApi,
    staffQueryKeys,
    type StaffCompleteExitResponse,
    type StaffExitPaymentMode,
    type StaffExitPreviewResponse,
} from '@/service/staff';
import { useAuthStore } from '@/stores/use-auth-store';

const terminalErrorCodes = [
    'NO_ACTIVE_SESSION_FOR_CARD',
    'SESSION_ALREADY_COMPLETED',
    'KIOSK_CONTEXT_REQUIRED',
    'STAFF_NOT_ASSIGNED_TO_KIOSK',
    'EXIT_KIOSK_REQUIRED',
    'SESSION_NOT_IN_KIOSK_PARKING',
    'PAYMENT_REQUIRED',
    'GRACE_PERIOD_EXPIRED',
];

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString('en-US');
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

const getPlate = (
    value?: StaffExitPreviewResponse | StaffCompleteExitResponse | null,
) => value?.plateNumber ?? '-';

const getExitDecision = (preview: StaffExitPreviewResponse) =>
    preview.exitDecision ?? preview.decision ?? 'BLOCKED';

const getPreviewAmount = (preview: StaffExitPreviewResponse) =>
    preview.totalAmount ?? preview.amountDue ?? null;

const getCollectedDefault = (preview: StaffExitPreviewResponse) => {
    const decision = getExitDecision(preview);

    if (decision === 'GRACE_EXPIRED_SURCHARGE') {
        return preview.surchargeAmount ?? preview.amountDue ?? 0;
    }

    if (decision === 'COLLECT_CASH') {
        return preview.amountDue ?? preview.totalAmount ?? 0;
    }

    return 0;
};

const getPaymentMode = (decision: string): StaffExitPaymentMode | null => {
    if (decision === 'ALLOW_EXIT') {
        return 'ONLINE';
    }

    if (decision === 'COLLECT_CASH') {
        return 'CASH';
    }

    if (decision === 'GRACE_EXPIRED_SURCHARGE') {
        return 'SURCHARGE_CASH';
    }

    return null;
};

const getPrimaryActionLabel = (decision: string) => {
    if (decision === 'ALLOW_EXIT') {
        return 'Complete Exit';
    }

    if (decision === 'COLLECT_CASH') {
        return 'Collect Cash & Complete Exit';
    }

    if (decision === 'GRACE_EXPIRED_SURCHARGE') {
        return 'Collect Surcharge & Complete Exit';
    }

    return 'Complete Exit';
};

const getStaffExitErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        const message = error.message || '';
        const normalized = message.toLowerCase();

        if (normalized.includes('no_active_session_for_card')) {
            return 'No active parking session was found for this card.';
        }

        if (normalized.includes('session_already_completed')) {
            return 'This parking session has already been completed.';
        }

        if (normalized.includes('kiosk_context_required')) {
            return 'This action requires an approved kiosk context. Sign in again from the exit kiosk.';
        }

        if (normalized.includes('staff_not_assigned_to_kiosk')) {
            return 'Your staff account is not assigned to this kiosk.';
        }

        if (normalized.includes('exit_kiosk_required')) {
            return 'This device must be assigned to an exit kiosk.';
        }

        if (normalized.includes('session_not_in_kiosk_parking')) {
            return 'This session belongs to a different parking location.';
        }

        if (normalized.includes('payment_required')) {
            return 'Payment is required before this session can exit.';
        }

        if (normalized.includes('grace_period_expired')) {
            return 'The online payment grace period has expired. Collect the surcharge before exit.';
        }

        if (normalized.includes('rfid_card_not_found')) {
            return 'The RFID card was not found.';
        }

        if (normalized.includes('card_code_does_not_match_session')) {
            return 'The card code does not match this parking session.';
        }

        if (
            normalized.includes('online_exit_not_allowed') ||
            normalized.includes('cash_exit_not_allowed') ||
            normalized.includes('surcharge_exit_not_allowed')
        ) {
            return 'The selected payment mode no longer matches the latest exit decision. Preview the card again.';
        }

        if (
            normalized.includes('cash_amount_too_low') ||
            normalized.includes('surcharge_amount_too_low')
        ) {
            return 'The collected amount is lower than the required amount.';
        }

        if (normalized.includes('card_qr_not_found')) {
            return 'The card code is invalid.';
        }

        if (error.status === 401) {
            return 'Your login session has expired. Please sign in again.';
        }

        if (error.status === 403) {
            return 'You do not have permission to operate this exit kiosk.';
        }

        return message || 'The exit request could not be completed.';
    }

    if (error instanceof Error) {
        return error.message || 'The exit request could not be completed.';
    }

    return 'The exit request could not be completed.';
};

export function StaffExitCashier() {
    const workContext = useAuthStore((state) => state.user?.workContext);
    const cardInputRef = useRef<HTMLInputElement | null>(null);
    const scanNextButtonRef = useRef<HTMLButtonElement | null>(null);
    const [cardCode, setCardCode] = useState('');
    const [preview, setPreview] = useState<StaffExitPreviewResponse | null>(
        null,
    );
    const [completion, setCompletion] =
        useState<StaffCompleteExitResponse | null>(null);
    const [collectedAmount, setCollectedAmount] = useState('0');
    const [note, setNote] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);

    const previewMutation = useMutation({
        mutationKey: staffQueryKeys.exitPreview,
        mutationFn: previewParkingSessionExitApi,
        onSuccess: (result) => {
            setPreview(result);
            setCompletion(null);
            setCollectedAmount(String(getCollectedDefault(result)));
            setNote('');
        },
        onError: (error) => {
            setPreview(null);
            setCompletion(null);
            toast.error(getStaffExitErrorMessage(error));
        },
    });

    const completeExitMutation = useMutation({
        mutationKey: staffQueryKeys.completeExit,
        mutationFn: completeParkingSessionExitApi,
        onSuccess: (result) => {
            setCompletion(result);
            setConfirmOpen(false);
            toast.success('Gate can open now.');
        },
        onError: (error) => {
            setConfirmOpen(false);
            toast.error(getStaffExitErrorMessage(error));
        },
    });

    useEffect(() => {
        cardInputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (completion) {
            scanNextButtonRef.current?.focus();
        }
    }, [completion]);

    const canComplete = useMemo(
        () =>
            !!preview?.sessionId &&
            !!getPaymentMode(getExitDecision(preview)) &&
            !completeExitMutation.isPending,
        [completeExitMutation.isPending, preview],
    );

    const onPreview = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedCardCode = cardCode.trim().toUpperCase();

        if (!normalizedCardCode) {
            toast.error('Card code is required.');
            cardInputRef.current?.focus();
            return;
        }

        setCardCode(normalizedCardCode);
        previewMutation.mutate({ cardCode: normalizedCardCode });
    };

    const onConfirmComplete = () => {
        if (!preview?.sessionId) {
            toast.error('Session ID is missing from the preview response.');
            return;
        }

        const paymentMode = getPaymentMode(getExitDecision(preview));

        if (!paymentMode) {
            toast.error('This session is blocked and cannot be completed.');
            return;
        }

        const amount = Number(collectedAmount);

        if (!Number.isFinite(amount) || amount < 0) {
            toast.error('Collected amount must be zero or greater.');
            return;
        }

        completeExitMutation.mutate({
            sessionId: preview.sessionId,
            cardCode: (preview.cardCode ?? cardCode).trim().toUpperCase(),
            paymentMode,
            collectedAmount: amount,
            note: note.trim() || undefined,
        });
    };

    const onScanNext = () => {
        setCardCode('');
        setPreview(null);
        setCompletion(null);
        setCollectedAmount('0');
        setNote('');
        window.setTimeout(() => cardInputRef.current?.focus(), 0);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm font-medium">
                    STAFF
                </p>
                <h1 className="text-3xl font-semibold tracking-normal">
                    Exit Cashier
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                    Preview the active card session, collect any required cash,
                    and complete exit at the gate.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Exit kiosk context</CardTitle>
                            <CardDescription>
                                The backend validates this staff session against
                                the assigned kiosk.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {workContext ? (
                                <div className="grid gap-3 text-sm md:grid-cols-3">
                                    <ContextItem
                                        label="Kiosk"
                                        value={workContext.kioskName}
                                    />
                                    <ContextItem
                                        label="Type"
                                        value={workContext.kioskType}
                                    />
                                    <ContextItem
                                        label="Parking"
                                        value={workContext.parkingName}
                                    />
                                </div>
                            ) : (
                                <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
                                    No kiosk context was returned by your
                                    session. Exit preview may be blocked by the
                                    backend.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Card scan</CardTitle>
                            <CardDescription>
                                Scan or enter the RFID card code, then preview
                                the active session.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="flex flex-col gap-3 sm:flex-row"
                                onSubmit={onPreview}
                            >
                                <Input
                                    ref={cardInputRef}
                                    value={cardCode}
                                    className="h-12 text-lg font-semibold tracking-wide"
                                    placeholder="BCONS-0004"
                                    autoComplete="off"
                                    disabled={
                                        previewMutation.isPending ||
                                        completeExitMutation.isPending
                                    }
                                    onChange={(event) =>
                                        setCardCode(event.target.value)
                                    }
                                />
                                <Button
                                    type="submit"
                                    className="h-12 sm:w-40"
                                    disabled={
                                        previewMutation.isPending ||
                                        completeExitMutation.isPending
                                    }
                                >
                                    {previewMutation.isPending ? (
                                        <Loader2
                                            className="animate-spin"
                                            data-icon="inline-start"
                                        />
                                    ) : (
                                        <IdCard data-icon="inline-start" />
                                    )}
                                    Preview
                                </Button>
                            </form>
                            {previewMutation.isError ? (
                                <div className="text-destructive border-destructive/30 bg-destructive/10 mt-3 rounded-md border p-3 text-sm">
                                    {getStaffExitErrorMessage(
                                        previewMutation.error,
                                    )}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {completion ? (
                        <CompletionSuccess
                            completion={completion}
                            onScanNext={onScanNext}
                            scanNextButtonRef={scanNextButtonRef}
                        />
                    ) : preview ? (
                        <PreviewDecision
                            canComplete={canComplete}
                            collectedAmount={collectedAmount}
                            completePending={completeExitMutation.isPending}
                            note={note}
                            preview={preview}
                            setCollectedAmount={setCollectedAmount}
                            setConfirmOpen={setConfirmOpen}
                            setNote={setNote}
                        />
                    ) : (
                        <Card>
                            <CardContent className="text-muted-foreground flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center text-sm">
                                <DoorOpen className="size-10" />
                                <p>
                                    No card preview yet. Scan a card to show the
                                    exit decision.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Decision guide</CardTitle>
                        <CardDescription>
                            Follow the backend decision returned by exit
                            preview.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <GuideItem
                            icon={<CreditCard className="size-4" />}
                            title="Paid online"
                            description="Complete exit with ONLINE and collect no cash."
                        />
                        <GuideItem
                            icon={<Banknote className="size-4" />}
                            title="Unpaid"
                            description="Collect the quoted cash amount before completing exit."
                        />
                        <GuideItem
                            icon={<ShieldAlert className="size-4" />}
                            title="Grace expired"
                            description="Collect the surcharge amount before completing exit."
                        />
                    </CardContent>
                </Card>
            </div>

            <ConfirmCompleteDialog
                collectedAmount={Number(collectedAmount) || 0}
                onConfirm={onConfirmComplete}
                onOpenChange={setConfirmOpen}
                open={confirmOpen}
                pending={completeExitMutation.isPending}
                preview={preview}
            />
        </div>
    );
}

function PreviewDecision({
    canComplete,
    collectedAmount,
    completePending,
    note,
    preview,
    setCollectedAmount,
    setConfirmOpen,
    setNote,
}: {
    canComplete: boolean;
    collectedAmount: string;
    completePending: boolean;
    note: string;
    preview: StaffExitPreviewResponse;
    setCollectedAmount: (value: string) => void;
    setConfirmOpen: (value: boolean) => void;
    setNote: (value: string) => void;
}) {
    const decision = getExitDecision(preview);
    const isPaidOnline = decision === 'ALLOW_EXIT';
    const isCash = decision === 'COLLECT_CASH';
    const isSurcharge = decision === 'GRACE_EXPIRED_SURCHARGE';
    const isBlocked = decision === 'BLOCKED';
    const currency = preview.currency ?? 'VND';

    if (isBlocked) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Exit blocked</CardTitle>
                    <CardDescription>
                        This session cannot be completed at the gate.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DecisionBanner
                        tone="red"
                        icon={<AlertCircle className="size-5" />}
                        title="ERROR"
                        description={
                            preview.message ||
                            mapBackendCode(preview.errorCode) ||
                            'The backend blocked this exit preview.'
                        }
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Preview result</CardTitle>
                <CardDescription>
                    Confirm the decision before completing exit.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isPaidOnline ? (
                    <DecisionBanner
                        tone="green"
                        icon={<CheckCircle2 className="size-5" />}
                        title="PAID ONLINE"
                        description="Online payment is confirmed. Gate exit can be completed."
                    />
                ) : isCash ? (
                    <DecisionBanner
                        tone="amber"
                        icon={<Banknote className="size-5" />}
                        title="Cash payment required"
                        description="Collect the parking fee in cash before opening the gate."
                    />
                ) : isSurcharge ? (
                    <DecisionBanner
                        tone="red"
                        icon={<ShieldAlert className="size-5" />}
                        title="Grace period expired"
                        description="Collect the surcharge in cash before opening the gate."
                    />
                ) : (
                    <DecisionBanner
                        tone="red"
                        icon={<AlertCircle className="size-5" />}
                        title="ERROR"
                        description={
                            preview.message ||
                            `Unsupported exit decision: ${decision}`
                        }
                    />
                )}

                <div className="grid gap-3 md:grid-cols-2">
                    <DetailItem label="Plate" value={getPlate(preview)} />
                    <DetailItem label="Card" value={preview.cardCode ?? '-'} />
                    <DetailItem label="Slot" value={preview.slotCode ?? '-'} />
                    <DetailItem
                        label="Duration"
                        value={formatDuration(preview.durationMinutes)}
                    />
                    <DetailItem
                        label={isPaidOnline ? 'Amount paid' : 'Amount due'}
                        value={formatMoney(
                            isPaidOnline
                                ? getPreviewAmount(preview)
                                : (preview.amountDue ??
                                      getPreviewAmount(preview)),
                            currency,
                        )}
                    />
                    <DetailItem
                        label="Total amount"
                        value={formatMoney(getPreviewAmount(preview), currency)}
                    />
                    <DetailItem
                        label="Paid at"
                        value={formatDateTime(preview.paidAt)}
                    />
                    <DetailItem
                        label="Exit deadline"
                        value={formatDateTime(preview.exitDeadline)}
                    />
                    {isSurcharge ? (
                        <DetailItem
                            label="Surcharge amount"
                            value={formatMoney(
                                preview.surchargeAmount,
                                currency,
                            )}
                        />
                    ) : null}
                    <DetailItem
                        label="Pricing rule"
                        value={preview.pricingRuleName ?? '-'}
                    />
                </div>

                {!isPaidOnline ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium">
                                Collected amount
                            </span>
                            <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={collectedAmount}
                                disabled={completePending}
                                onChange={(event) =>
                                    setCollectedAmount(event.target.value)
                                }
                            />
                        </label>
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium">Note</span>
                            <Input
                                value={note}
                                placeholder="Optional"
                                disabled={completePending}
                                onChange={(event) =>
                                    setNote(event.target.value)
                                }
                            />
                        </label>
                    </div>
                ) : null}

                <Button
                    type="button"
                    size="lg"
                    className="h-11 w-full"
                    disabled={!canComplete}
                    onClick={() => setConfirmOpen(true)}
                >
                    {completePending ? (
                        <Loader2
                            className="animate-spin"
                            data-icon="inline-start"
                        />
                    ) : (
                        <DoorOpen data-icon="inline-start" />
                    )}
                    {completePending
                        ? 'Completing exit...'
                        : getPrimaryActionLabel(decision)}
                </Button>
            </CardContent>
        </Card>
    );
}

function CompletionSuccess({
    completion,
    onScanNext,
    scanNextButtonRef,
}: {
    completion: StaffCompleteExitResponse;
    onScanNext: () => void;
    scanNextButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
    const currency = completion.currency ?? 'VND';
    const checkOutAt = completion.checkOutAt;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Exit completed</CardTitle>
                <CardDescription>
                    The parking session has been closed.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <DecisionBanner
                    tone="green"
                    icon={<DoorOpen className="size-5" />}
                    title="Gate can open now"
                    description="Return the card as directed by your local exit process."
                />
                <div className="grid gap-3 md:grid-cols-2">
                    <DetailItem label="Plate" value={getPlate(completion)} />
                    <DetailItem
                        label="Card"
                        value={completion.cardCode ?? '-'}
                    />
                    <DetailItem
                        label="Total amount"
                        value={formatMoney(completion.totalAmount, currency)}
                    />
                    <DetailItem
                        label="Collected amount"
                        value={formatMoney(
                            completion.collectedAmount,
                            currency,
                        )}
                    />
                    <DetailItem
                        label="Check-out time"
                        value={formatDateTime(checkOutAt)}
                    />
                    <DetailItem
                        label="Payment mode"
                        value={completion.paymentMode ?? '-'}
                    />
                    <DetailItem
                        label="Slot status"
                        value={completion.slotStatus ?? '-'}
                    />
                    <DetailItem
                        label="Card status"
                        value={completion.cardStatus ?? '-'}
                    />
                </div>
                <Button
                    ref={scanNextButtonRef}
                    type="button"
                    className="w-full"
                    onClick={onScanNext}
                >
                    <RefreshCw data-icon="inline-start" />
                    Scan next card
                </Button>
            </CardContent>
        </Card>
    );
}

function ConfirmCompleteDialog({
    collectedAmount,
    onConfirm,
    onOpenChange,
    open,
    pending,
    preview,
}: {
    collectedAmount: number;
    onConfirm: () => void;
    onOpenChange: (value: boolean) => void;
    open: boolean;
    pending: boolean;
    preview: StaffExitPreviewResponse | null;
}) {
    const paymentMode = preview
        ? getPaymentMode(getExitDecision(preview))
        : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Complete exit?</DialogTitle>
                    <DialogDescription>
                        Confirm the gate decision before closing this parking
                        session.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 text-sm">
                    <DetailItem label="Plate" value={getPlate(preview)} />
                    <DetailItem label="Card" value={preview?.cardCode ?? '-'} />
                    <DetailItem
                        label="Payment mode"
                        value={paymentMode ?? '-'}
                    />
                    <DetailItem
                        label="Collected amount"
                        value={formatMoney(
                            collectedAmount,
                            preview?.currency ?? 'VND',
                        )}
                    />
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={pending}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={pending}
                        onClick={onConfirm}
                    >
                        {pending ? (
                            <Loader2
                                className="animate-spin"
                                data-icon="inline-start"
                            />
                        ) : null}
                        Confirm exit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DecisionBanner({
    description,
    icon,
    title,
    tone,
}: {
    description: string;
    icon: React.ReactNode;
    title: string;
    tone: 'green' | 'amber' | 'red';
}) {
    return (
        <div
            className={cn(
                'rounded-lg border p-4',
                tone === 'green' &&
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
                tone === 'amber' &&
                    'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
                tone === 'red' &&
                    'border-destructive/30 bg-destructive/10 text-destructive',
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div>
                    <p className="text-lg font-semibold tracking-normal">
                        {title}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) {
    return (
        <div className="rounded-lg border px-3 py-2">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 text-sm font-semibold break-all">
                {value || '-'}
            </p>
        </div>
    );
}

function ContextItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-lg border px-3 py-2">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="truncate text-sm font-semibold">{value}</p>
        </div>
    );
}

function GuideItem({
    description,
    icon,
    title,
}: {
    description: string;
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border p-3">
            <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md border">
                {icon}
            </div>
            <div>
                <p className="font-medium">{title}</p>
                <p className="text-muted-foreground text-xs">{description}</p>
            </div>
        </div>
    );
}

function mapBackendCode(code?: string | null) {
    if (!code) {
        return '';
    }

    if (!terminalErrorCodes.includes(code)) {
        return code;
    }

    return code
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
