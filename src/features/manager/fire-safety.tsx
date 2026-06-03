'use client';

import type { MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    ExternalLink,
    MapPin,
    Pencil,
    Plus,
    Save,
    ShieldAlert,
    Trash2,
} from 'lucide-react';
import Link from 'next/link';
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
    listFloorsApi,
    listParkingsApi,
    listZonesApi,
    managerFacilityQueryKeys,
    presignStorageDownloadApi,
} from '@/service/manager/facility-api';
import type {
    FloorResponse,
    ParkingResponse,
} from '@/service/manager/facility-type';
import {
    createFireExtinguisherApi,
    deleteFireExtinguisherApi,
    getFireExtinguisherSummaryApi,
    getFireSafetyMapApi,
    listFireExtinguishersApi,
    listFireInspectionLogsApi,
    managerFireSafetyQueryKeys,
    updateFireExtinguisherApi,
    updateFireExtinguisherCoordinateApi,
    updateFireExtinguisherStatusApi,
} from '@/service/manager/fire-safety-api';
import type {
    CreateFireExtinguisherRequest,
    FireExtinguisher,
    FireExtinguisherFormValues,
    FireExtinguisherInspectionLog,
    FireExtinguisherListParams,
    FireExtinguisherStatus,
    FireExtinguisherType,
    FireInspectionResult,
} from '@/service/manager/fire-safety-type';
import {
    fireExtinguisherFormSchema,
    fireExtinguisherStatusValues,
    fireExtinguisherTypeValues,
    fireInspectionResultValues,
} from '@/service/manager/fire-safety-type';
import { EmptyState, FacilityHeader, SimpleSkeleton } from './floor-management';

const ALL = 'ALL';
const NO_ZONE = 'NO_ZONE';
const DEFAULT_PAGE_SIZE = 20;

type ExtinguisherDialogState = {
    open: boolean;
    extinguisher?: FireExtinguisher;
};

interface DraftCoordinate {
    extinguisherId: string;
    xCoordinate: number;
    yCoordinate: number;
}

const statusTone: Record<string, string> = {
    ACTIVE: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
    EXPIRED: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    MISSING:
        'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
    DAMAGED:
        'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    MAINTENANCE:
        'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    REPLACED:
        'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
};

export function ManagerSafetyOverview() {
    const summaryQuery = useQuery({
        queryKey: managerFireSafetyQueryKeys.summary,
        queryFn: getFireExtinguisherSummaryApi,
    });
    const quickListParams = useMemo<FireExtinguisherListParams>(
        () => ({ page: 0, size: 8 }),
        [],
    );
    const quickListQuery = useQuery({
        queryKey: managerFireSafetyQueryKeys.extinguishers(quickListParams),
        queryFn: () => listFireExtinguishersApi(quickListParams),
        placeholderData: keepPreviousData,
    });

    useToastQueryError(
        summaryQuery.isError,
        summaryQuery.error,
        'Failed to load fire safety summary.',
    );
    useToastQueryError(
        quickListQuery.isError,
        quickListQuery.error,
        'Failed to load fire extinguishers.',
    );

    const summary = summaryQuery.data;
    const needsAttention =
        (summary?.expired ?? 0) +
        (summary?.missing ?? 0) +
        (summary?.damaged ?? 0) +
        (summary?.dueInspection ?? 0);
    const quickItems = quickListQuery.data?.content ?? [];

    return (
        <div className="space-y-6 p-6">
            <FacilityHeader
                title="Safety & Compliance"
                description="Fire extinguisher status, inspection workload, and map readiness from live backend data."
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Total" value={summary?.total} />
                <SummaryCard label="Active" value={summary?.active} />
                <SummaryCard label="Expired" value={summary?.expired} />
                <SummaryCard label="Missing" value={summary?.missing} />
                <SummaryCard label="Damaged" value={summary?.damaged} />
                <SummaryCard label="Maintenance" value={summary?.maintenance} />
                <SummaryCard
                    label="Due Inspection"
                    value={summary?.dueInspection}
                />
                <SummaryCard
                    label="Expiring Soon"
                    value={summary?.expiringSoon}
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Needs Attention</CardTitle>
                        <CardDescription>
                            Expired, missing, damaged, and due inspection
                            counts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {summaryQuery.isLoading ? (
                            <Skeleton className="h-24 w-full" />
                        ) : needsAttention > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <AttentionItem
                                    label="Expired"
                                    value={summary?.expired ?? 0}
                                />
                                <AttentionItem
                                    label="Missing"
                                    value={summary?.missing ?? 0}
                                />
                                <AttentionItem
                                    label="Damaged"
                                    value={summary?.damaged ?? 0}
                                />
                                <AttentionItem
                                    label="Due Inspection"
                                    value={summary?.dueInspection ?? 0}
                                />
                            </div>
                        ) : (
                            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-300">
                                No fire safety items currently need attention.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Button asChild>
                            <Link href="/manager/safety/fire-extinguishers">
                                <Plus data-icon="inline-start" />
                                Add Fire Extinguisher
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/manager/safety/fire-map">
                                <MapPin data-icon="inline-start" />
                                Open Fire Safety Map
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/manager/safety/inspections">
                                <ClipboardList data-icon="inline-start" />
                                View Inspection Logs
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Fire Extinguishers</CardTitle>
                    <CardDescription>
                        First page from the manager fire extinguisher API.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FireExtinguisherTableRows
                        items={quickItems}
                        isLoading={quickListQuery.isLoading}
                        readonly
                    />
                </CardContent>
            </Card>
        </div>
    );
}

export function ManagerFireExtinguishersPage() {
    const queryClient = useQueryClient();
    const [parkingId, setParkingId] = useState(ALL);
    const [floorId, setFloorId] = useState(ALL);
    const [zoneId, setZoneId] = useState(ALL);
    const [status, setStatus] = useState<string>(ALL);
    const [type, setType] = useState<string>(ALL);
    const [search, setSearch] = useState('');
    const [expiringWithinDays, setExpiringWithinDays] = useState('');
    const [dialog, setDialog] = useState<ExtinguisherDialogState>({
        open: false,
    });

    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });
    const selectedParkingId =
        parkingId === ALL ? parkingsQuery.data?.[0]?.id || '' : parkingId;
    const floorsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.floors(selectedParkingId),
        queryFn: () => listFloorsApi(selectedParkingId),
        enabled: !!selectedParkingId,
    });
    const selectedFloorId =
        floorId === ALL ? floorsQuery.data?.[0]?.id || '' : floorId;
    const zonesQuery = useQuery({
        queryKey: managerFacilityQueryKeys.zones(selectedFloorId),
        queryFn: () => listZonesApi(selectedFloorId),
        enabled: !!selectedFloorId,
    });

    const filters = useMemo<FireExtinguisherListParams>(
        () => ({
            parkingId: parkingId === ALL ? undefined : parkingId,
            floorId: floorId === ALL ? undefined : floorId,
            zoneId: zoneId === ALL ? undefined : zoneId,
            status:
                status === ALL ? undefined : (status as FireExtinguisherStatus),
            type: type === ALL ? undefined : (type as FireExtinguisherType),
            search: search.trim() || undefined,
            expiringWithinDays: expiringWithinDays.trim()
                ? Number(expiringWithinDays)
                : undefined,
            page: 0,
            size: DEFAULT_PAGE_SIZE,
        }),
        [expiringWithinDays, floorId, parkingId, search, status, type, zoneId],
    );
    const extinguishersQuery = useQuery({
        queryKey: managerFireSafetyQueryKeys.extinguishers(filters),
        queryFn: () => listFireExtinguishersApi(filters),
        placeholderData: keepPreviousData,
    });

    const invalidateFireSafety = async () => {
        await queryClient.invalidateQueries({
            queryKey: ['manager-fire-extinguishers'],
        });
        await queryClient.invalidateQueries({
            queryKey: managerFireSafetyQueryKeys.summary,
        });
    };

    const deleteMutation = useMutation({
        mutationFn: deleteFireExtinguisherApi,
        onSuccess: async () => {
            toast.success('Fire extinguisher deleted.');
            await invalidateFireSafety();
        },
        onError: (error) =>
            toast.error(
                getErrorMessage(error, 'Failed to delete fire extinguisher.'),
            ),
    });
    const statusMutation = useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string;
            status: FireExtinguisherStatus;
        }) => updateFireExtinguisherStatusApi(id, { status }),
        onSuccess: async () => {
            toast.success('Fire extinguisher status updated.');
            await invalidateFireSafety();
        },
        onError: (error) =>
            toast.error(getErrorMessage(error, 'Failed to update status.')),
    });

    useToastQueryError(
        extinguishersQuery.isError,
        extinguishersQuery.error,
        'Failed to load fire extinguishers.',
    );

    const parkings = parkingsQuery.data ?? [];
    const floors = floorsQuery.data ?? [];
    const zones = zonesQuery.data ?? [];
    const extinguishers = extinguishersQuery.data?.content ?? [];
    const total =
        extinguishersQuery.data?.totalElements ?? extinguishers.length;

    return (
        <div className="space-y-6 p-6">
            <FacilityHeader
                title="Fire Extinguishers"
                description="Create, update, and soft-delete tenant fire extinguishers."
            />

            <Card>
                <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <CardTitle>Inventory</CardTitle>
                        <CardDescription>
                            {total.toLocaleString()} extinguishers
                        </CardDescription>
                    </div>
                    <Button onClick={() => setDialog({ open: true })}>
                        <Plus data-icon="inline-start" />
                        Create
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                        <Select
                            value={parkingId}
                            onValueChange={(value) => {
                                setParkingId(value);
                                setFloorId(ALL);
                                setZoneId(ALL);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Parking" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>All parkings</SelectItem>
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
                            value={floorId}
                            disabled={!selectedParkingId}
                            onValueChange={(value) => {
                                setFloorId(value);
                                setZoneId(ALL);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Floor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>All floors</SelectItem>
                                {floors.map((floor) => (
                                    <SelectItem key={floor.id} value={floor.id}>
                                        {floor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={zoneId}
                            disabled={!selectedFloorId}
                            onValueChange={setZoneId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Zone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>All zones</SelectItem>
                                {zones.map((zone) => (
                                    <SelectItem key={zone.id} value={zone.id}>
                                        {zone.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>All statuses</SelectItem>
                                {fireExtinguisherStatusValues.map((item) => (
                                    <SelectItem key={item} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>All types</SelectItem>
                                {fireExtinguisherTypeValues.map((item) => (
                                    <SelectItem key={item} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            value={search}
                            placeholder="Code or location"
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <Input
                            value={expiringWithinDays}
                            type="number"
                            min={1}
                            placeholder="Expiring days"
                            onChange={(event) =>
                                setExpiringWithinDays(event.target.value)
                            }
                        />
                    </div>
                    <FireExtinguisherTableRows
                        items={extinguishers}
                        isLoading={extinguishersQuery.isLoading}
                        onEdit={(extinguisher) =>
                            setDialog({ open: true, extinguisher })
                        }
                        onDelete={(extinguisher) => {
                            if (
                                window.confirm(
                                    `Delete ${extinguisher.code}? This is a soft delete.`,
                                )
                            ) {
                                deleteMutation.mutate(extinguisher.id);
                            }
                        }}
                        onStatusChange={(extinguisher, nextStatus) =>
                            statusMutation.mutate({
                                id: extinguisher.id,
                                status: nextStatus,
                            })
                        }
                    />
                </CardContent>
            </Card>

            <FireExtinguisherDialog
                key={`${dialog.open ? 'open' : 'closed'}-${dialog.extinguisher?.id ?? 'new'}`}
                dialog={dialog}
                parkings={parkings}
                onOpenChange={(open) => setDialog({ open })}
                onSaved={invalidateFireSafety}
            />
        </div>
    );
}

export function ManagerFireSafetyMapPage() {
    const queryClient = useQueryClient();
    const [selectedParkingId, setSelectedParkingId] = useState('');
    const [selectedFloorId, setSelectedFloorId] = useState('');
    const [selectedExtinguisherId, setSelectedExtinguisherId] = useState('');
    const [showMissingOnly, setShowMissingOnly] = useState(false);
    const [draftCoordinate, setDraftCoordinate] =
        useState<DraftCoordinate | null>(null);

    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });
    const parkingId = selectedParkingId || parkingsQuery.data?.[0]?.id || '';
    const floorsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.floors(parkingId),
        queryFn: () => listFloorsApi(parkingId),
        enabled: !!parkingId,
    });
    const floors = useMemo(
        () =>
            [...(floorsQuery.data ?? [])].sort(
                (left, right) => left.displayOrder - right.displayOrder,
            ),
        [floorsQuery.data],
    );
    const floorId =
        selectedFloorId && floors.some((floor) => floor.id === selectedFloorId)
            ? selectedFloorId
            : floors[0]?.id || '';
    const mapQuery = useQuery({
        queryKey: managerFireSafetyQueryKeys.map(floorId),
        queryFn: () => getFireSafetyMapApi(floorId),
        enabled: !!floorId,
    });
    const rawMapImageUrl = mapQuery.data?.mapImageUrl?.trim() ?? '';
    const mapObjectKey = isObjectKey(rawMapImageUrl) ? rawMapImageUrl : '';
    const downloadQuery = useQuery({
        queryKey: managerFacilityQueryKeys.storageDownload(mapObjectKey),
        queryFn: () => presignStorageDownloadApi(mapObjectKey),
        enabled: !!mapObjectKey,
        staleTime: 12 * 60 * 1000,
        retry: 1,
    });
    const mapImageDisplayUrl = isHttpUrl(rawMapImageUrl)
        ? rawMapImageUrl
        : downloadQuery.data?.downloadUrl ?? '';

    const extinguishers = useMemo(
        () =>
            [...(mapQuery.data?.extinguishers ?? [])].sort((left, right) =>
                left.code.localeCompare(right.code),
            ),
        [mapQuery.data?.extinguishers],
    );
    const selectedExtinguisher = extinguishers.find(
        (item) => item.id === selectedExtinguisherId,
    );
    const visibleExtinguishers = showMissingOnly
        ? extinguishers.filter((item) => !item.hasCoordinate)
        : extinguishers;
    const pins = extinguishers.filter((item) => item.hasCoordinate);

    const saveCoordinateMutation = useMutation({
        mutationFn: ({
            extinguisherId,
            xCoordinate,
            yCoordinate,
        }: DraftCoordinate) =>
            updateFireExtinguisherCoordinateApi(extinguisherId, {
                xCoordinate,
                yCoordinate,
            }),
        onSuccess: async () => {
            toast.success('Fire extinguisher coordinate saved.');
            await queryClient.invalidateQueries({
                queryKey: managerFireSafetyQueryKeys.map(floorId),
            });
            await queryClient.invalidateQueries({
                queryKey: ['manager-fire-extinguishers'],
            });
            setDraftCoordinate(null);
        },
        onError: (error) =>
            toast.error(getErrorMessage(error, 'Failed to save coordinate.')),
    });

    useToastQueryError(
        mapQuery.isError,
        mapQuery.error,
        'Failed to load fire safety map.',
    );

    const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!mapImageDisplayUrl) {
            toast.warning('Configure a floor map image before placing pins.');
            return;
        }
        if (!selectedExtinguisher) {
            toast.error('Select a fire extinguisher before placing a pin.');
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const xCoordinate = roundCoordinate(
            clampPercentage(((event.clientX - rect.left) / rect.width) * 100),
        );
        const yCoordinate = roundCoordinate(
            clampPercentage(((event.clientY - rect.top) / rect.height) * 100),
        );

        setDraftCoordinate({
            extinguisherId: selectedExtinguisher.id,
            xCoordinate,
            yCoordinate,
        });
    };

    return (
        <div className="space-y-6 p-6">
            <FacilityHeader
                title="Fire Safety Map"
                description="Place fire extinguisher pins on existing floor plans using percent coordinates."
            />

            <Card>
                <CardContent className="grid gap-4 pt-6 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto]">
                    <Selector label="Parking">
                        <ParkingSelectInline
                            value={parkingId}
                            parkings={parkingsQuery.data ?? []}
                            isLoading={parkingsQuery.isLoading}
                            onChange={(value) => {
                                setSelectedParkingId(value);
                                setSelectedFloorId('');
                                setSelectedExtinguisherId('');
                                setDraftCoordinate(null);
                            }}
                        />
                    </Selector>
                    <Selector label="Floor">
                        <FloorSelectInline
                            value={floorId}
                            floors={floors}
                            disabled={!parkingId || floorsQuery.isLoading}
                            onChange={(value) => {
                                setSelectedFloorId(value);
                                setSelectedExtinguisherId('');
                                setDraftCoordinate(null);
                            }}
                        />
                    </Selector>
                    <div className="grid grid-cols-3 gap-2">
                        <Metric label="Pins" value={pins.length} />
                        <Metric
                            label="Missing"
                            value={extinguishers.length - pins.length}
                        />
                        <Metric
                            label="Mode"
                            value={mapQuery.data?.coordinateMode ?? 'PERCENT'}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Floor Plan</CardTitle>
                        <CardDescription>
                            Select an extinguisher, click the map, then save the
                            previewed coordinate.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className="bg-muted/30 relative min-h-[360px] overflow-hidden rounded-lg border"
                            onClick={handleMapClick}
                        >
                            {mapQuery.isLoading ? (
                                <Skeleton className="h-[520px] w-full" />
                            ) : mapImageDisplayUrl ? (
                                <div className="relative inline-block w-full">
                                    <img
                                        src={mapImageDisplayUrl}
                                        alt="Floor fire safety map"
                                        className="block h-auto w-full select-none"
                                        draggable={false}
                                    />
                                    {pins.map((pin) => (
                                        <button
                                            key={pin.id}
                                            type="button"
                                            className={cn(
                                                'absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-background shadow',
                                                selectedExtinguisherId === pin.id
                                                    ? 'border-primary'
                                                    : 'border-background',
                                            )}
                                            style={{
                                                left: `${pin.xCoordinate ?? 0}%`,
                                                top: `${pin.yCoordinate ?? 0}%`,
                                            }}
                                            title={`${pin.code} ${pin.status}`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setSelectedExtinguisherId(pin.id);
                                            }}
                                        >
                                            <ShieldAlert
                                                className={cn(
                                                    'size-4',
                                                    pin.status === 'ACTIVE'
                                                        ? 'text-green-600'
                                                        : 'text-red-600',
                                                )}
                                            />
                                        </button>
                                    ))}
                                    {draftCoordinate && (
                                        <div
                                            className="absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/20"
                                            style={{
                                                left: `${draftCoordinate.xCoordinate}%`,
                                                top: `${draftCoordinate.yCoordinate}%`,
                                            }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="flex min-h-[360px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
                                    This floor has no map image configured.
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-muted-foreground text-sm">
                                {draftCoordinate
                                    ? `Preview: X ${draftCoordinate.xCoordinate}, Y ${draftCoordinate.yCoordinate}`
                                    : 'No coordinate preview selected.'}
                            </p>
                            <Button
                                disabled={
                                    !draftCoordinate ||
                                    saveCoordinateMutation.isPending
                                }
                                onClick={() =>
                                    draftCoordinate &&
                                    saveCoordinateMutation.mutate(
                                        draftCoordinate,
                                    )
                                }
                            >
                                <Save data-icon="inline-start" />
                                {saveCoordinateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save Coordinate'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle>Extinguishers</CardTitle>
                            <Button
                                type="button"
                                variant={showMissingOnly ? 'default' : 'outline'}
                                size="sm"
                                onClick={() =>
                                    setShowMissingOnly((value) => !value)
                                }
                            >
                                Missing only
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {mapQuery.isLoading && <SimpleSkeleton colSpan={1} />}
                        {!mapQuery.isLoading &&
                            visibleExtinguishers.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={cn(
                                        'w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/50',
                                        selectedExtinguisherId === item.id &&
                                            'border-primary bg-primary/5',
                                    )}
                                    onClick={() => {
                                        setSelectedExtinguisherId(item.id);
                                        setDraftCoordinate(null);
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-medium">
                                                {item.code}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {item.type} ·{' '}
                                                {item.locationDescription || '-'}
                                            </div>
                                        </div>
                                        <StatusBadge status={item.status} />
                                    </div>
                                    <div className="text-muted-foreground mt-2 grid grid-cols-2 gap-2 text-xs">
                                        <span>{item.zoneName || 'No zone'}</span>
                                        <span>
                                            {item.hasCoordinate
                                                ? 'Mapped'
                                                : 'Missing coordinate'}
                                        </span>
                                        <span>
                                            Expiry {formatDate(item.expiryDate)}
                                        </span>
                                        <span>
                                            Next{' '}
                                            {formatDateTime(
                                                item.nextInspectionAt,
                                            )}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        {!mapQuery.isLoading &&
                            visibleExtinguishers.length === 0 && (
                                <EmptyState message="No extinguishers match this map filter." />
                            )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function ManagerFireInspectionLogsPage() {
    const [parkingId, setParkingId] = useState(ALL);
    const [floorId, setFloorId] = useState(ALL);
    const [result, setResult] = useState(ALL);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });
    const selectedParkingId =
        parkingId === ALL ? parkingsQuery.data?.[0]?.id || '' : parkingId;
    const floorsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.floors(selectedParkingId),
        queryFn: () => listFloorsApi(selectedParkingId),
        enabled: !!selectedParkingId,
    });
    const filters = useMemo(
        () => ({
            parkingId: parkingId === ALL ? undefined : parkingId,
            floorId: floorId === ALL ? undefined : floorId,
            result: result === ALL ? undefined : (result as FireInspectionResult),
            from: from || undefined,
            to: to || undefined,
            page: 0,
            size: DEFAULT_PAGE_SIZE,
        }),
        [floorId, from, parkingId, result, to],
    );
    const logsQuery = useQuery({
        queryKey: managerFireSafetyQueryKeys.inspectionLogs(filters),
        queryFn: () => listFireInspectionLogsApi(filters),
        placeholderData: keepPreviousData,
    });

    useToastQueryError(
        logsQuery.isError,
        logsQuery.error,
        'Failed to load inspection logs.',
    );

    const logs = logsQuery.data?.content ?? [];

    return (
        <div className="space-y-6 p-6">
            <FacilityHeader
                title="Inspection Logs"
                description="Review staff fire inspection submissions and checklist results."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-5">
                    <Select
                        value={parkingId}
                        onValueChange={(value) => {
                            setParkingId(value);
                            setFloorId(ALL);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Parking" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All parkings</SelectItem>
                            {(parkingsQuery.data ?? []).map((parking) => (
                                <SelectItem key={parking.id} value={parking.id}>
                                    {parking.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={floorId} onValueChange={setFloorId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Floor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All floors</SelectItem>
                            {(floorsQuery.data ?? []).map((floor) => (
                                <SelectItem key={floor.id} value={floor.id}>
                                    {floor.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={result} onValueChange={setResult}>
                        <SelectTrigger>
                            <SelectValue placeholder="Result" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All results</SelectItem>
                            {fireInspectionResultValues.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={from}
                        onChange={(event) => setFrom(event.target.value)}
                    />
                    <Input
                        type="date"
                        value={to}
                        onChange={(event) => setTo(event.target.value)}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Logs</CardTitle>
                    <CardDescription>
                        {(logsQuery.data?.totalElements ?? logs.length)
                            .toLocaleString()} entries
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Extinguisher Code</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Inspector</TableHead>
                                <TableHead>Floor / Zone</TableHead>
                                <TableHead>Checklist</TableHead>
                                <TableHead>Note</TableHead>
                                <TableHead>Photo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logsQuery.isLoading && <SimpleSkeleton colSpan={8} />}
                            {!logsQuery.isLoading &&
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            {formatDateTime(log.inspectedAt)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {log.extinguisherCode ??
                                                log.code ??
                                                log.fireExtinguisherId ??
                                                '-'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={log.result} />
                                        </TableCell>
                                        <TableCell>
                                            {log.inspectorName ??
                                                log.inspectorId ??
                                                '-'}
                                        </TableCell>
                                        <TableCell>
                                            {log.floorName ?? log.floorCode ?? '-'}
                                            <span className="text-muted-foreground">
                                                {' '}
                                                / {log.zoneName ?? '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {formatChecklist([
                                                log.pressureOk,
                                                log.sealOk,
                                                log.locationOk,
                                                log.expiryOk,
                                            ])}
                                        </TableCell>
                                        <TableCell className="max-w-[220px] truncate">
                                            {log.note || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {getInspectionPhotoHref(log) ? (
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <a
                                                        href={getInspectionPhotoHref(
                                                            log,
                                                        )}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <ExternalLink data-icon="inline-start" />
                                                        View Photo
                                                    </a>
                                                </Button>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!logsQuery.isLoading && logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <EmptyState message="No inspection logs match the current filters." />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function FireExtinguisherDialog({
    dialog,
    parkings,
    onOpenChange,
    onSaved,
}: {
    dialog: ExtinguisherDialogState;
    parkings: ParkingResponse[];
    onOpenChange: (open: boolean) => void;
    onSaved: () => Promise<void>;
}) {
    const queryClient = useQueryClient();
    const isEdit = !!dialog.extinguisher;
    const [form, setForm] = useState<FireExtinguisherFormValues>(
        getDefaultExtinguisherForm(dialog.extinguisher, parkings[0]?.id),
    );
    const floorsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.floors(form.parkingId),
        queryFn: () => listFloorsApi(form.parkingId),
        enabled: dialog.open && !!form.parkingId,
    });
    const zonesQuery = useQuery({
        queryKey: managerFacilityQueryKeys.zones(form.floorId),
        queryFn: () => listZonesApi(form.floorId),
        enabled: dialog.open && !!form.floorId,
    });

    const mutation = useMutation({
        mutationFn: (request: CreateFireExtinguisherRequest) =>
            isEdit && dialog.extinguisher
                ? updateFireExtinguisherApi(dialog.extinguisher.id, request)
                : createFireExtinguisherApi(request),
        onSuccess: async (result) => {
            toast.success(
                isEdit
                    ? 'Fire extinguisher updated.'
                    : 'Fire extinguisher created.',
            );
            await onSaved();
            await queryClient.invalidateQueries({
                queryKey: managerFireSafetyQueryKeys.map(result.floorId),
            });
            onOpenChange(false);
        },
        onError: (error) =>
            toast.error(
                getErrorMessage(error, 'Failed to save fire extinguisher.'),
            ),
    });

    const submit = () => {
        const parsed = fireExtinguisherFormSchema.safeParse(form);
        if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? 'Check form values.');
            return;
        }
        mutation.mutate(toExtinguisherRequest(parsed.data));
    };

    const floors = floorsQuery.data ?? [];
    const zones = zonesQuery.data ?? [];

    return (
        <Dialog open={dialog.open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Fire Extinguisher' : 'Create Fire Extinguisher'}
                    </DialogTitle>
                    <DialogDescription>
                        Coordinates are optional and use 0 to 100 percent map
                        positions.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormSelect
                        label="Parking"
                        value={form.parkingId}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                parkingId: value,
                                floorId: '',
                                zoneId: '',
                            }))
                        }
                    >
                        {parkings.map((parking) => (
                            <SelectItem key={parking.id} value={parking.id}>
                                {parking.name}
                            </SelectItem>
                        ))}
                    </FormSelect>
                    <FormSelect
                        label="Floor"
                        value={form.floorId || floors[0]?.id || ''}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                floorId: value,
                                zoneId: '',
                            }))
                        }
                    >
                        {floors.map((floor) => (
                            <SelectItem key={floor.id} value={floor.id}>
                                {floor.name}
                            </SelectItem>
                        ))}
                    </FormSelect>
                    <FormSelect
                        label="Zone"
                        value={form.zoneId || NO_ZONE}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                zoneId: value === NO_ZONE ? '' : value,
                            }))
                        }
                    >
                        <SelectItem value={NO_ZONE}>No zone</SelectItem>
                        {zones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id}>
                                {zone.name}
                            </SelectItem>
                        ))}
                    </FormSelect>
                    <FormInput
                        label="Code"
                        value={form.code}
                        onChange={(value) =>
                            setForm((current) => ({ ...current, code: value }))
                        }
                    />
                    <FormSelect
                        label="Type"
                        value={form.type}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                type: value as FireExtinguisherType,
                            }))
                        }
                    >
                        {fireExtinguisherTypeValues.map((item) => (
                            <SelectItem key={item} value={item}>
                                {item}
                            </SelectItem>
                        ))}
                    </FormSelect>
                    <FormSelect
                        label="Status"
                        value={form.status}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                status: value as FireExtinguisherStatus,
                            }))
                        }
                    >
                        {fireExtinguisherStatusValues.map((item) => (
                            <SelectItem key={item} value={item}>
                                {item}
                            </SelectItem>
                        ))}
                    </FormSelect>
                    <FormInput
                        label="Location"
                        value={form.locationDescription}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                locationDescription: value,
                            }))
                        }
                    />
                    <FormInput
                        label="Manufacture Date"
                        type="date"
                        value={form.manufactureDate ?? ''}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                manufactureDate: value,
                            }))
                        }
                    />
                    <FormInput
                        label="Expiry Date"
                        type="date"
                        value={form.expiryDate ?? ''}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                expiryDate: value,
                            }))
                        }
                    />
                    <FormInput
                        label="Next Inspection"
                        type="datetime-local"
                        value={toDateTimeLocal(form.nextInspectionAt)}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                nextInspectionAt: value,
                            }))
                        }
                    />
                    <FormInput
                        label="X Coordinate"
                        type="number"
                        min="0"
                        max="100"
                        value={String(form.xCoordinate ?? '')}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                xCoordinate: parseCoordinateInput(value),
                            }))
                        }
                    />
                    <FormInput
                        label="Y Coordinate"
                        type="number"
                        min="0"
                        max="100"
                        value={String(form.yCoordinate ?? '')}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                yCoordinate: parseCoordinateInput(value),
                            }))
                        }
                    />
                    <div className="md:col-span-2">
                        <FormInput
                            label="Note"
                            value={form.note ?? ''}
                            onChange={(value) =>
                                setForm((current) => ({
                                    ...current,
                                    note: value,
                                }))
                            }
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button disabled={mutation.isPending} onClick={submit}>
                        {mutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FireExtinguisherTableRows({
    items,
    isLoading,
    readonly = false,
    onEdit,
    onDelete,
    onStatusChange,
}: {
    items: FireExtinguisher[];
    isLoading: boolean;
    readonly?: boolean;
    onEdit?: (extinguisher: FireExtinguisher) => void;
    onDelete?: (extinguisher: FireExtinguisher) => void;
    onStatusChange?: (
        extinguisher: FireExtinguisher,
        status: FireExtinguisherStatus,
    ) => void;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parking / Floor / Zone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Next Inspection</TableHead>
                    {!readonly && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && <SimpleSkeleton colSpan={readonly ? 7 : 8} />}
                {!isLoading &&
                    items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                {item.code}
                            </TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>
                                {item.parkingName ?? item.parkingId}
                                <span className="text-muted-foreground">
                                    {' '}
                                    / {item.floorName ?? item.floorCode ?? '-'} /{' '}
                                    {item.zoneName ?? '-'}
                                </span>
                            </TableCell>
                            <TableCell>{item.locationDescription}</TableCell>
                            <TableCell>
                                <StatusBadge status={item.status} />
                            </TableCell>
                            <TableCell>{formatDate(item.expiryDate)}</TableCell>
                            <TableCell>
                                {formatDateTime(item.nextInspectionAt)}
                            </TableCell>
                            {!readonly && (
                                <TableCell>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onEdit?.(item)}
                                        >
                                            <Pencil data-icon="inline-start" />
                                            Edit
                                        </Button>
                                        <Select
                                            value={item.status}
                                            onValueChange={(value) =>
                                                onStatusChange?.(
                                                    item,
                                                    value as FireExtinguisherStatus,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-9 w-36">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fireExtinguisherStatusValues.map(
                                                    (status) => (
                                                        <SelectItem
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {status}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href="/manager/safety/fire-map">
                                                <MapPin data-icon="inline-start" />
                                                Map
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onDelete?.(item)}
                                        >
                                            <Trash2 data-icon="inline-start" />
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                {!isLoading && items.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={readonly ? 7 : 8}>
                            <EmptyState message="No fire extinguishers found." />
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

function SummaryCard({ label, value }: { label: string; value?: number }) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between gap-3 p-5">
                <div>
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="text-2xl font-semibold">
                        {typeof value === 'number' ? value.toLocaleString() : '-'}
                    </p>
                </div>
                <ShieldAlert className="text-muted-foreground size-5" />
            </CardContent>
        </Card>
    );
}

function AttentionItem({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{label}</span>
                {value > 0 ? (
                    <AlertTriangle className="size-4 text-orange-600" />
                ) : (
                    <CheckCircle2 className="size-4 text-green-600" />
                )}
            </div>
            <p className="mt-2 text-2xl font-semibold">
                {value.toLocaleString()}
            </p>
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

function Selector({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="space-y-2">
            <span className="text-sm font-medium">{label}</span>
            {children}
        </label>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="text-sm font-semibold">{value}</div>
        </div>
    );
}

function ParkingSelectInline({
    value,
    parkings,
    isLoading,
    onChange,
}: {
    value: string;
    parkings: ParkingResponse[];
    isLoading: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <Select value={value} disabled={isLoading} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select parking" />
            </SelectTrigger>
            <SelectContent>
                {parkings.map((parking) => (
                    <SelectItem key={parking.id} value={parking.id}>
                        {parking.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function FloorSelectInline({
    value,
    floors,
    disabled,
    onChange,
}: {
    value: string;
    floors: FloorResponse[];
    disabled: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <Select value={value} disabled={disabled} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
                {floors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                        {floor.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function FormInput({
    label,
    value,
    onChange,
    type = 'text',
    ...props
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'>) {
    return (
        <label className="space-y-2 text-sm font-medium">
            <span>{label}</span>
            <Input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                {...props}
            />
        </label>
    );
}

function FormSelect({
    label,
    value,
    onChange,
    children,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
}) {
    return (
        <label className="space-y-2 text-sm font-medium">
            <span>{label}</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>{children}</SelectContent>
            </Select>
        </label>
    );
}

function getDefaultExtinguisherForm(
    extinguisher?: FireExtinguisher,
    fallbackParkingId = '',
): FireExtinguisherFormValues {
    return {
        parkingId: extinguisher?.parkingId ?? fallbackParkingId,
        floorId: extinguisher?.floorId ?? '',
        zoneId: extinguisher?.zoneId ?? '',
        code: extinguisher?.code ?? '',
        type: extinguisher?.type ?? 'CO2',
        locationDescription: extinguisher?.locationDescription ?? '',
        xCoordinate:
            typeof extinguisher?.xCoordinate === 'number'
                ? extinguisher.xCoordinate
                : '',
        yCoordinate:
            typeof extinguisher?.yCoordinate === 'number'
                ? extinguisher.yCoordinate
                : '',
        manufactureDate: extinguisher?.manufactureDate ?? '',
        expiryDate: extinguisher?.expiryDate ?? '',
        nextInspectionAt: extinguisher?.nextInspectionAt ?? '',
        status: extinguisher?.status ?? 'ACTIVE',
        note: extinguisher?.note ?? '',
    };
}

function toExtinguisherRequest(
    values: FireExtinguisherFormValues,
): CreateFireExtinguisherRequest {
    return {
        parkingId: values.parkingId,
        floorId: values.floorId,
        zoneId: values.zoneId || undefined,
        code: values.code.trim().toUpperCase(),
        type: values.type,
        locationDescription: values.locationDescription.trim(),
        xCoordinate:
            typeof values.xCoordinate === 'number'
                ? values.xCoordinate
                : undefined,
        yCoordinate:
            typeof values.yCoordinate === 'number'
                ? values.yCoordinate
                : undefined,
        manufactureDate: values.manufactureDate || undefined,
        expiryDate: values.expiryDate || undefined,
        nextInspectionAt: values.nextInspectionAt || undefined,
        status: values.status,
        note: values.note?.trim() || undefined,
    };
}

function useToastQueryError(
    isError: boolean,
    error: unknown,
    fallbackMessage: string,
) {
    useEffect(() => {
        if (isError) {
            toast.error(getErrorMessage(error, fallbackMessage));
        }
    }, [error, fallbackMessage, isError]);
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

function toDateTimeLocal(value?: string | null) {
    if (!value) {
        return '';
    }
    return value.slice(0, 16);
}

function formatChecklist(values: Array<boolean | null | undefined>) {
    const known = values.filter((value) => typeof value === 'boolean');
    if (known.length === 0) {
        return '-';
    }
    const passed = known.filter(Boolean).length;
    return `${passed}/${known.length} OK`;
}

function getInspectionPhotoHref(log: FireExtinguisherInspectionLog) {
    return log.photoDisplayUrl?.trim() || log.photoUrl?.trim() || '';
}

function isHttpUrl(value: string) {
    return /^https?:\/\//i.test(value);
}

function isObjectKey(value: string) {
    return !!value && !isHttpUrl(value) && !value.startsWith('/');
}

function clampPercentage(value: number) {
    return Math.min(Math.max(value, 0), 100);
}

function roundCoordinate(value: number) {
    return Math.round(value * 100) / 100;
}

function parseCoordinateInput(value: string) {
    if (!value.trim()) {
        return '';
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : '';
}
