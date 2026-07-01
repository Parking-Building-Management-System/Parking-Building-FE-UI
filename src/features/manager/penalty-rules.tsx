'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Archive,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/features/admin/error-message';
import {
    ALL_PARKINGS,
    ALL_STATUSES,
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    TENANT_DEFAULT,
    StatusBadge,
    formatMoney,
} from '@/features/manager/pricing-shared';
import {
    listParkingsApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';
import {
    createPenaltyRuleApi,
    deletePenaltyRuleApi,
    listPenaltyRulesApi,
    managerPenaltyQueryKeys,
    updatePenaltyRuleApi,
    updatePenaltyRuleStatusApi,
} from '@/service/manager/penalty-api';
import {
    penaltyRuleStatusValues,
    penaltyTypeValues,
    type PenaltyRuleListParams,
    type PenaltyRuleRequest,
    type PenaltyRuleResponse,
    type PenaltyRuleStatus,
    type PenaltyType,
} from '@/service/manager/penalty-type';

const ALL_TYPES = 'ALL_TYPES';

type RuleStatusFilter = PenaltyRuleStatus | typeof ALL_STATUSES;
type RuleTypeFilter = PenaltyType | typeof ALL_TYPES;

interface DialogState {
    open: boolean;
    rule?: PenaltyRuleResponse;
}

interface PenaltyRuleDialogForm {
    name: string;
    code: string;
    type: PenaltyType;
    scope: 'TENANT_DEFAULT' | 'PARKING_OVERRIDE';
    parkingId: string;
    amount: string;
    currency: string;
    requiresPhoto: boolean;
    description: string;
    status: PenaltyRuleStatus;
}

const penaltyTypeLabels: Record<PenaltyType, string> = {
    OCCUPIED_ASSIGNED_SLOT: 'Slot occupied by another vehicle',
    ILLEGAL_PARKING: 'Illegal parking',
    LOST_CARD: 'Lost RFID card',
    BLOCKING_LANE: 'Blocking lane',
    OTHER: 'Other',
};

export function PenaltyRules() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [parkingId, setParkingId] = useState(ALL_PARKINGS);
    const [type, setType] = useState<RuleTypeFilter>(ALL_TYPES);
    const [status, setStatus] = useState<RuleStatusFilter>(ALL_STATUSES);
    const [page, setPage] = useState(DEFAULT_PAGE);
    const [dialog, setDialog] = useState<DialogState>({ open: false });

    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });

    const params = useMemo<PenaltyRuleListParams>(
        () => ({
            parkingId: parkingId === ALL_PARKINGS ? undefined : parkingId,
            type: type === ALL_TYPES ? undefined : type,
            status: status === ALL_STATUSES ? undefined : status,
            page,
            size: DEFAULT_PAGE_SIZE,
        }),
        [page, parkingId, status, type],
    );

    const rulesQuery = useQuery({
        queryKey: managerPenaltyQueryKeys.ruleList(params),
        queryFn: () => listPenaltyRulesApi(params),
        placeholderData: keepPreviousData,
    });

    const statusMutation = useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string;
            status: PenaltyRuleStatus;
        }) => updatePenaltyRuleStatusApi(id, { status }),
        onSuccess: () => {
            toast.success('Penalty rule status updated.');
            invalidatePenaltyRules(queryClient);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update penalty rule status.'),
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deletePenaltyRuleApi,
        onSuccess: () => {
            toast.success('Penalty rule archived.');
            invalidatePenaltyRules(queryClient);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to archive penalty rule.'),
            );
        },
    });

    useEffect(() => {
        if (rulesQuery.isError) {
            toast.error(
                getErrorMessage(
                    rulesQuery.error,
                    'Failed to load penalty rules.',
                ),
            );
        }
    }, [rulesQuery.error, rulesQuery.isError]);

    const allRules = rulesQuery.data?.content ?? [];
    const normalizedSearch = search.trim().toLowerCase();
    const rules = normalizedSearch
        ? allRules.filter((rule) =>
              [
                  rule.name,
                  rule.code,
                  rule.type,
                  rule.parkingName ?? 'Tenant default',
              ]
                  .join(' ')
                  .toLowerCase()
                  .includes(normalizedSearch),
          )
        : allRules;
    const totalElements = rulesQuery.data?.totalElements ?? 0;
    const normalizedPage = rulesQuery.data?.page ?? page;
    const normalizedSize = rulesQuery.data?.size ?? DEFAULT_PAGE_SIZE;
    const totalPages =
        normalizedSize > 0 ? Math.ceil(totalElements / normalizedSize) : 0;

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Penalty Rules
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        Configure fines applied to operational exceptions and
                        lost-card exits.
                    </p>
                </div>
                <Button onClick={() => setDialog({ open: true })}>
                    <Plus data-icon="inline-start" />
                    Create Rule
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_260px_180px]">
                    <div className="relative">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            className="pl-8"
                            placeholder="Search penalty rules"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <Select
                        value={parkingId}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setParkingId(value);
                        }}
                    >
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
                        value={type}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setType(value as RuleTypeFilter);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_TYPES}>All types</SelectItem>
                            {penaltyTypeValues.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {penaltyTypeLabels[value]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setStatus(value as RuleStatusFilter);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES}>
                                All statuses
                            </SelectItem>
                            {penaltyRuleStatusValues.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {value}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Fine Config</CardTitle>
                    <p className="text-muted-foreground text-xs">
                        {totalElements.toLocaleString()} configured rules
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rule</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Scope</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Evidence</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rulesQuery.isLoading && <RuleSkeleton />}
                            {!rulesQuery.isLoading &&
                                rules.map((rule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell className="min-w-56">
                                            <p className="font-medium">
                                                {rule.name}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {rule.code}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            {penaltyTypeLabels[rule.type] ??
                                                rule.type}
                                        </TableCell>
                                        <TableCell>
                                            {rule.parkingName ??
                                                (rule.parkingId
                                                    ? 'Parking override'
                                                    : 'Tenant default')}
                                        </TableCell>
                                        <TableCell>
                                            {formatMoney(
                                                rule.amount,
                                                rule.currency ?? 'VND',
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {rule.requiresPhoto
                                                ? 'Required'
                                                : 'Optional'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge value={rule.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <RuleActions
                                                rule={rule}
                                                statusPending={
                                                    statusMutation.isPending &&
                                                    statusMutation.variables
                                                        ?.id === rule.id
                                                }
                                                deletePending={
                                                    deleteMutation.isPending &&
                                                    deleteMutation.variables ===
                                                        rule.id
                                                }
                                                onEdit={() =>
                                                    setDialog({
                                                        open: true,
                                                        rule,
                                                    })
                                                }
                                                onStatusChange={(nextStatus) =>
                                                    statusMutation.mutate({
                                                        id: rule.id,
                                                        status: nextStatus,
                                                    })
                                                }
                                                onDelete={() => {
                                                    if (
                                                        window.confirm(
                                                            `Archive penalty rule "${rule.name}"?`,
                                                        )
                                                    ) {
                                                        deleteMutation.mutate(
                                                            rule.id,
                                                        );
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!rulesQuery.isLoading && rules.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <ShieldAlert className="size-8" />
                                            <p>No penalty rules found.</p>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    setDialog({ open: true })
                                                }
                                            >
                                                <Plus data-icon="inline-start" />
                                                Create Rule
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-muted-foreground text-sm">
                            Page {totalPages === 0 ? 0 : normalizedPage + 1} of{' '}
                            {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={normalizedPage <= 0}
                                onClick={() =>
                                    setPage((current) =>
                                        Math.max(0, current - 1),
                                    )
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    totalPages === 0 ||
                                    normalizedPage + 1 >= totalPages
                                }
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <PenaltyRuleDialog
                key={dialog.rule?.id ?? 'create'}
                open={dialog.open}
                rule={dialog.rule}
                parkings={parkingsQuery.data ?? []}
                onOpenChange={(open) =>
                    setDialog((current) => ({
                        ...current,
                        open,
                        rule: open ? current.rule : undefined,
                    }))
                }
            />
        </div>
    );
}

function RuleActions({
    deletePending,
    onDelete,
    onEdit,
    onStatusChange,
    rule,
    statusPending,
}: {
    deletePending: boolean;
    onDelete: () => void;
    onEdit: () => void;
    onStatusChange: (status: PenaltyRuleStatus) => void;
    rule: PenaltyRuleResponse;
    statusPending: boolean;
}) {
    const nextStatus = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    <Pencil data-icon="inline-start" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={statusPending}
                    onClick={() => onStatusChange(nextStatus)}
                >
                    Mark {nextStatus}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={deletePending} onClick={onDelete}>
                    <Archive data-icon="inline-start" />
                    Archive
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function PenaltyRuleDialog({
    open,
    parkings,
    rule,
    onOpenChange,
}: {
    open: boolean;
    parkings: Array<{ id: string; name: string }>;
    rule?: PenaltyRuleResponse;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<PenaltyRuleDialogForm>({
        name: rule?.name ?? '',
        code: rule?.code ?? '',
        type: rule?.type ?? 'OCCUPIED_ASSIGNED_SLOT',
        scope: rule?.parkingId ? 'PARKING_OVERRIDE' : 'TENANT_DEFAULT',
        parkingId: rule?.parkingId ?? TENANT_DEFAULT,
        amount: String(rule?.amount ?? 50000),
        currency: rule?.currency ?? 'VND',
        requiresPhoto: rule?.requiresPhoto ?? true,
        description: rule?.description ?? '',
        status: rule?.status ?? 'ACTIVE',
    });
    const [formError, setFormError] = useState('');
    const mutation = useMutation({
        mutationFn: () => {
            const payload = buildPenaltyRulePayload(form);
            return rule
                ? updatePenaltyRuleApi(rule.id, payload)
                : createPenaltyRuleApi(payload);
        },
        onSuccess: () => {
            toast.success(
                rule ? 'Penalty rule updated.' : 'Penalty rule created.',
            );
            invalidatePenaltyRules(queryClient);
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(
                    error,
                    rule
                        ? 'Failed to update penalty rule.'
                        : 'Failed to create penalty rule.',
                ),
            );
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {rule ? 'Edit Penalty Rule' : 'Create Penalty Rule'}
                    </DialogTitle>
                    <DialogDescription>
                        Tenant default applies unless a parking-specific rule
                        exists for the same penalty type.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const validationError = validatePenaltyRuleForm(form);

                        if (validationError) {
                            setFormError(validationError);
                            return;
                        }

                        setFormError('');
                        mutation.mutate();
                    }}
                >
                    <div className="grid gap-3 md:grid-cols-2">
                        <LabeledField label="Rule name">
                            <Input
                                value={form.name}
                                disabled={mutation.isPending}
                                onChange={(event) =>
                                    setFormValue(
                                        setForm,
                                        'name',
                                        event.target.value,
                                    )
                                }
                            />
                        </LabeledField>
                        <LabeledField label="Code">
                            <Input
                                value={form.code}
                                placeholder={form.type}
                                disabled={mutation.isPending}
                                onChange={(event) =>
                                    setFormValue(
                                        setForm,
                                        'code',
                                        event.target.value,
                                    )
                                }
                            />
                        </LabeledField>
                        <LabeledField label="Type">
                            <Select
                                value={form.type}
                                disabled={mutation.isPending}
                                onValueChange={(value) =>
                                    setFormValue(
                                        setForm,
                                        'type',
                                        value as PenaltyType,
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {penaltyTypeValues.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {penaltyTypeLabels[value]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </LabeledField>
                        <LabeledField label="Status">
                            <Select
                                value={form.status}
                                disabled={mutation.isPending}
                                onValueChange={(value) =>
                                    setFormValue(
                                        setForm,
                                        'status',
                                        value as PenaltyRuleStatus,
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {penaltyRuleStatusValues.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </LabeledField>
                        <LabeledField label="Scope">
                            <Select
                                value={form.scope}
                                disabled={mutation.isPending}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        scope: value as
                                            | 'TENANT_DEFAULT'
                                            | 'PARKING_OVERRIDE',
                                        parkingId:
                                            value === 'TENANT_DEFAULT'
                                                ? TENANT_DEFAULT
                                                : parkings[0]?.id ??
                                                  TENANT_DEFAULT,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Scope" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TENANT_DEFAULT">
                                        Tenant default
                                    </SelectItem>
                                    <SelectItem value="PARKING_OVERRIDE">
                                        Parking override
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </LabeledField>
                        <LabeledField label="Parking">
                            <Select
                                value={form.parkingId}
                                disabled={
                                    mutation.isPending ||
                                    form.scope === 'TENANT_DEFAULT'
                                }
                                onValueChange={(value) =>
                                    setFormValue(setForm, 'parkingId', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Parking" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TENANT_DEFAULT}>
                                        Tenant default
                                    </SelectItem>
                                    {parkings.map((parking) => (
                                        <SelectItem
                                            key={parking.id}
                                            value={parking.id}
                                        >
                                            {parking.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </LabeledField>
                        <LabeledField label="Amount">
                            <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={form.amount}
                                disabled={mutation.isPending}
                                onChange={(event) =>
                                    setFormValue(
                                        setForm,
                                        'amount',
                                        event.target.value,
                                    )
                                }
                            />
                        </LabeledField>
                        <LabeledField label="Currency">
                            <Input
                                value={form.currency}
                                disabled={mutation.isPending}
                                onChange={(event) =>
                                    setFormValue(
                                        setForm,
                                        'currency',
                                        event.target.value,
                                    )
                                }
                            />
                        </LabeledField>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <p className="text-sm font-medium">
                                Evidence photo required
                            </p>
                            <p className="text-muted-foreground text-xs">
                                Staff and PWA flows request evidence before
                                creating cases.
                            </p>
                        </div>
                        <Switch
                            checked={form.requiresPhoto}
                            disabled={mutation.isPending}
                            onCheckedChange={(checked) =>
                                setFormValue(setForm, 'requiresPhoto', checked)
                            }
                        />
                    </div>

                    <LabeledField label="Description">
                        <Input
                            value={form.description}
                            placeholder="Optional"
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setFormValue(
                                    setForm,
                                    'description',
                                    event.target.value,
                                )
                            }
                        />
                    </LabeledField>

                    {formError ? (
                        <p className="text-destructive text-sm">{formError}</p>
                    ) : null}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={mutation.isPending}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {rule ? 'Save Changes' : 'Create Rule'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function LabeledField({
    children,
    label,
}: {
    children: ReactNode;
    label: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function RuleSkeleton() {
    return Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index}>
            {Array.from({ length: 7 }).map((__, columnIndex) => (
                <TableCell key={columnIndex}>
                    <Skeleton className="h-5 w-full" />
                </TableCell>
            ))}
        </TableRow>
    ));
}

function setFormValue<K extends keyof PenaltyRuleDialogForm>(
    setForm: Dispatch<SetStateAction<PenaltyRuleDialogForm>>,
    key: K,
    value: PenaltyRuleDialogForm[K],
) {
    setForm((current) => ({ ...current, [key]: value }));
}

function validatePenaltyRuleForm(form: PenaltyRuleDialogForm) {
    if (!form.name.trim()) {
        return 'Rule name is required.';
    }

    if (form.scope === 'PARKING_OVERRIDE' && form.parkingId === TENANT_DEFAULT) {
        return 'Select a parking for parking override scope.';
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount < 0) {
        return 'Amount must be zero or greater.';
    }

    return '';
}

function buildPenaltyRulePayload(
    form: PenaltyRuleDialogForm,
): PenaltyRuleRequest {
    return {
        name: form.name.trim(),
        code: form.code.trim() || null,
        parkingId:
            form.scope === 'TENANT_DEFAULT' ? null : form.parkingId || null,
        type: form.type,
        amount: Number(form.amount),
        currency: form.currency.trim() || 'VND',
        requiresPhoto: form.requiresPhoto,
        description: form.description.trim() || null,
        status: form.status,
    };
}

function invalidatePenaltyRules(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({
        queryKey: managerPenaltyQueryKeys.rules,
    });
}
