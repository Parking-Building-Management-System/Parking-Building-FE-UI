'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
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
    Download,
    MoreHorizontal,
    Search,
    Upload,
    Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import {
    bulkUpdateSlotStatusApi,
    exportSlotsApi,
    importSlotsApi,
    listSlotsApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';
import {
    slotStatusValues,
    type SlotBulkStatus,
    type SlotResponse,
    type SlotSearchParams,
    type SlotStatus,
} from '@/service/manager/facility-type';

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;
const ALL_STATUSES = 'ALL_STATUSES';
const SLOT_PAGE_SIZES = [10, 20, 50, 100] as const;

type SlotStatusFilter = SlotStatus | typeof ALL_STATUSES;
type VisibleBulkStatus = Extract<SlotBulkStatus, 'AVAILABLE' | 'MAINTENANCE'>;

export function SlotManagement() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const [slotCode, setSlotCode] = useState('');
    const [zoneId, setZoneId] = useState('');
    const [status, setStatus] = useState<SlotStatusFilter>(ALL_STATUSES);
    const [exact, setExact] = useState(false);
    const [page, setPage] = useState(DEFAULT_PAGE);
    const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const deferredSlotCode = useDeferredValue(slotCode);
    const deferredZoneId = useDeferredValue(zoneId);

    const queryParams = useMemo<SlotSearchParams>(
        () => ({
            page,
            size,
            zoneId: deferredZoneId.trim() || undefined,
            status: status === ALL_STATUSES ? undefined : status,
            slotCode: deferredSlotCode.trim() || undefined,
            exact,
        }),
        [deferredSlotCode, deferredZoneId, exact, page, size, status],
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
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.slots,
            });
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.parkings,
            });
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update slot statuses.'),
            );
        },
    });

    const importMutation = useMutation({
        mutationFn: importSlotsApi,
        onSuccess: (result) => {
            toast.success(
                `${result.insertedCount.toLocaleString()} slots imported.`,
            );
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.slots,
            });
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.parkings,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to import slots.'));
        },
    });

    const exportMutation = useMutation({
        mutationFn: exportSlotsApi,
        onSuccess: (file) => {
            downloadExportFile(file.blob, file.filename);
            toast.success('Slots exported.');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to export slots.'));
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

    const runBulkStatusUpdate = (newStatus: VisibleBulkStatus) => {
        if (selectedIds.length === 0) {
            return;
        }

        bulkMutation.mutate({
            slotIds: selectedIds,
            newStatus,
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (file) {
            importMutation.mutate(file);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Slot Management
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        Search tenant-scoped slots, bulk update statuses, and
                        move Excel files through the manager API.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importMutation.isPending}
                    >
                        <Upload data-icon="inline-start" />
                        {importMutation.isPending ? 'Importing...' : 'Import'}
                    </Button>
                    <Button
                        onClick={() => exportMutation.mutate()}
                        disabled={exportMutation.isPending}
                    >
                        <Download data-icon="inline-start" />
                        {exportMutation.isPending ? 'Exporting...' : 'Export'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_120px]">
                    <div className="relative">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            className="pl-8"
                            placeholder="Search slot code"
                            value={slotCode}
                            onChange={(event) => {
                                setPage(DEFAULT_PAGE);
                                setSlotCode(event.target.value);
                            }}
                        />
                    </div>
                    <Input
                        placeholder="Filter by zone ID"
                        value={zoneId}
                        onChange={(event) => {
                            setPage(DEFAULT_PAGE);
                            setZoneId(event.target.value);
                        }}
                    />
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
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
                    <label className="border-input bg-background flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm shadow-xs">
                        <Checkbox
                            checked={exact}
                            onCheckedChange={(checked) => {
                                setPage(DEFAULT_PAGE);
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
                            {selectedIds.length.toLocaleString()} selected -
                            {totalElements.toLocaleString()} total
                            {isFetching && !isLoading ? ' - Refreshing' : ''}
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
                            <DropdownMenuItem
                                onClick={() => runBulkStatusUpdate('AVAILABLE')}
                            >
                                <CheckCircle2 />
                                Mark Available
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    runBulkStatusUpdate('MAINTENANCE')
                                }
                            >
                                <Wrench />
                                Mark Maintenance
                            </DropdownMenuItem>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <SlotTableSkeleton />}

                            {!isLoading &&
                                slots.map((slot) => (
                                    <SlotTableRow
                                        key={slot.id}
                                        slot={slot}
                                        selected={selectedIds.includes(slot.id)}
                                        onSelectedChange={(checked) =>
                                            toggleSlot(slot.id, checked)
                                        }
                                    />
                                ))}

                            {!isLoading && slots.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
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
        </div>
    );
}

function SlotTableRow({
    slot,
    selected,
    onSelectedChange,
}: {
    slot: SlotResponse;
    selected: boolean;
    onSelectedChange: (checked: boolean) => void;
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
        </TableRow>
    );
}

function SlotTableSkeleton() {
    return (
        <>
            {Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell>
                        <Skeleton className="size-4" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-36" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-24" />
                    </TableCell>
                </TableRow>
            ))}
        </>
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

function downloadExportFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
