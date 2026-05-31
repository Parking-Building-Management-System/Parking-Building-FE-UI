'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { getErrorMessage } from '@/features/admin/error-message';
import { PricingPreviewCalculator } from '@/features/manager/pricing-preview-calculator';
import {
    ALL_PARKINGS,
    ALL_STATUSES,
    ALL_VEHICLE_TYPES,
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    StatusBadge,
    TENANT_DEFAULT,
    formatMinutes,
    formatMoney,
    getRuleScope,
    getRuleVehicleLabel,
    getRuleVehicleTypeId,
} from '@/features/manager/pricing-shared';
import {
    listGlobalVehicleTypesApi,
    listParkingsApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';
import type { GlobalVehicleTypeResponse } from '@/service/manager/facility-type';
import {
    createPricingRuleApi,
    deletePricingRuleApi,
    listPricingRulesApi,
    managerPricingQueryKeys,
    updatePricingRuleApi,
    updatePricingRuleStatusApi,
} from '@/service/manager/pricing-api';
import {
    pricingRuleStatusValues,
    type PricingRuleListParams,
    type PricingRuleRequest,
    type PricingRuleResponse,
    type PricingRuleStatus,
} from '@/service/manager/pricing-type';

type PricingStatusFilter = PricingRuleStatus | typeof ALL_STATUSES;

interface PricingRuleDialogState {
    open: boolean;
    rule?: PricingRuleResponse;
}

export function PricingTimeRules() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [parkingId, setParkingId] = useState(ALL_PARKINGS);
    const [vehicleTypeId, setVehicleTypeId] = useState(ALL_VEHICLE_TYPES);
    const [status, setStatus] = useState<PricingStatusFilter>(ALL_STATUSES);
    const [page, setPage] = useState(DEFAULT_PAGE);
    const [dialog, setDialog] = useState<PricingRuleDialogState>({
        open: false,
    });

    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });
    const vehicleTypesQuery = useQuery({
        queryKey: managerFacilityQueryKeys.vehicleTypes,
        queryFn: listGlobalVehicleTypesApi,
    });
    const params = useMemo<PricingRuleListParams>(
        () => ({
            parkingId: parkingId === ALL_PARKINGS ? undefined : parkingId,
            vehicleTypeId:
                vehicleTypeId === ALL_VEHICLE_TYPES ? undefined : vehicleTypeId,
            status: status === ALL_STATUSES ? undefined : status,
            search: deferredSearch.trim() || undefined,
            page,
            size: DEFAULT_PAGE_SIZE,
        }),
        [deferredSearch, page, parkingId, status, vehicleTypeId],
    );
    const rulesQuery = useQuery({
        queryKey: managerPricingQueryKeys.ruleList(params),
        queryFn: () => listPricingRulesApi(params),
        placeholderData: keepPreviousData,
    });
    const statusMutation = useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string;
            status: PricingRuleStatus;
        }) => updatePricingRuleStatusApi(id, { status }),
        onSuccess: () => {
            toast.success('Pricing rule status updated.');
            invalidatePricingRules(queryClient);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update pricing rule status.'),
            );
        },
    });
    const deleteMutation = useMutation({
        mutationFn: deletePricingRuleApi,
        onSuccess: () => {
            toast.success('Pricing rule deleted.');
            invalidatePricingRules(queryClient);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to delete pricing rule.'),
            );
        },
    });

    useEffect(() => {
        if (rulesQuery.isError) {
            toast.error(
                getErrorMessage(
                    rulesQuery.error,
                    'Failed to load pricing rules.',
                ),
            );
        }
    }, [rulesQuery.error, rulesQuery.isError]);

    const rulesPage = rulesQuery.data;
    const rules = rulesPage?.content ?? [];
    const totalElements = rulesPage?.totalElements ?? 0;
    const normalizedPage = rulesPage?.page ?? page;
    const normalizedSize = rulesPage?.size ?? DEFAULT_PAGE_SIZE;
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
                        Time Rules
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        Configure tenant default and parking-specific pricing
                        rules used by checkout quotes.
                    </p>
                </div>
                <Button
                    disabled={vehicleTypesQuery.isLoading}
                    onClick={() => setDialog({ open: true })}
                >
                    <Plus data-icon="inline-start" />
                    Create Rule
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_180px]">
                    <div className="relative">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            className="pl-8"
                            placeholder="Search rules"
                            value={search}
                            onChange={(event) => {
                                setPage(DEFAULT_PAGE);
                                setSearch(event.target.value);
                            }}
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
                        value={vehicleTypeId}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setVehicleTypeId(value);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VEHICLE_TYPES}>
                                All vehicle types
                            </SelectItem>
                            {(vehicleTypesQuery.data ?? []).map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setStatus(value as PricingStatusFilter);
                        }}
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
                    <CardTitle>Pricing Rules</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        {totalElements.toLocaleString()} rules
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rule</TableHead>
                                <TableHead>Scope</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Free</TableHead>
                                <TableHead>First Block</TableHead>
                                <TableHead>Next Block</TableHead>
                                <TableHead>Daily Cap</TableHead>
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
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    {rule.name}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    Grace after payment:{' '}
                                                    {formatMinutes(
                                                        rule.graceMinutesAfterPayment,
                                                    )}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getRuleScope(rule)}</TableCell>
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
                                            <StatusBadge value={rule.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <RuleActions
                                                rule={rule}
                                                statusPending={
                                                    statusMutation.isPending &&
                                                    statusMutation.variables?.id ===
                                                        rule.id
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
                                                            `Delete pricing rule "${rule.name}"?`,
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
                            {!rulesQuery.isLoading && rulesQuery.isError && (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <p>
                                                Pricing rules could not be
                                                loaded.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    rulesQuery.refetch()
                                                }
                                            >
                                                Retry
                                            </Button>
                                        </div>
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
                                            <div className="flex flex-col items-center gap-3">
                                                <p>No pricing rules found.</p>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setDialog({
                                                            open: true,
                                                        })
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
                                    setPage((current) => Math.max(0, current - 1))
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
                                onClick={() => setPage((current) => current + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <PricingPreviewCalculator
                rules={rules}
                vehicleTypes={vehicleTypesQuery.data ?? []}
            />

            <PricingRuleDialog
                key={dialog.rule?.id ?? 'create'}
                open={dialog.open}
                rule={dialog.rule}
                parkings={parkingsQuery.data ?? []}
                vehicleTypes={vehicleTypesQuery.data ?? []}
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

function PricingRuleDialog({
    open,
    rule,
    parkings,
    vehicleTypes,
    onOpenChange,
}: {
    open: boolean;
    rule?: PricingRuleResponse;
    parkings: Array<{ id: string; name: string }>;
    vehicleTypes: GlobalVehicleTypeResponse[];
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const initialVehicleTypeId = rule
        ? getRuleVehicleTypeId(rule, vehicleTypes)
        : vehicleTypes[0]?.id ?? '';
    const [form, setForm] = useState<PricingRuleDialogForm>({
        name: rule?.name ?? '',
        parkingId: rule?.parkingId ?? TENANT_DEFAULT,
        vehicleTypeId: initialVehicleTypeId,
        freeMinutes: String(rule?.freeMinutes ?? 0),
        firstBlockMinutes: String(rule?.firstBlockMinutes ?? 60),
        firstBlockPrice: String(rule?.firstBlockPrice ?? 0),
        nextBlockMinutes: String(rule?.nextBlockMinutes ?? 30),
        nextBlockPrice: String(rule?.nextBlockPrice ?? 0),
        dailyCapPrice:
            typeof rule?.dailyCapPrice === 'number'
                ? String(rule.dailyCapPrice)
                : '',
        graceMinutesAfterPayment: String(rule?.graceMinutesAfterPayment ?? 15),
        status: rule?.status ?? 'ACTIVE',
    });
    const [formError, setFormError] = useState('');
    const mutation = useMutation({
        mutationFn: () => {
            const payload = buildPricingRulePayload(form);
            return rule
                ? updatePricingRuleApi(rule.id, payload)
                : createPricingRuleApi(payload);
        },
        onSuccess: () => {
            toast.success(rule ? 'Pricing rule updated.' : 'Pricing rule created.');
            invalidatePricingRules(queryClient);
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(
                    error,
                    rule
                        ? 'Failed to update pricing rule.'
                        : 'Failed to create pricing rule.',
                ),
            );
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {rule ? 'Edit pricing rule' : 'Create pricing rule'}
                    </DialogTitle>
                    <DialogDescription>
                        Rules are tenant-scoped. Tenant id is never sent by the
                        frontend.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const validationError = validatePricingRuleForm(form);

                        if (validationError) {
                            setFormError(validationError);
                            return;
                        }

                        setFormError('');
                        mutation.mutate();
                    }}
                >
                    <div className="grid gap-3 md:grid-cols-2">
                        <Input
                            placeholder="Rule name"
                            value={form.name}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setFormValue(setForm, 'name', event.target.value)
                            }
                        />
                        <Select
                            value={form.status}
                            disabled={mutation.isPending}
                            onValueChange={(value) =>
                                setFormValue(setForm, 'status', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {pricingRuleStatusValues.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={form.parkingId}
                            disabled={mutation.isPending}
                            onValueChange={(value) =>
                                setFormValue(setForm, 'parkingId', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Parking scope" />
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
                        <Select
                            value={form.vehicleTypeId}
                            disabled={
                                mutation.isPending || vehicleTypes.length === 0
                            }
                            onValueChange={(value) =>
                                setFormValue(setForm, 'vehicleTypeId', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vehicle type" />
                            </SelectTrigger>
                            <SelectContent>
                                {vehicleTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <Input
                            type="number"
                            min={0}
                            placeholder="Free minutes"
                            value={form.freeMinutes}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setFormValue(
                                    setForm,
                                    'freeMinutes',
                                    event.target.value,
                                )
                            }
                        />
                        <Input
                            type="number"
                            min={1}
                            placeholder="First block minutes"
                            value={form.firstBlockMinutes}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setFormValue(
                                    setForm,
                                    'firstBlockMinutes',
                                    event.target.value,
                                )
                            }
                        />
                        <Input
                            type="number"
                            min={0}
                            placeholder="First block price"
                            value={form.firstBlockPrice}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setFormValue(
                                    setForm,
                                    'firstBlockPrice',
                                    event.target.value,
                                )
                            }
                        />
                        <Input
                            type="number"
                            min={1}
                            placeholder="Next block minutes"
                            value={form.nextBlockMinutes}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setFormValue(
                                    setForm,
                                    'nextBlockMinutes',
                                    event.target.value,
                                )
                            }
                        />
                        <Input
                            type="number"
                            min={0}
                            placeholder="Next block price"
                            value={form.nextBlockPrice}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setFormValue(
                                    setForm,
                                    'nextBlockPrice',
                                    event.target.value,
                                )
                            }
                        />
                        <Input
                            type="number"
                            min={0}
                            placeholder="Daily cap price"
                            value={form.dailyCapPrice}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setFormValue(
                                    setForm,
                                    'dailyCapPrice',
                                    event.target.value,
                                )
                            }
                        />
                        <Input
                            type="number"
                            min={0}
                            placeholder="Grace minutes after payment"
                            value={form.graceMinutesAfterPayment}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setFormValue(
                                    setForm,
                                    'graceMinutesAfterPayment',
                                    event.target.value,
                                )
                            }
                        />
                    </div>
                    {vehicleTypes.length === 0 && (
                        <p className="text-muted-foreground rounded-lg border p-3 text-xs">
                            Active vehicle types are required before creating a
                            pricing rule.
                        </p>
                    )}
                    {formError && (
                        <p className="text-destructive rounded-lg border p-3 text-xs">
                            {formError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={mutation.isPending || vehicleTypes.length === 0}
                        >
                            {mutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RuleActions({
    rule,
    statusPending,
    deletePending,
    onEdit,
    onStatusChange,
    onDelete,
}: {
    rule: PricingRuleResponse;
    statusPending: boolean;
    deletePending: boolean;
    onEdit: () => void;
    onStatusChange: (status: PricingRuleStatus) => void;
    onDelete: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={statusPending || deletePending}
                >
                    <MoreHorizontal />
                    <span className="sr-only">Pricing rule actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    <Pencil />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {pricingRuleStatusValues.map((status) => (
                    <DropdownMenuItem
                        key={status}
                        disabled={status === rule.status}
                        onClick={() => onStatusChange(status)}
                    >
                        Mark {status}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2 />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function RuleSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell colSpan={9}>
                        <Skeleton className="h-6 w-full" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

function buildPricingRulePayload(
    form: PricingRuleDialogForm,
): PricingRuleRequest {
    return {
        name: form.name.trim(),
        parkingId: form.parkingId === TENANT_DEFAULT ? null : form.parkingId,
        vehicleTypeId: form.vehicleTypeId,
        freeMinutes: Number(form.freeMinutes),
        firstBlockMinutes: Number(form.firstBlockMinutes),
        firstBlockPrice: Number(form.firstBlockPrice),
        nextBlockMinutes: Number(form.nextBlockMinutes),
        nextBlockPrice: Number(form.nextBlockPrice),
        dailyCapPrice: form.dailyCapPrice.trim()
            ? Number(form.dailyCapPrice)
            : null,
        graceMinutesAfterPayment: Number(form.graceMinutesAfterPayment),
        status: form.status as PricingRuleStatus,
    };
}

interface PricingRuleDialogForm {
    name: string;
    parkingId: string;
    vehicleTypeId: string;
    freeMinutes: string;
    firstBlockMinutes: string;
    firstBlockPrice: string;
    nextBlockMinutes: string;
    nextBlockPrice: string;
    dailyCapPrice: string;
    graceMinutesAfterPayment: string;
    status: string;
}

function validatePricingRuleForm(form: PricingRuleDialogForm) {
    if (!form.name.trim()) {
        return 'Rule name is required.';
    }

    if (!form.vehicleTypeId) {
        return 'Vehicle type is required.';
    }

    const numericFields: Array<[keyof PricingRuleDialogForm, string, number]> = [
        ['freeMinutes', 'Free minutes', 0],
        ['firstBlockMinutes', 'First block minutes', 1],
        ['firstBlockPrice', 'First block price', 0],
        ['nextBlockMinutes', 'Next block minutes', 1],
        ['nextBlockPrice', 'Next block price', 0],
        ['graceMinutesAfterPayment', 'Grace minutes after payment', 0],
    ];

    for (const [field, label, min] of numericFields) {
        const value = Number(form[field]);

        if (!Number.isFinite(value) || value < min) {
            return `${label} must be at least ${min}.`;
        }
    }

    if (form.dailyCapPrice.trim()) {
        const dailyCapPrice = Number(form.dailyCapPrice);

        if (!Number.isFinite(dailyCapPrice) || dailyCapPrice < 0) {
            return 'Daily cap price must be at least 0.';
        }
    }

    return '';
}

function setFormValue(
    setForm: Dispatch<SetStateAction<PricingRuleDialogForm>>,
    key: keyof PricingRuleDialogForm,
    value: string,
) {
    setForm((current) => ({ ...current, [key]: value }));
}

function invalidatePricingRules(
    queryClient: ReturnType<typeof useQueryClient>,
) {
    queryClient.invalidateQueries({
        queryKey: managerPricingQueryKeys.rules,
    });
}
