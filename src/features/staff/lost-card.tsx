'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Banknote,
    CheckCircle2,
    CreditCard,
    IdCard,
    ImageIcon,
    Loader2,
    Search,
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
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/axios-config';
import {
    completeLostCardExitApi,
    createLostCardCaseApi,
    presignLostCardPhotoUploadApi,
    previewLostCardApi,
    staffQueryKeys,
    uploadLostCardPhotoFile,
    type StaffLostCardCaseResponse,
    type StaffLostCardCompleteExitResponse,
    type StaffLostCardPreviewResponse,
    type StaffPenaltyCase,
} from '@/service/staff';
import { useAuthStore } from '@/stores/use-auth-store';

const ACCEPTED_LOST_CARD_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_LOST_CARD_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

type EvidenceKind = 'identity' | 'vehicle' | 'plate';

type EvidenceState = {
    file: File | null;
    previewUrl: string;
};

const emptyEvidence = (): EvidenceState => ({
    file: null,
    previewUrl: '',
});

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

const getLostCardErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        const normalized = (error.message || '').toLowerCase();

        if (normalized.includes('no_active_session_for_plate')) {
            return 'No active parking session was found for this plate.';
        }

        if (normalized.includes('penalty_rule_not_configured')) {
            return 'Lost-card penalty rule is not configured.';
        }

        if (normalized.includes('lost_card_case_already_applied')) {
            return 'A lost-card case already exists for this session.';
        }

        if (normalized.includes('collected_amount_too_low')) {
            return 'Collected amount is lower than the total due.';
        }

        return error.message || 'Lost-card operation failed.';
    }

    if (error instanceof Error) {
        return error.message || 'Lost-card operation failed.';
    }

    return 'Lost-card operation failed.';
};

export function StaffLostCard() {
    const workContext = useAuthStore((state) => state.user?.workContext);
    const [plateNumber, setPlateNumber] = useState('');
    const [preview, setPreview] = useState<StaffLostCardPreviewResponse | null>(
        null,
    );
    const [createdCase, setCreatedCase] =
        useState<StaffLostCardCaseResponse | null>(null);
    const [completion, setCompletion] =
        useState<StaffLostCardCompleteExitResponse | null>(null);
    const [collectedAmount, setCollectedAmount] = useState('0');
    const [note, setNote] = useState('');
    const [evidence, setEvidence] = useState<Record<EvidenceKind, EvidenceState>>({
        identity: emptyEvidence(),
        vehicle: emptyEvidence(),
        plate: emptyEvidence(),
    });

    const previewMutation = useMutation({
        mutationKey: staffQueryKeys.lostCardPreview(plateNumber),
        mutationFn: previewLostCardApi,
        onSuccess: (result) => {
            setPreview(result);
            setCreatedCase(null);
            setCompletion(null);
            setCollectedAmount(String(result.totalDueIfLostCard ?? 0));
            setNote('Driver reported lost RFID card');
        },
        onError: (error) => {
            setPreview(null);
            setCreatedCase(null);
            setCompletion(null);
            toast.error(getLostCardErrorMessage(error));
        },
    });

    const createCaseMutation = useMutation({
        mutationKey: staffQueryKeys.lostCardCase,
        mutationFn: async () => {
            if (!preview?.sessionId) {
                throw new Error('Preview a session before creating a case.');
            }

            const uploads = await uploadAllEvidence(evidence);

            return createLostCardCaseApi({
                sessionId: preview.sessionId,
                identityImageUrl: uploads.identity,
                vehicleImageUrl: uploads.vehicle,
                licensePlateImageUrl: uploads.plate,
                note: note.trim() || undefined,
            });
        },
        onSuccess: (result) => {
            setCreatedCase(result);
            toast.success('Lost-card case created.');
        },
        onError: (error) => {
            toast.error(getLostCardErrorMessage(error));
        },
    });

    const completeMutation = useMutation({
        mutationKey: staffQueryKeys.lostCardCompleteExit,
        mutationFn: () => {
            if (!preview?.sessionId || !createdCase?.penaltyCase.id) {
                throw new Error('Create a lost-card case before completing exit.');
            }

            const amount = Number(collectedAmount);

            if (!Number.isFinite(amount) || amount < 0) {
                throw new Error('Collected amount must be zero or greater.');
            }

            return completeLostCardExitApi({
                sessionId: preview.sessionId,
                lostCardCaseId: createdCase.penaltyCase.id,
                collectedAmount: amount,
                note: note.trim() || undefined,
            });
        },
        onSuccess: (result) => {
            setCompletion(result);
            toast.success('Lost-card exit completed.');
        },
        onError: (error) => {
            toast.error(getLostCardErrorMessage(error));
        },
    });

    const canCreateCase = useMemo(
        () =>
            !!preview?.sessionId &&
            !createdCase &&
            evidence.identity.file &&
            evidence.vehicle.file &&
            evidence.plate.file,
        [createdCase, evidence.identity.file, evidence.plate.file, evidence.vehicle.file, preview],
    );

    const onPreview = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedPlate = plateNumber.trim().toUpperCase();

        if (!normalizedPlate) {
            toast.error('Plate number is required.');
            return;
        }

        setPlateNumber(normalizedPlate);
        previewMutation.mutate(normalizedPlate);
    };

    const setEvidenceFile = (kind: EvidenceKind, file?: File) => {
        const current = evidence[kind];

        if (current.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(current.previewUrl);
        }

        if (!file) {
            setEvidence((value) => ({ ...value, [kind]: emptyEvidence() }));
            return;
        }

        const validationError = validateEvidenceFile(file);

        if (validationError) {
            toast.error(validationError);
            return;
        }

        setEvidence((value) => ({
            ...value,
            [kind]: {
                file,
                previewUrl: URL.createObjectURL(file),
            },
        }));
    };

    const resetFlow = () => {
        setPlateNumber('');
        setPreview(null);
        setCreatedCase(null);
        setCompletion(null);
        setCollectedAmount('0');
        setNote('');
        setEvidence({
            identity: emptyEvidence(),
            vehicle: emptyEvidence(),
            plate: emptyEvidence(),
        });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm font-medium">
                    STAFF
                </p>
                <h1 className="text-3xl font-semibold tracking-normal">
                    Lost Card
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                    Search by plate, record evidence, collect parking fees and
                    fines, then complete exit without returning the card to the
                    available pool.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Exit kiosk context</CardTitle>
                            <CardDescription>
                                Lost-card exit is limited to the assigned exit
                                parking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {workContext ? (
                                <div className="grid gap-3 text-sm md:grid-cols-3">
                                    <DetailItem
                                        label="Kiosk"
                                        value={workContext.kioskName}
                                    />
                                    <DetailItem
                                        label="Type"
                                        value={workContext.kioskType}
                                    />
                                    <DetailItem
                                        label="Parking"
                                        value={workContext.parkingName}
                                    />
                                </div>
                            ) : (
                                <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
                                    No kiosk context was returned by your
                                    session.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Search by plate</CardTitle>
                            <CardDescription>
                                Use the license plate when the driver cannot
                                present the RFID card.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="flex flex-col gap-3 sm:flex-row"
                                onSubmit={onPreview}
                            >
                                <Input
                                    value={plateNumber}
                                    className="h-12 text-lg font-semibold tracking-wide"
                                    placeholder="51A-12345"
                                    autoComplete="off"
                                    disabled={
                                        previewMutation.isPending ||
                                        createCaseMutation.isPending ||
                                        completeMutation.isPending
                                    }
                                    onChange={(event) =>
                                        setPlateNumber(event.target.value)
                                    }
                                />
                                <Button
                                    type="submit"
                                    className="h-12 sm:w-40"
                                    disabled={previewMutation.isPending}
                                >
                                    {previewMutation.isPending ? (
                                        <Loader2
                                            className="animate-spin"
                                            data-icon="inline-start"
                                        />
                                    ) : (
                                        <Search data-icon="inline-start" />
                                    )}
                                    Preview
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {completion ? (
                        <CompletionPanel
                            completion={completion}
                            onReset={resetFlow}
                        />
                    ) : preview ? (
                        <LostCardCasePanel
                            canCreateCase={Boolean(canCreateCase)}
                            collectedAmount={collectedAmount}
                            completePending={completeMutation.isPending}
                            createPending={createCaseMutation.isPending}
                            createdCase={createdCase}
                            evidence={evidence}
                            note={note}
                            preview={preview}
                            onComplete={() => completeMutation.mutate()}
                            onCreateCase={() => createCaseMutation.mutate()}
                            onEvidenceChange={setEvidenceFile}
                            onCollectedAmountChange={setCollectedAmount}
                            onNoteChange={setNote}
                        />
                    ) : (
                        <Card>
                            <CardContent className="text-muted-foreground flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center text-sm">
                                <CreditCard className="size-10" />
                                <p>Search a plate to preview lost-card exit.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Evidence checklist</CardTitle>
                        <CardDescription>
                            Evidence is uploaded with tenant-scoped presigned
                            storage URLs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <GuideItem
                            icon={<IdCard className="size-4" />}
                            title="Identity document"
                            description="Capture the driver identity document."
                        />
                        <GuideItem
                            icon={<ImageIcon className="size-4" />}
                            title="Vehicle"
                            description="Capture the vehicle at the exit gate."
                        />
                        <GuideItem
                            icon={<ShieldAlert className="size-4" />}
                            title="License plate"
                            description="Capture the plate used for lookup."
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function LostCardCasePanel({
    canCreateCase,
    collectedAmount,
    completePending,
    createPending,
    createdCase,
    evidence,
    note,
    preview,
    onCollectedAmountChange,
    onComplete,
    onCreateCase,
    onEvidenceChange,
    onNoteChange,
}: {
    canCreateCase: boolean;
    collectedAmount: string;
    completePending: boolean;
    createPending: boolean;
    createdCase: StaffLostCardCaseResponse | null;
    evidence: Record<EvidenceKind, EvidenceState>;
    note: string;
    preview: StaffLostCardPreviewResponse;
    onCollectedAmountChange: (value: string) => void;
    onComplete: () => void;
    onCreateCase: () => void;
    onEvidenceChange: (kind: EvidenceKind, file?: File) => void;
    onNoteChange: (value: string) => void;
}) {
    const currency = preview.currency ?? 'VND';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Lost-card exit preview</CardTitle>
                <CardDescription>
                    Create the lost-card case before completing exit.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                    <DetailItem label="Plate" value={preview.plateNumber} />
                    <DetailItem
                        label="Vehicle type"
                        value={preview.vehicleType ?? '-'}
                    />
                    <DetailItem
                        label="Parking"
                        value={preview.parkingName ?? '-'}
                    />
                    <DetailItem label="Slot" value={preview.slotCode ?? '-'} />
                    <DetailItem
                        label="Check-in"
                        value={formatDateTime(preview.checkInAt)}
                    />
                    <DetailItem
                        label="RFID card"
                        value={preview.currentRfidCardCode ?? '-'}
                    />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <MoneyItem
                        label="Parking due"
                        value={preview.parkingAmountDue}
                        currency={currency}
                    />
                    <MoneyItem
                        label="Surcharge"
                        value={preview.surchargeAmountDue}
                        currency={currency}
                    />
                    <MoneyItem
                        label="Existing penalties"
                        value={preview.existingPenaltyAmount}
                        currency={currency}
                    />
                    <MoneyItem
                        label="Lost-card fine"
                        value={preview.lostCardPenaltyAmount}
                        currency={currency}
                    />
                    <MoneyItem
                        label="Total due"
                        value={preview.totalDueIfLostCard}
                        currency={currency}
                    />
                </div>

                <PenaltyCaseList cases={preview.activePenaltyCases ?? []} />
                <EntryPhotos preview={preview} />

                <div className="grid gap-3 md:grid-cols-3">
                    <EvidenceInput
                        evidence={evidence.identity}
                        label="Identity document"
                        onChange={(file) => onEvidenceChange('identity', file)}
                    />
                    <EvidenceInput
                        evidence={evidence.vehicle}
                        label="Vehicle"
                        onChange={(file) => onEvidenceChange('vehicle', file)}
                    />
                    <EvidenceInput
                        evidence={evidence.plate}
                        label="License plate"
                        onChange={(file) => onEvidenceChange('plate', file)}
                    />
                </div>

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
                                onCollectedAmountChange(event.target.value)
                            }
                        />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-sm font-medium">Note</span>
                        <Input
                            value={note}
                            placeholder="Optional"
                            disabled={completePending}
                            onChange={(event) => onNoteChange(event.target.value)}
                        />
                    </label>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                        type="button"
                        variant={createdCase ? 'outline' : 'default'}
                        disabled={!canCreateCase || createPending}
                        onClick={onCreateCase}
                    >
                        {createPending ? (
                            <Loader2
                                className="animate-spin"
                                data-icon="inline-start"
                            />
                        ) : (
                            <ShieldAlert data-icon="inline-start" />
                        )}
                        {createdCase ? 'Case created' : 'Create lost-card case'}
                    </Button>
                    <Button
                        type="button"
                        disabled={!createdCase || completePending}
                        onClick={onComplete}
                    >
                        {completePending ? (
                            <Loader2
                                className="animate-spin"
                                data-icon="inline-start"
                            />
                        ) : (
                            <Banknote data-icon="inline-start" />
                        )}
                        Complete exit
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function CompletionPanel({
    completion,
    onReset,
}: {
    completion: StaffLostCardCompleteExitResponse;
    onReset: () => void;
}) {
    const currency = completion.currency ?? 'VND';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Lost-card exit completed</CardTitle>
                <CardDescription>
                    The parking session has been closed and the card was not
                    returned to the available pool.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-5 text-emerald-700 dark:text-emerald-200" />
                        <div>
                            <p className="text-sm font-semibold">
                                Gate can open now
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                RFID card status: {completion.cardStatus ?? '-'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <DetailItem
                        label="Plate"
                        value={completion.plateNumber ?? '-'}
                    />
                    <DetailItem
                        label="Slot"
                        value={`${completion.slotCode ?? '-'} / ${
                            completion.slotStatus ?? '-'
                        }`}
                    />
                    <MoneyItem
                        label="Penalties collected"
                        value={completion.penaltyAmountDue}
                        currency={currency}
                    />
                    <MoneyItem
                        label="Total collected"
                        value={completion.collectedAmount}
                        currency={currency}
                    />
                    <DetailItem
                        label="Check-out"
                        value={formatDateTime(completion.checkOutAt)}
                    />
                </div>
                <Button type="button" className="w-full" onClick={onReset}>
                    Search another plate
                </Button>
            </CardContent>
        </Card>
    );
}

function EvidenceInput({
    evidence,
    label,
    onChange,
}: {
    evidence: EvidenceState;
    label: string;
    onChange: (file?: File) => void;
}) {
    return (
        <label className="space-y-2 rounded-lg border p-3">
            <span className="text-sm font-medium">{label}</span>
            <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={(event) => onChange(event.target.files?.[0])}
            />
            {evidence.previewUrl ? (
                <div className="bg-muted aspect-video overflow-hidden rounded-md border">
                    <span
                        className="block size-full bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${evidence.previewUrl})`,
                        }}
                    />
                </div>
            ) : null}
        </label>
    );
}

function EntryPhotos({ preview }: { preview: StaffLostCardPreviewResponse }) {
    const photos = [
        { label: 'Entry photo', url: preview.entryImageUrl },
        { label: 'License plate photo', url: preview.licensePlateImageUrl },
    ].filter((photo): photo is { label: string; url: string } =>
        Boolean(photo.url),
    );

    if (photos.length === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
                <ImageIcon className="text-muted-foreground size-4" />
                <h3 className="text-sm font-semibold">Entry photos</h3>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {photos.map((photo) => (
                    <a
                        key={photo.label}
                        className="group block rounded-md border p-2"
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <div className="bg-muted aspect-video overflow-hidden rounded border">
                            <span
                                className="block size-full bg-cover bg-center transition-transform group-hover:scale-105"
                                style={{
                                    backgroundImage: `url(${photo.url})`,
                                }}
                            />
                        </div>
                        <p className="mt-2 text-xs font-medium">
                            {photo.label}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    );
}

function PenaltyCaseList({ cases }: { cases: StaffPenaltyCase[] }) {
    if (cases.length === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Existing penalties</h3>
            <div className="mt-3 space-y-2">
                {cases.map((penaltyCase) => (
                    <div
                        key={penaltyCase.id}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                        <div>
                            <p className="font-medium">
                                {penaltyCase.name ?? penaltyCase.type}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {penaltyCase.status}
                            </p>
                        </div>
                        <span className="font-semibold">
                            {formatMoney(
                                penaltyCase.amount,
                                penaltyCase.currency ?? 'VND',
                            )}
                        </span>
                    </div>
                ))}
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

function MoneyItem({
    currency,
    label,
    value,
}: {
    currency: string;
    label: string;
    value?: number | null;
}) {
    return <DetailItem label={label} value={formatMoney(value, currency)} />;
}

function GuideItem({
    description,
    icon,
    title,
}: {
    description: string;
    icon: ReactNode;
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

async function uploadAllEvidence(
    evidence: Record<EvidenceKind, EvidenceState>,
) {
    const identity = evidence.identity.file;
    const vehicle = evidence.vehicle.file;
    const plate = evidence.plate.file;

    if (!identity || !vehicle || !plate) {
        throw new Error('All evidence photos are required.');
    }

    const [identityKey, vehicleKey, plateKey] = await Promise.all([
        uploadEvidence(identity, 'IDENTITY_DOCUMENT'),
        uploadEvidence(vehicle, 'VEHICLE'),
        uploadEvidence(plate, 'LICENSE_PLATE'),
    ]);

    return {
        identity: identityKey,
        vehicle: vehicleKey,
        plate: plateKey,
    };
}

async function uploadEvidence(
    file: File,
    photoType: 'IDENTITY_DOCUMENT' | 'VEHICLE' | 'LICENSE_PLATE',
) {
    const presign = await presignLostCardPhotoUploadApi({
        fileName: file.name,
        contentType: file.type,
        photoType,
    });
    await uploadLostCardPhotoFile(file, presign);

    return presign.publicUrl ?? presign.objectKey;
}

function validateEvidenceFile(file: File) {
    if (!ACCEPTED_LOST_CARD_PHOTO_TYPES.includes(file.type)) {
        return 'Upload a JPG, PNG, or WebP photo.';
    }

    if (file.size > MAX_LOST_CARD_PHOTO_SIZE_BYTES) {
        return 'Evidence photo must be 5 MB or smaller.';
    }

    return '';
}
