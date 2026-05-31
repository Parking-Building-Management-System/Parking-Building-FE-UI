'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
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
import {
    listParkingsApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';
import {
    assignManagerKioskStaffApi,
    createManagerKioskApi,
    deleteManagerKioskApi,
    listManagerKioskStaffApi,
    listManagerKiosksApi,
    managerKioskDeviceQueryKeys,
    removeManagerKioskStaffApi,
    updateManagerKioskApi,
    updateManagerKioskStatusApi,
} from '@/service/manager/kiosk-device-api';
import {
    kioskStatusValues,
    kioskTypeValues,
    type CreateKioskRequest,
    type KioskItem,
    type KioskStatus,
    type KioskType,
    type UpdateKioskRequest,
} from '@/service/manager/kiosk-device-type';
import { listManagerStaffApi, managerStaffQueryKeys } from '@/service/manager/staff-api';

const ALL_PARKINGS = 'ALL_PARKINGS';
const ALL_TYPES = 'ALL_TYPES';
const ALL_STATUSES = 'ALL_STATUSES';

interface KioskDialogState {
    open: boolean;
    kiosk?: KioskItem;
}

export function KioskManagement() {
    const queryClient = useQueryClient();
    const [parkingFilter, setParkingFilter] = useState(ALL_PARKINGS);
    const [typeFilter, setTypeFilter] = useState<KioskType | typeof ALL_TYPES>(
        ALL_TYPES,
    );
    const [statusFilter, setStatusFilter] = useState<
        KioskStatus | typeof ALL_STATUSES
    >(ALL_STATUSES);
    const [dialog, setDialog] = useState<KioskDialogState>({ open: false });
    const [assignmentKiosk, setAssignmentKiosk] = useState<KioskItem | undefined>();

    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });
    const kioskParams = useMemo(
        () => ({
            parkingId:
                parkingFilter === ALL_PARKINGS ? undefined : parkingFilter,
            type: typeFilter === ALL_TYPES ? undefined : typeFilter,
            status: statusFilter === ALL_STATUSES ? undefined : statusFilter,
        }),
        [parkingFilter, statusFilter, typeFilter],
    );
    const kiosksQuery = useQuery({
        queryKey: managerKioskDeviceQueryKeys.kioskList(kioskParams),
        queryFn: () => listManagerKiosksApi(kioskParams),
        retry: false,
    });

    const statusMutation = useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string;
            status: KioskStatus;
        }) => updateManagerKioskStatusApi(id, { status }),
        onSuccess: () => {
            toast.success('Kiosk status updated.');
            queryClient.invalidateQueries({
                queryKey: managerKioskDeviceQueryKeys.kiosks,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to update kiosk status.'));
        },
    });
    const deleteMutation = useMutation({
        mutationFn: deleteManagerKioskApi,
        onSuccess: () => {
            toast.success('Kiosk deleted.');
            queryClient.invalidateQueries({
                queryKey: managerKioskDeviceQueryKeys.kiosks,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to delete kiosk.'));
        },
    });

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Kiosks / Gates
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        Create entry/exit kiosks under manager parkings and
                        assign tenant staff to operate them.
                    </p>
                </div>
                <Button
                    onClick={() => setDialog({ open: true })}
                    disabled={parkingsQuery.isLoading}
                >
                    <Plus data-icon="inline-start" />
                    Create Kiosk
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    <Select value={parkingFilter} onValueChange={setParkingFilter}>
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
                        value={typeFilter}
                        onValueChange={(value) =>
                            setTypeFilter(value as KioskType | typeof ALL_TYPES)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_TYPES}>All types</SelectItem>
                            {kioskTypeValues.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) =>
                            setStatusFilter(
                                value as KioskStatus | typeof ALL_STATUSES,
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES}>
                                All statuses
                            </SelectItem>
                            {kioskStatusValues.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Kiosk List</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        {(kiosksQuery.data?.length ?? 0).toLocaleString()} kiosks
                    </p>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kiosk</TableHead>
                                <TableHead>Parking</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assigned Staff</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {kiosksQuery.isLoading && <KioskSkeleton />}
                            {!kiosksQuery.isLoading &&
                                (kiosksQuery.data ?? []).map((kiosk) => (
                                    <TableRow key={kiosk.id}>
                                        <TableCell className="min-w-56">
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    {kiosk.name}
                                                </p>
                                                <p className="text-muted-foreground max-w-64 truncate text-xs">
                                                    {kiosk.code || kiosk.id}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {kiosk.parkingName || kiosk.parkingId}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge value={kiosk.type} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge value={kiosk.status} />
                                        </TableCell>
                                        <TableCell>
                                            {formatAssignedStaffCount(kiosk)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <KioskActionsMenu
                                                kiosk={kiosk}
                                                statusPending={
                                                    statusMutation.isPending &&
                                                    statusMutation.variables?.id ===
                                                        kiosk.id
                                                }
                                                deletePending={
                                                    deleteMutation.isPending &&
                                                    deleteMutation.variables ===
                                                        kiosk.id
                                                }
                                                onEdit={() =>
                                                    setDialog({
                                                        open: true,
                                                        kiosk,
                                                    })
                                                }
                                                onAssign={() =>
                                                    setAssignmentKiosk(kiosk)
                                                }
                                                onStatusChange={(status) =>
                                                    statusMutation.mutate({
                                                        id: kiosk.id,
                                                        status,
                                                    })
                                                }
                                                onDelete={() => {
                                                    if (
                                                        window.confirm(
                                                            `Delete kiosk "${kiosk.name}"?`,
                                                        )
                                                    ) {
                                                        deleteMutation.mutate(
                                                            kiosk.id,
                                                        );
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!kiosksQuery.isLoading && kiosksQuery.isError && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <p>Kiosk API could not be loaded.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => kiosksQuery.refetch()}
                                            >
                                                Retry
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {!kiosksQuery.isLoading &&
                                !kiosksQuery.isError &&
                                (kiosksQuery.data?.length ?? 0) === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-muted-foreground h-28 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <p>No kiosks yet.</p>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setDialog({
                                                            open: true,
                                                        })
                                                    }
                                                >
                                                    <Plus data-icon="inline-start" />
                                                    Create Kiosk
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <KioskDialog
                key={dialog.kiosk?.id ?? 'create'}
                open={dialog.open}
                kiosk={dialog.kiosk}
                parkings={parkingsQuery.data ?? []}
                onOpenChange={(open) =>
                    setDialog((current) => ({
                        ...current,
                        open,
                        kiosk: open ? current.kiosk : undefined,
                    }))
                }
            />
            <KioskStaffDialog
                kiosk={assignmentKiosk}
                onOpenChange={(open) => {
                    if (!open) {
                        setAssignmentKiosk(undefined);
                    }
                }}
            />
        </div>
    );
}

function KioskDialog({
    open,
    kiosk,
    parkings,
    onOpenChange,
}: {
    open: boolean;
    kiosk?: KioskItem;
    parkings: { id: string; name: string }[];
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<CreateKioskRequest | UpdateKioskRequest>(
        kiosk
            ? {
                  name: kiosk.name,
                  type: kiosk.type,
                  status: kiosk.status,
              }
            : {
                  parkingId: parkings[0]?.id ?? '',
                  name: '',
                  type: 'ENTRY',
                  status: 'ACTIVE',
              },
    );
    const mutation = useMutation({
        mutationFn: () =>
            kiosk
                ? updateManagerKioskApi(kiosk.id, form as UpdateKioskRequest)
                : createManagerKioskApi(form as CreateKioskRequest),
        onSuccess: () => {
            toast.success(kiosk ? 'Kiosk updated.' : 'Kiosk created.');
            queryClient.invalidateQueries({
                queryKey: managerKioskDeviceQueryKeys.kiosks,
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(
                    error,
                    kiosk ? 'Failed to update kiosk.' : 'Failed to create kiosk.',
                ),
            );
        },
    });
    const canSubmit =
        form.name.trim().length > 0 && (kiosk || !!(form as CreateKioskRequest).parkingId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {kiosk ? 'Edit kiosk' : 'Create kiosk'}
                    </DialogTitle>
                    <DialogDescription>
                        Kiosks are manager-scoped through their parking. Tenant
                        id is never sent by the frontend.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        mutation.mutate();
                    }}
                >
                    {!kiosk && (
                        <Select
                            value={(form as CreateKioskRequest).parkingId}
                            disabled={mutation.isPending || parkings.length === 0}
                            onValueChange={(parkingId) =>
                                setForm((current) => ({
                                    ...current,
                                    parkingId,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Parking" />
                            </SelectTrigger>
                            <SelectContent>
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
                    )}
                    <Input
                        placeholder="Kiosk name"
                        value={form.name}
                        disabled={mutation.isPending}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                name: event.target.value,
                            }))
                        }
                    />
                    <Select
                        value={form.type}
                        disabled={mutation.isPending}
                        onValueChange={(type) =>
                            setForm((current) => ({
                                ...current,
                                type: type as KioskType,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {kioskTypeValues.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={form.status ?? 'ACTIVE'}
                        disabled={mutation.isPending}
                        onValueChange={(status) =>
                            setForm((current) => ({
                                ...current,
                                status: status as KioskStatus,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {kioskStatusValues.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {parkings.length === 0 && !kiosk && (
                        <p className="text-muted-foreground rounded-lg border p-3 text-xs">
                            Create a parking before creating kiosks.
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={mutation.isPending || !canSubmit}
                        >
                            {mutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function KioskStaffDialog({
    kiosk,
    onOpenChange,
}: {
    kiosk?: KioskItem;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [staffId, setStaffId] = useState('');
    const assignedQuery = useQuery({
        queryKey: managerKioskDeviceQueryKeys.kioskStaff(kiosk?.id ?? ''),
        queryFn: () => listManagerKioskStaffApi(kiosk?.id ?? ''),
        enabled: !!kiosk,
        retry: false,
    });
    const staffQuery = useQuery({
        queryKey: managerStaffQueryKeys.staffList({
            status: 'ACTIVE',
            page: 0,
            size: 100,
        }),
        queryFn: () =>
            listManagerStaffApi({ status: 'ACTIVE', page: 0, size: 100 }),
    });
    const assignedIds = new Set(
        (assignedQuery.data ?? []).map(
            (staff) => staff.staffId ?? staff.staffUserId ?? staff.userId ?? staff.id,
        ),
    );
    const availableStaff = (staffQuery.data?.content ?? []).filter(
        (staff) => !assignedIds.has(staff.id),
    );
    const assignMutation = useMutation({
        mutationFn: () => assignManagerKioskStaffApi(kiosk?.id ?? '', staffId),
        onSuccess: () => {
            toast.success('Staff assigned to kiosk.');
            setStaffId('');
            invalidateKioskAssignments(queryClient, kiosk?.id);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to assign staff.'));
        },
    });
    const removeMutation = useMutation({
        mutationFn: (id: string) =>
            removeManagerKioskStaffApi(kiosk?.id ?? '', id),
        onSuccess: () => {
            toast.success('Staff removed from kiosk.');
            invalidateKioskAssignments(queryClient, kiosk?.id);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to remove staff.'));
        },
    });

    return (
        <Dialog open={!!kiosk} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Assign staff</DialogTitle>
                    <DialogDescription>
                        {kiosk?.name} can only be operated by assigned tenant
                        staff.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                        <Select
                            value={staffId}
                            disabled={
                                assignMutation.isPending ||
                                availableStaff.length === 0
                            }
                            onValueChange={setStaffId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select active staff" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStaff.map((staff) => (
                                    <SelectItem key={staff.id} value={staff.id}>
                                        {staff.fullName || staff.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            disabled={!staffId || assignMutation.isPending}
                            onClick={() => assignMutation.mutate()}
                        >
                            <UserPlus data-icon="inline-start" />
                            Assign
                        </Button>
                    </div>

                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedQuery.isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!assignedQuery.isLoading &&
                                    (assignedQuery.data ?? []).map((staff) => {
                                        const id =
                                            staff.staffId ??
                                            staff.staffUserId ??
                                            staff.userId ??
                                            staff.id ??
                                            '';

                                        return (
                                            <TableRow key={id || staff.username}>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-medium">
                                                            {staff.fullName ||
                                                                staff.username}
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {staff.username}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {staff.phone || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={
                                                            removeMutation.isPending ||
                                                            !id
                                                        }
                                                        onClick={() =>
                                                            removeMutation.mutate(id)
                                                        }
                                                    >
                                                        <X data-icon="inline-start" />
                                                        Remove
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                {!assignedQuery.isLoading &&
                                    !assignedQuery.isError &&
                                    (assignedQuery.data?.length ?? 0) === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                className="text-muted-foreground h-20 text-center"
                                            >
                                                No staff assigned.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                {!assignedQuery.isLoading &&
                                    assignedQuery.isError && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                className="text-muted-foreground h-20 text-center"
                                            >
                                                Kiosk staff assignment API could
                                                not be loaded.
                                            </TableCell>
                                        </TableRow>
                                    )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function KioskActionsMenu({
    kiosk,
    statusPending,
    deletePending,
    onEdit,
    onAssign,
    onStatusChange,
    onDelete,
}: {
    kiosk: KioskItem;
    statusPending: boolean;
    deletePending: boolean;
    onEdit: () => void;
    onAssign: () => void;
    onStatusChange: (status: KioskStatus) => void;
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
                    <span className="sr-only">Kiosk actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    <Pencil />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAssign}>
                    <UserPlus />
                    Assign Staff
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {kioskStatusValues.map((status) => (
                    <DropdownMenuItem
                        key={status}
                        disabled={status === kiosk.status}
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

function invalidateKioskAssignments(
    queryClient: ReturnType<typeof useQueryClient>,
    kioskId?: string,
) {
    queryClient.invalidateQueries({
        queryKey: managerKioskDeviceQueryKeys.kiosks,
        refetchType: 'active',
    });

    if (kioskId) {
        queryClient.invalidateQueries({
            queryKey: managerKioskDeviceQueryKeys.kioskStaff(kioskId),
            refetchType: 'active',
        });
    }
}

function formatAssignedStaffCount(kiosk: KioskItem) {
    if (typeof kiosk.assignedStaffCount === 'number') {
        return kiosk.assignedStaffCount.toLocaleString();
    }

    if (typeof kiosk.staffCount === 'number') {
        return kiosk.staffCount.toLocaleString();
    }

    return '—';
}

function StatusBadge({ value }: { value: string }) {
    return (
        <span className="bg-muted inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
            {value}
        </span>
    );
}

function KioskSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}
