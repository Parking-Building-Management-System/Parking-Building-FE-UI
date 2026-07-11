'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    bulkUpdateSlotStatusApi,
    createSlotApi,
    deleteSlotApi,
    listFloorsApi,
    listParkingsApi,
    listSlotsApi,
    listZonesApi,
    managerFacilityQueryKeys,
    updateSlotApi,
    updateSlotStatusApi,
} from '@/service/manager/facility-api';
import {
    slotBulkStatusValues,
    slotStatusValues,
    type SlotBulkStatus,
    type SlotRequest,
    type SlotResponse,
    type SlotSearchParams,
    type SlotStatus,
} from '@/service/manager/facility-type';
import { EmptyState, FacilityHeader, SimpleSkeleton } from './floor-management';

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;
const ALL_STATUSES = 'ALL_STATUSES';
const ALL_FLOORS = 'ALL_FLOORS';
const ALL_ZONES = 'ALL_ZONES';
const SLOT_PAGE_SIZES = [10, 20, 50, 100] as const;

type SlotStatusFilter = SlotStatus | typeof ALL_STATUSES;

interface SlotDialogState {
    open: boolean;
    slot?: SlotResponse;
}

export function SlotManagement() {
    const queryClient = useQueryClient();
    const [parkingId, setParkingId] = useState('');
    const [floorId, setFloorId] = useState(ALL_FLOORS);
    const [zoneId, setZoneId] = useState(ALL_ZONES);
    const [slotCode, setSlotCode] = useState('');
    const [status, setStatus] = useState<SlotStatusFilter>(ALL_STATUSES);
    const [exact, setExact] = useState(false);
    const [page, setPage] = useState(DEFAULT_PAGE);
    const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [dialog, setDialog] = useState<SlotDialogState>({ open: false });
    const deferredSlotCode = useDeferredValue(slotCode);

    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });
    const activeParkingId = parkingId || parkingsQuery.data?.[0]?.id || '';
    const floorsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.floors(activeParkingId),
        queryFn: () => listFloorsApi(activeParkingId),
        enabled: !!activeParkingId,
    });
    const selectedFloorId = floorId === ALL_FLOORS ? '' : floorId;
    const zonesQuery = useQuery({
        queryKey: managerFacilityQueryKeys.zones(selectedFloorId),
        queryFn: () => listZonesApi(selectedFloorId),
        enabled: !!selectedFloorId,
    });

    const queryParams = useMemo<SlotSearchParams>(
        () => ({
            parkingId: activeParkingId || undefined,
            floorId: selectedFloorId || undefined,
            page,
            size,
            zoneId: zoneId === ALL_ZONES ? undefined : zoneId,
            status: status === ALL_STATUSES ? undefined : status,
            slotCode: deferredSlotCode.trim() || undefined,
            exact: deferredSlotCode.trim() ? exact : undefined,
        }),
        [
            activeParkingId,
            deferredSlotCode,
            exact,
            page,
            selectedFloorId,
            size,
            status,
            zoneId,
        ],
    );

    const {
        data: slotPage,
        error,
        isError,
        isFetching,
        isLoading,
    } = useQuery({
        queryKey: managerFacilityQueryKeys.slotList(queryParams),
        queryFn: () => listSlotsApi(queryParams),
        placeholderData: keepPreviousData,
    });

    const bulkMutation = useMutation({
        mutationFn: bulkUpdateSlotStatusApi,
        onSuccess: (result) => {
            toast.success(
                `${result.updatedCount.toLocaleString()} slots updated to ${
                    result.newStatus
                }.`,
            );
            setSelectedIds([]);
            invalidateSlots(queryClient);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update slot statuses.'),
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSlotApi,
        onSuccess: () => {
            toast.success('Slot deleted.');
            invalidateSlots(queryClient);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to delete slot.'));
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: SlotStatus }) =>
            updateSlotStatusApi(id, { status }),
        onSuccess: () => {
            toast.success('Slot status updated.');
            invalidateSlots(queryClient);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update slot status.'),
            );
        },
    });

    useEffect(() => {
        if (isError) {
            toast.error(getErrorMessage(error, 'Failed to load slots.'));
        }
    }, [error, isError]);

    const slots = useMemo(() => slotPage?.content ?? [], [slotPage?.content]);
    const visibleSlotIds = useMemo(() => slots.map((slot) => slot.id), [slots]);
    const allVisibleSelected =
        visibleSlotIds.length > 0 &&
        visibleSlotIds.every((slotId) => selectedIds.includes(slotId));
    const someVisibleSelected =
        !allVisibleSelected &&
        visibleSlotIds.some((slotId) => selectedIds.includes(slotId));
    const totalElements = slotPage?.totalElements ?? 0;
    const totalPages = slotPage?.totalPages ?? 0;
    const canGoPrevious = page > 0;
    const canGoNext = totalPages > 0 && page + 1 < totalPages;
    const zones = zonesQuery.data ?? [];
    const selectedZone = zones.find((zone) => zone.id === zoneId);
    const selectedZoneIsFull =
        !!selectedZone && selectedZone.slotCount >= selectedZone.capacity;

    const toggleSlot = (slotId: string, checked: boolean) => {
        setSelectedIds((current) =>
            checked
                ? [...new Set([...current, slotId])]
                : current.filter((id) => id !== slotId),
        );
    };

    const toggleVisible = (checked: boolean) => {
        setSelectedIds((current) => {
            if (checked) {
                return [...new Set([...current, ...visibleSlotIds])];
            }

            return current.filter((id) => !visibleSlotIds.includes(id));
        });
    };

    const runBulkStatusUpdate = (newStatus: SlotBulkStatus) => {
        if (selectedIds.length === 0) {
            return;
        }

        bulkMutation.mutate({
            slotIds: selectedIds,
            newStatus,
        });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <FacilityHeader
                    title="Slots"
                    description="Search tenant slots, create slots under a zone, and update individual or bulk statuses."
                />
                <Button
                    disabled={zoneId === ALL_ZONES || selectedZoneIsFull}
                    onClick={() => setDialog({ open: true })}
                >
                    <Plus data-icon="inline-start" />
                    Create Slot
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
                    <Select
                        value={activeParkingId}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setSelectedIds([]);
                            setParkingId(value);
                            setFloorId(ALL_FLOORS);
                            setZoneId(ALL_ZONES);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Parking" />
                        </SelectTrigger>
                        <SelectContent>
                            {(parkingsQuery.data ?? []).map((parking) => (
                                <SelectItem key={parking.id} value={parking.id}>
                                    {parking.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={floorId}
                        disabled={!activeParkingId || floorsQuery.isLoading}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setSelectedIds([]);
                            setFloorId(value);
                            setZoneId(ALL_ZONES);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Floor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FLOORS}>
                                All floors
                            </SelectItem>
                            {(floorsQuery.data ?? []).map((floor) => (
                                <SelectItem key={floor.id} value={floor.id}>
                                    {floor.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={zoneId}
                        disabled={!selectedFloorId || zonesQuery.isLoading}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setSelectedIds([]);
                            setZoneId(value);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Zone" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_ZONES}>All zones</SelectItem>
                            {zones.map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>
                                    {zone.name} ({zone.slotCount}/{zone.capacity})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setSelectedIds([]);
                            setStatus(value as SlotStatusFilter);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES}>
                                All statuses
                            </SelectItem>
                            {slotStatusValues.map((slotStatus) => (
                                <SelectItem key={slotStatus} value={slotStatus}>
                                    {slotStatus}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            className="pl-8"
                            placeholder="Search code"
                            value={slotCode}
                            onChange={(event) => {
                                setPage(DEFAULT_PAGE);
                                setSelectedIds([]);
                                setSlotCode(event.target.value);
                            }}
                        />
                    </div>
                    <label className="border-input bg-background flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm shadow-xs">
                        <Checkbox
                            checked={exact}
                            onCheckedChange={(checked) => {
                                setPage(DEFAULT_PAGE);
                                setSelectedIds([]);
                                setExact(checked === true);
                            }}
                            aria-label="Exact slot code match"
                        />
                        Exact
                    </label>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle>Slots</CardTitle>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {selectedIds.length.toLocaleString()} selected ·{' '}
                            {totalElements.toLocaleString()} total
                            {isFetching && !isLoading ? ' · Refreshing' : ''}
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={
                                    selectedIds.length === 0 ||
                                    bulkMutation.isPending
                                }
                            >
                                <MoreHorizontal data-icon="inline-start" />
                                Bulk Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {slotBulkStatusValues.map((bulkStatus) => (
                                <DropdownMenuItem
                                    key={bulkStatus}
                                    onClick={() =>
                                        runBulkStatusUpdate(bulkStatus)
                                    }
                                >
                                    {bulkStatus === 'AVAILABLE' ? (
                                        <CheckCircle2 />
                                    ) : (
                                        <Wrench />
                                    )}
                                    Mark {bulkStatus}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={
                                            allVisibleSelected ||
                                            (someVisibleSelected
                                                ? 'indeterminate'
                                                : false)
                                        }
                                        onCheckedChange={(checked) =>
                                            toggleVisible(checked === true)
                                        }
                                        aria-label="Select visible slots"
                                    />
                                </TableHead>
                                <TableHead>Slot Code</TableHead>
                                <TableHead>Slot Number</TableHead>
                                <TableHead>Parking</TableHead>
                                <TableHead>Floor</TableHead>
                                <TableHead>Zone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <SimpleSkeleton colSpan={8} />}

                            {!isLoading &&
                                slots.map((slot) => (
                                    <SlotTableRow
                                        key={slot.id}
                                        slot={slot}
                                        selected={selectedIds.includes(slot.id)}
                                        statusPending={
                                            statusMutation.isPending &&
                                            statusMutation.variables?.id ===
                                                slot.id
                                        }
                                        deletePending={
                                            deleteMutation.isPending &&
                                            deleteMutation.variables === slot.id
                                        }
                                        onSelectedChange={(checked) =>
                                            toggleSlot(slot.id, checked)
                                        }
                                        onEdit={() =>
                                            setDialog({ open: true, slot })
                                        }
                                        onDelete={() =>
                                            deleteMutation.mutate(slot.id)
                                        }
                                        onStatus={(newStatus) =>
                                            statusMutation.mutate({
                                                id: slot.id,
                                                status: newStatus,
                                            })
                                        }
                                    />
                                ))}

                            {!isLoading && slots.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        No slots found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-muted-foreground text-sm">
                            Page {totalPages === 0 ? 0 : page + 1} of{' '}
                            {totalPages.toLocaleString()}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={String(size)}
                                onValueChange={(value) => {
                                    setPage(DEFAULT_PAGE);
                                    setSize(Number(value));
                                }}
                            >
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SLOT_PAGE_SIZES.map((pageSize) => (
                                        <SelectItem
                                            key={pageSize}
                                            value={String(pageSize)}
                                        >
                                            {pageSize} / page
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                    setPage((current) =>
                                        Math.max(DEFAULT_PAGE, current - 1),
                                    )
                                }
                                disabled={!canGoPrevious || isFetching}
                                aria-label="Previous page"
                            >
                                <ChevronLeft />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                                disabled={!canGoNext || isFetching}
                                aria-label="Next page"
                            >
                                <ChevronRight />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <SlotDialog
                key={dialog.slot?.id ?? 'create'}
                open={dialog.open}
                slot={dialog.slot}
                zoneId={zoneId === ALL_ZONES ? '' : zoneId}
                zone={selectedZone}
                onOpenChange={(open) =>
                    setDialog((current) => ({
                        ...current,
                        open,
                        slot: open ? current.slot : undefined,
                    }))
                }
            />
        </div>
    );
}

function SlotTableRow({
    slot,
    selected,
    statusPending,
    deletePending,
    onSelectedChange,
    onEdit,
    onDelete,
    onStatus,
}: {
    slot: SlotResponse;
    selected: boolean;
    statusPending: boolean;
    deletePending: boolean;
    onSelectedChange: (checked: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
    onStatus: (status: SlotStatus) => void;
}) {
    return (
        <TableRow data-state={selected ? 'selected' : undefined}>
            <TableCell>
                <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) =>
                        onSelectedChange(checked === true)
                    }
                    aria-label={`Select slot ${slot.code}`}
                />
            </TableCell>
            <TableCell className="font-medium">{slot.code}</TableCell>
            <TableCell>{slot.slotNumber}</TableCell>
            <TableCell>{slot.parkingName}</TableCell>
            <TableCell>{slot.floorName ?? '-'}</TableCell>
            <TableCell>{slot.zoneName}</TableCell>
            <TableCell>
                <span
                    className={cn(
                        'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                        getSlotStatusClass(slot.status),
                    )}
                >
                    {slot.status}
                </span>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onEdit}>
                        <Pencil data-icon="inline-start" />
                        Edit
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                disabled={statusPending}
                            >
                                <MoreHorizontal />
                                <span className="sr-only">Slot actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {slotStatusValues.map((status) => (
                                <DropdownMenuItem
                                    key={status}
                                    disabled={status === slot.status}
                                    onClick={() => onStatus(status)}
                                >
                                    Mark {status}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletePending}
                        onClick={onDelete}
                    >
                        <Trash2 data-icon="inline-start" />
                        Delete
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

function SlotDialog({
    open,
    slot,
    zoneId,
    zone,
    onOpenChange,
}: {
    open: boolean;
    slot?: SlotResponse;
    zoneId: string;
    zone?: { name: string; capacity: number; slotCount: number };
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<SlotRequest>({
        code: slot?.code ?? '',
        slotNumber: slot?.slotNumber ?? '',
        status: slot?.status ?? 'AVAILABLE',
    });

    const mutation = useMutation({
        mutationFn: () =>
            slot ? updateSlotApi(slot.id, form) : createSlotApi(zoneId, form),
        onSuccess: () => {
            toast.success(slot ? 'Slot updated.' : 'Slot created.');
            invalidateSlots(queryClient);
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(
                    error,
                    slot ? 'Failed to update slot.' : 'Failed to create slot.',
                ),
            );
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {slot ? 'Edit slot' : 'Create slot'}
                    </DialogTitle>
                    <DialogDescription>
                        {slot
                            ? 'Slot updates keep the existing backend parent relationships.'
                            : zone
                              ? `${zone.name}: ${zone.slotCount}/${zone.capacity} slots in use.`
                              : 'Create uses the selected zone.'}
                    </DialogDescription>
                </DialogHeader>
                {!slot && !zoneId ? (
                    <EmptyState message="Select a specific zone before creating a slot." />
                ) : (
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            mutation.mutate();
                        }}
                    >
                        <Input
                            placeholder="Slot code"
                            value={form.code}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    code: event.target.value,
                                }))
                            }
                        />
                        <Input
                            placeholder="Slot number"
                            value={form.slotNumber}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    slotNumber: event.target.value,
                                }))
                            }
                        />
                        <Select
                            value={form.status ?? 'AVAILABLE'}
                            disabled={mutation.isPending}
                            onValueChange={(value) =>
                                setForm((current) => ({
                                    ...current,
                                    status: value as SlotStatus,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {slotStatusValues.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DialogFooter>
                        <Button
                            type="submit"
                            disabled={
                                mutation.isPending ||
                                (!slot &&
                                    !!zone &&
                                    zone.slotCount >= zone.capacity)
                            }
                        >
                                {mutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function getSlotStatusClass(status: SlotStatus) {
    switch (status) {
        case 'AVAILABLE':
            return 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300';
        case 'OCCUPIED':
            return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300';
        case 'RESERVED':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
        case 'MAINTENANCE':
            return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
        case 'LOCKED':
            return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300';
        default:
            return 'bg-muted text-muted-foreground';
    }
}

function invalidateSlots(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({
        queryKey: managerFacilityQueryKeys.slots,
    });
    queryClient.invalidateQueries({
        queryKey: managerFacilityQueryKeys.parkings,
    });
}
