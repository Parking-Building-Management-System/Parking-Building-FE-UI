'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    RefreshCw,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/features/admin/error-message';
import { cn } from '@/lib/utils';
import {
    listDueFireInspectionsApi,
    staffFireInspectionFormSchema,
    staffFireInspectionQueryKeys,
    submitFireInspectionApi,
    type DueFireInspectionItem,
    type StaffFireInspectionFormValues,
} from '@/service/staff';
import {
    fireExtinguisherStatusValues,
    fireInspectionResultValues,
    type FireExtinguisherStatus,
    type FireInspectionResult,
} from '@/service/manager/fire-safety-type';
import { useAuthStore } from '@/stores/use-auth-store';

const ALL = 'ALL';

const statusTone: Record<string, string> = {
    ACTIVE: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
    EXPIRED: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    MISSING:
        'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
    DAMAGED:
        'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    MAINTENANCE:
        'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
};

export function StaffFireInspectionPage() {
    const queryClient = useQueryClient();
    const workContext = useAuthStore((state) => state.user?.workContext);
    const [status, setStatus] = useState(ALL);
    const [selectedId, setSelectedId] = useState('');
    const [form, setForm] = useState<StaffFireInspectionFormValues>({
        fireExtinguisherId: '',
        result: 'OK',
        pressureOk: true,
        sealOk: true,
        locationOk: true,
        expiryOk: true,
        photoUrl: '',
        note: '',
        nextInspectionAt: '',
    });
    const filters = useMemo(
        () => ({
            status:
                status === ALL ? undefined : (status as FireExtinguisherStatus),
        }),
        [status],
    );
    const dueQuery = useQuery({
        queryKey: staffFireInspectionQueryKeys.due(filters),
        queryFn: () => listDueFireInspectionsApi(filters),
    });
    const submitMutation = useMutation({
        mutationFn: submitFireInspectionApi,
        onSuccess: async () => {
            toast.success('Fire inspection submitted.');
            setSelectedId('');
            setForm({
                fireExtinguisherId: '',
                result: 'OK',
                pressureOk: true,
                sealOk: true,
                locationOk: true,
                expiryOk: true,
                photoUrl: '',
                note: '',
                nextInspectionAt: '',
            });
            await queryClient.invalidateQueries({
                queryKey: ['staff-fire-inspections-due'],
            });
        },
        onError: (error) =>
            toast.error(getErrorMessage(error, 'Failed to submit inspection.')),
    });

    const dueItems = dueQuery.data ?? [];
    const selectedItem = dueItems.find((item) => item.id === selectedId);

    const selectItem = (item: DueFireInspectionItem) => {
        setSelectedId(item.id);
        setForm((current) => ({
            ...current,
            fireExtinguisherId: item.id,
            result: suggestedResult(item.status),
            expiryOk: item.status !== 'EXPIRED',
        }));
    };

    const submit = () => {
        const parsed = staffFireInspectionFormSchema.safeParse(form);
        if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? 'Check form values.');
            return;
        }
        submitMutation.mutate({
            fireExtinguisherId: parsed.data.fireExtinguisherId,
            result: parsed.data.result,
            pressureOk: parsed.data.pressureOk,
            sealOk: parsed.data.sealOk,
            locationOk: parsed.data.locationOk,
            expiryOk: parsed.data.expiryOk,
            photoUrl: parsed.data.photoUrl || undefined,
            note: parsed.data.note?.trim() || undefined,
            nextInspectionAt: parsed.data.nextInspectionAt || undefined,
        });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm font-medium">
                    STAFF
                </p>
                <h1 className="text-3xl font-semibold tracking-normal">
                    Fire Inspection
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                    Inspect due or expiring fire extinguishers for the current
                    staff parking context.
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
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
                        <div className="text-muted-foreground rounded-lg border p-3 text-sm">
                            No kiosk context was returned by your session.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Due Inspections</CardTitle>
                            <CardDescription>
                                {dueItems.length.toLocaleString()} items
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>
                                        All statuses
                                    </SelectItem>
                                    {fireExtinguisherStatusValues.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => dueQuery.refetch()}
                            >
                                <RefreshCw className="size-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {dueQuery.isLoading &&
                            Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-24 w-full" />
                            ))}
                        {!dueQuery.isLoading &&
                            dueItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={cn(
                                        'w-full rounded-lg border p-4 text-left text-sm transition-colors hover:bg-muted/50',
                                        selectedId === item.id &&
                                            'border-primary bg-primary/5',
                                    )}
                                    onClick={() => selectItem(item)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-semibold">
                                                {item.code}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {item.type} ·{' '}
                                                {item.floorName ??
                                                    item.floorCode ??
                                                    '-'}{' '}
                                                / {item.zoneName ?? '-'}
                                            </div>
                                        </div>
                                        <StatusBadge status={item.status} />
                                    </div>
                                    <div className="text-muted-foreground mt-3 grid gap-2 sm:grid-cols-2">
                                        <span>
                                            Location:{' '}
                                            {item.locationDescription ?? '-'}
                                        </span>
                                        <span>
                                            Expiry:{' '}
                                            {formatDate(item.expiryDate)}
                                        </span>
                                        <span>
                                            Next:{' '}
                                            {formatDateTime(
                                                item.nextInspectionAt,
                                            )}
                                        </span>
                                        <WarningText item={item} />
                                    </div>
                                </button>
                            ))}
                        {!dueQuery.isLoading && dueItems.length === 0 && (
                            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No fire inspections are due for this context.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Checklist</CardTitle>
                        <CardDescription>
                            {selectedItem
                                ? selectedItem.code
                                : 'Select an extinguisher to inspect.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Label className="grid gap-2">
                            <span>Result</span>
                            <Select
                                value={form.result}
                                disabled={!selectedItem}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        result: value as FireInspectionResult,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {fireInspectionResultValues.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Label>

                        <div className="grid gap-3">
                            <ChecklistItem
                                label="Pressure OK"
                                checked={form.pressureOk}
                                disabled={!selectedItem}
                                onChange={(checked) =>
                                    setForm((current) => ({
                                        ...current,
                                        pressureOk: checked,
                                    }))
                                }
                            />
                            <ChecklistItem
                                label="Seal OK"
                                checked={form.sealOk}
                                disabled={!selectedItem}
                                onChange={(checked) =>
                                    setForm((current) => ({
                                        ...current,
                                        sealOk: checked,
                                    }))
                                }
                            />
                            <ChecklistItem
                                label="Location OK"
                                checked={form.locationOk}
                                disabled={!selectedItem}
                                onChange={(checked) =>
                                    setForm((current) => ({
                                        ...current,
                                        locationOk: checked,
                                    }))
                                }
                            />
                            <ChecklistItem
                                label="Expiry OK"
                                checked={form.expiryOk}
                                disabled={!selectedItem}
                                onChange={(checked) =>
                                    setForm((current) => ({
                                        ...current,
                                        expiryOk: checked,
                                    }))
                                }
                            />
                        </div>

                        <Label className="grid gap-2">
                            <span>Photo URL (optional)</span>
                            <Input
                                value={form.photoUrl ?? ''}
                                disabled={!selectedItem}
                                placeholder="https://example.com/photo.jpg"
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        photoUrl: event.target.value,
                                    }))
                                }
                            />
                        </Label>
                        <Label className="grid gap-2">
                            <span>Next Inspection</span>
                            <Input
                                type="datetime-local"
                                value={form.nextInspectionAt ?? ''}
                                disabled={!selectedItem}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        nextInspectionAt: event.target.value,
                                    }))
                                }
                            />
                        </Label>
                        <Label className="grid gap-2">
                            <span>Note</span>
                            <Input
                                value={form.note ?? ''}
                                disabled={!selectedItem}
                                placeholder="Inspection note"
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        note: event.target.value,
                                    }))
                                }
                            />
                        </Label>
                        <Button
                            className="h-11 w-full"
                            disabled={!selectedItem || submitMutation.isPending}
                            onClick={submit}
                        >
                            <ClipboardCheck data-icon="inline-start" />
                            {submitMutation.isPending
                                ? 'Submitting...'
                                : 'Submit Inspection'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ContextItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="rounded-lg border p-3">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="font-medium">{value || '-'}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                statusTone[status] ?? 'bg-muted text-muted-foreground',
            )}
        >
            {status}
        </span>
    );
}

function ChecklistItem({
    label,
    checked,
    disabled,
    onChange,
}: {
    label: string;
    checked: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(value) => onChange(value === true)}
            />
            <span>{label}</span>
        </label>
    );
}

function WarningText({ item }: { item: DueFireInspectionItem }) {
    const isWarning =
        item.status === 'EXPIRED' ||
        item.status === 'MISSING' ||
        item.status === 'DAMAGED';
    if (!isWarning) {
        return (
            <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
                <CheckCircle2 className="size-3" />
                Standard inspection
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-300">
            <AlertTriangle className="size-3" />
            Requires attention
        </span>
    );
}

function suggestedResult(status: FireExtinguisherStatus): FireInspectionResult {
    if (status === 'EXPIRED') {
        return 'EXPIRED';
    }
    if (status === 'MISSING') {
        return 'MISSING';
    }
    if (status === 'DAMAGED') {
        return 'DAMAGED';
    }
    if (status === 'MAINTENANCE') {
        return 'NEEDS_REPLACEMENT';
    }
    return 'OK';
}

function formatDate(value?: string | null) {
    if (!value) {
        return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleDateString('en-US');
}

function formatDateTime(value?: string | null) {
    if (!value) {
        return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleString('en-US');
}
