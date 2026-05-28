'use client';

import type { MouseEvent, ReactNode } from 'react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    ImagePlus,
    Layers3,
    MapPin,
    RefreshCw,
    Search,
    Upload,
    Wand2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    getFloorMapApi,
    listFloorsApi,
    listParkingsApi,
    managerFacilityQueryKeys,
    presignStorageDownloadApi,
    presignStorageUploadApi,
    updateFloorMapApi,
    updateSlotCoordinateApi,
} from '@/service/manager/facility-api';
import type {
    FloorMapSlotResponse,
    FloorResponse,
    ParkingResponse,
} from '@/service/manager/facility-type';
import { EmptyState, FacilityHeader } from './floor-management';

const ALL_ZONES = 'ALL_ZONES';
const ALL_MAPPING_STATES = 'ALL_MAPPING_STATES';
const MAPPED = 'MAPPED';
const MISSING = 'MISSING';
const FLOOR_MAPS_FOLDER = 'floor-maps';
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

type MappingFilter =
    | typeof ALL_MAPPING_STATES
    | typeof MAPPED
    | typeof MISSING;

interface DraftCoordinate {
    slotId: string;
    xCoordinate: number;
    yCoordinate: number;
}

interface ZoneOption {
    id: string;
    name: string;
}

export function FacilityMapSetup() {
    const queryClient = useQueryClient();
    const [selectedParkingId, setSelectedParkingId] = useState('');
    const [selectedFloorId, setSelectedFloorId] = useState('');
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [search, setSearch] = useState('');
    const [mappingFilter, setMappingFilter] =
        useState<MappingFilter>(ALL_MAPPING_STATES);
    const [zoneFilter, setZoneFilter] = useState(ALL_ZONES);
    const [draftCoordinate, setDraftCoordinate] =
        useState<DraftCoordinate | null>(null);
    const [mapImageUrlInput, setMapImageUrlInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const deferredSearch = useDeferredValue(search);

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
    const selectedFloorIsAvailable = floors.some(
        (floor) => floor.id === selectedFloorId,
    );
    const floorId =
        selectedFloorId && selectedFloorIsAvailable
            ? selectedFloorId
            : floors[0]?.id || '';

    const mapQuery = useQuery({
        queryKey: managerFacilityQueryKeys.floorMap(floorId),
        queryFn: () => getFloorMapApi(floorId),
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

    const slots = useMemo(
        () =>
            [...(mapQuery.data?.slots ?? [])].sort((left, right) =>
                left.slotCode.localeCompare(right.slotCode),
            ),
        [mapQuery.data?.slots],
    );
    const selectedSlot = slots.find((slot) => slot.slotId === selectedSlotId);
    const zones = useMemo<ZoneOption[]>(() => {
        const zoneMap = new Map<string, string>();

        for (const slot of slots) {
            zoneMap.set(slot.zoneId, slot.zoneName);
        }

        return [...zoneMap.entries()]
            .map(([id, name]) => ({ id, name }))
            .sort((left, right) => left.name.localeCompare(right.name));
    }, [slots]);
    const filteredSlots = useMemo(() => {
        const normalizedSearch = deferredSearch.trim().toLowerCase();

        return slots.filter((slot) => {
            const isMapped = hasCoordinate(slot);
            const matchesSearch =
                !normalizedSearch ||
                slot.slotCode.toLowerCase().includes(normalizedSearch);
            const matchesMapping =
                mappingFilter === ALL_MAPPING_STATES ||
                (mappingFilter === MAPPED && isMapped) ||
                (mappingFilter === MISSING && !isMapped);
            const matchesZone =
                zoneFilter === ALL_ZONES || slot.zoneId === zoneFilter;

            return matchesSearch && matchesMapping && matchesZone;
        });
    }, [deferredSearch, mappingFilter, slots, zoneFilter]);
    const pins = useMemo(() => slots.filter(hasCoordinate), [slots]);
    const mappedCount = pins.length;
    const missingCount = Math.max(slots.length - mappedCount, 0);

    const floorMapQueryKey = managerFacilityQueryKeys.floorMap(floorId);
    const saveMapMutation = useMutation({
        mutationFn: (mapImageUrl: string) =>
            updateFloorMapApi(floorId, { mapImageUrl }),
        onSuccess: async () => {
            toast.success('Floor map saved.');
            await queryClient.invalidateQueries({ queryKey: floorMapQueryKey });
            setMapImageUrlInput('');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to save floor map.'));
        },
    });

    const uploadMutation = useMutation({
        mutationFn: uploadAndSaveFloorMap,
        onSuccess: async () => {
            toast.success('Map image uploaded and saved.');
            await queryClient.invalidateQueries({ queryKey: floorMapQueryKey });
            setSelectedFile(null);
            setUploadStatus('Done');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to upload floor map.'));
            setUploadStatus('Failed');
        },
    });

    const saveCoordinateMutation = useMutation({
        mutationFn: ({
            slotId,
            xCoordinate,
            yCoordinate,
        }: DraftCoordinate) =>
            updateSlotCoordinateApi(slotId, { xCoordinate, yCoordinate }),
        onSuccess: async () => {
            toast.success('Slot coordinate saved.');
            await queryClient.invalidateQueries({ queryKey: floorMapQueryKey });
            setDraftCoordinate(null);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to save slot coordinate.'),
            );
        },
    });

    useEffect(() => {
        if (parkingsQuery.isError) {
            toast.error(
                getErrorMessage(
                    parkingsQuery.error,
                    'Failed to load parkings.',
                ),
            );
        }
    }, [parkingsQuery.error, parkingsQuery.isError]);

    useEffect(() => {
        if (floorsQuery.isError) {
            toast.error(
                getErrorMessage(floorsQuery.error, 'Failed to load floors.'),
            );
        }
    }, [floorsQuery.error, floorsQuery.isError]);

    useEffect(() => {
        if (mapQuery.isError) {
            toast.error(
                getErrorMessage(mapQuery.error, 'Failed to load floor map.'),
            );
        }
    }, [mapQuery.error, mapQuery.isError]);

    useEffect(() => {
        if (downloadQuery.isError) {
            toast.error(
                getErrorMessage(
                    downloadQuery.error,
                    'Failed to create map download URL.',
                ),
            );
        }
    }, [downloadQuery.error, downloadQuery.isError]);

    async function uploadAndSaveFloorMap(file: File) {
        if (!floorId) {
            throw new Error('Select a floor before uploading a map image.');
        }

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            throw new Error('Upload a PNG, JPEG, or WebP image.');
        }

        setUploadStatus('Requesting upload URL...');
        const presign = await presignStorageUploadApi({
            fileName: file.name,
            contentType: file.type,
            folder: FLOOR_MAPS_FOLDER,
        });
        setUploadStatus('Uploading image...');
        let uploadResponse: Response;

        try {
            uploadResponse = await fetch(presign.uploadUrl, {
                method: presign.method || 'PUT',
                headers: {
                    ...presign.headers,
                    'Content-Type':
                        presign.headers['Content-Type'] ?? file.type,
                },
                body: file,
            });
        } catch {
            throw new Error(
                'Browser upload failed. MinIO CORS may need configuration.',
            );
        }

        if (!uploadResponse.ok) {
            throw new Error(
                `Browser upload failed. MinIO CORS may need configuration. HTTP ${uploadResponse.status}.`,
            );
        }

        setUploadStatus('Saving floor map...');
        return updateFloorMapApi(floorId, {
            mapImageUrl: presign.publicUrl ?? presign.objectKey,
        });
    }

    const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!rawMapImageUrl || !mapImageDisplayUrl) {
            toast.warning('Configure a floor map image before placing pins.');
            return;
        }

        if (!selectedSlot) {
            toast.error('Select a slot before placing a pin.');
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
            slotId: selectedSlot.slotId,
            xCoordinate,
            yCoordinate,
        });
    };

    const handleSaveMapUrl = () => {
        const nextMapImageUrl = mapImageUrlInput.trim();

        if (!floorId) {
            toast.error('Select a floor before saving a map image URL.');
            return;
        }

        if (!nextMapImageUrl) {
            toast.error('Enter a map image URL or object key first.');
            return;
        }

        saveMapMutation.mutate(nextMapImageUrl);
    };

    const handleUpload = () => {
        if (!floorId) {
            toast.error('Select a floor before uploading a map image.');
            return;
        }

        if (!selectedFile) {
            toast.error('Choose a PNG, JPEG, or WebP image first.');
            return;
        }

        uploadMutation.mutate(selectedFile);
    };

    const handleSaveCoordinate = () => {
        if (!selectedSlot) {
            toast.error('Select a slot before saving a coordinate.');
            return;
        }

        if (!rawMapImageUrl) {
            toast.warning('Configure a floor map image before saving pins.');
            return;
        }

        if (!draftCoordinate || draftCoordinate.slotId !== selectedSlot.slotId) {
            toast.warning('Click the map to preview a coordinate first.');
            return;
        }

        saveCoordinateMutation.mutate(draftCoordinate);
    };

    const handleParkingChange = (value: string) => {
        setSelectedParkingId(value);
        setSelectedFloorId('');
        setSelectedSlotId('');
        setDraftCoordinate(null);
        setZoneFilter(ALL_ZONES);
        setMapImageUrlInput('');
        setSelectedFile(null);
        setUploadStatus('');
    };

    const handleFloorChange = (value: string) => {
        setSelectedFloorId(value);
        setSelectedSlotId('');
        setDraftCoordinate(null);
        setZoneFilter(ALL_ZONES);
        setMapImageUrlInput('');
        setSelectedFile(null);
        setUploadStatus('');
    };

    const selectNextMissingSlot = () => {
        const missingSlot = slots.find((slot) => !hasCoordinate(slot));

        if (!missingSlot) {
            toast.info('All loaded slots have coordinates.');
            return;
        }

        setSelectedSlotId(missingSlot.slotId);
        setMappingFilter(MISSING);
    };

    return (
        <div className="space-y-6 p-6">
            <FacilityHeader
                title="Maps / Floor Plans"
                description="Configure indoor floor maps and slot pin coordinates."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Floor Map Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(420px,0.9fr)]">
                        <SelectorField label="Parking">
                            <ParkingSelector
                                isLoading={parkingsQuery.isLoading}
                                parkings={parkingsQuery.data ?? []}
                                value={parkingId}
                                onChange={handleParkingChange}
                            />
                        </SelectorField>
                        <SelectorField label="Floor">
                            <FloorSelector
                                disabled={!parkingId || floorsQuery.isLoading}
                                floors={floors}
                                isLoading={floorsQuery.isLoading}
                                value={floorId}
                                onChange={handleFloorChange}
                            />
                        </SelectorField>
                        <div className="grid grid-cols-4 gap-2">
                            <ProgressTile
                                label="Map image"
                                value={rawMapImageUrl ? 'Configured' : 'Missing'}
                                state={rawMapImageUrl ? 'ready' : 'pending'}
                            />
                            <ProgressTile
                                label="Slots mapped"
                                value={mappedCount.toLocaleString()}
                                state="ready"
                            />
                            <ProgressTile
                                label="Missing"
                                value={missingCount.toLocaleString()}
                                state={missingCount === 0 ? 'ready' : 'pending'}
                            />
                            <ProgressTile
                                label="Mode"
                                value={mapQuery.data?.coordinateMode ?? 'PERCENT'}
                                state="ready"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Map image URL or storage object key
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                value={mapImageUrlInput}
                                placeholder={
                                    rawMapImageUrl ||
                                    'tenants/.../floor-maps/b1-map.png or https://...'
                                }
                                onChange={(event) =>
                                    setMapImageUrlInput(event.target.value)
                                }
                            />
                            <Button
                                type="button"
                                disabled={saveMapMutation.isPending || !floorId}
                                onClick={handleSaveMapUrl}
                            >
                                <ImagePlus data-icon="inline-start" />
                                {saveMapMutation.isPending
                                    ? 'Saving...'
                                    : 'Save Map'}
                            </Button>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Uploaded images are stored as tenant object keys. The
                            editor will request a presigned download URL
                            automatically.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Upload Image
                        </label>
                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                            <Input
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                disabled={uploadMutation.isPending}
                                onChange={(event) => {
                                    setSelectedFile(
                                        event.target.files?.[0] ?? null,
                                    );
                                    setUploadStatus('');
                                }}
                            />
                            <Button
                                type="button"
                                disabled={
                                    uploadMutation.isPending ||
                                    !selectedFile ||
                                    !floorId
                                }
                                onClick={handleUpload}
                            >
                                <Upload data-icon="inline-start" />
                                {uploadMutation.isPending
                                    ? 'Uploading...'
                                    : 'Upload'}
                            </Button>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {uploadStatus ||
                                'Uses a tenant-scoped presigned upload URL; no MinIO secrets are sent to the browser.'}
                        </p>
                    </div>

                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <MapWorkspace
                    draftCoordinate={draftCoordinate}
                    isDownloadLoading={
                        !!mapObjectKey && downloadQuery.isLoading
                    }
                    hasDownloadError={downloadQuery.isError}
                    hasFloorSelected={!!floorId}
                    isMapLoading={mapQuery.isLoading}
                    isSavingCoordinate={saveCoordinateMutation.isPending}
                    mapImageDisplayUrl={mapImageDisplayUrl}
                    rawMapImageUrl={rawMapImageUrl}
                    pins={pins}
                    selectedSlot={selectedSlot}
                    onClearPreview={() => setDraftCoordinate(null)}
                    onMapClick={handleMapClick}
                    onRetryMap={() => {
                        if (downloadQuery.isError) {
                            downloadQuery.refetch();
                        }
                    }}
                    onSaveCoordinate={handleSaveCoordinate}
                />
                <SlotListPanel
                    filteredSlots={filteredSlots}
                    isLoading={mapQuery.isLoading}
                    mappingFilter={mappingFilter}
                    search={search}
                    selectedSlotId={selectedSlotId}
                    slots={slots}
                    zoneFilter={zoneFilter}
                    zones={zones}
                    onMappingFilterChange={setMappingFilter}
                    onSearchChange={setSearch}
                    onSelectNextMissing={selectNextMissingSlot}
                    onShowMissing={() => setMappingFilter(MISSING)}
                    onSlotSelect={setSelectedSlotId}
                    onZoneFilterChange={setZoneFilter}
                />
            </div>
        </div>
    );
}

function MapWorkspace({
    draftCoordinate,
    hasDownloadError,
    hasFloorSelected,
    isDownloadLoading,
    isMapLoading,
    isSavingCoordinate,
    mapImageDisplayUrl,
    pins,
    rawMapImageUrl,
    selectedSlot,
    onClearPreview,
    onMapClick,
    onRetryMap,
    onSaveCoordinate,
}: {
    draftCoordinate: DraftCoordinate | null;
    hasDownloadError: boolean;
    hasFloorSelected: boolean;
    isDownloadLoading: boolean;
    isMapLoading: boolean;
    isSavingCoordinate: boolean;
    mapImageDisplayUrl: string;
    pins: FloorMapSlotResponse[];
    rawMapImageUrl: string;
    selectedSlot?: FloorMapSlotResponse;
    onClearPreview: () => void;
    onMapClick: (event: MouseEvent<HTMLDivElement>) => void;
    onRetryMap: () => void;
    onSaveCoordinate: () => void;
}) {
    const [hoveredSlotId, setHoveredSlotId] = useState('');
    const [imageErrorUrl, setImageErrorUrl] = useState('');
    const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');
    const selectedCoordinate = useMemo(
        () =>
            draftCoordinate && draftCoordinate.slotId === selectedSlot?.slotId
                ? draftCoordinate
                : selectedSlot && hasCoordinate(selectedSlot)
                  ? {
                        slotId: selectedSlot.slotId,
                        xCoordinate: selectedSlot.xCoordinate ?? 0,
                        yCoordinate: selectedSlot.yCoordinate ?? 0,
                    }
                  : null,
        [draftCoordinate, selectedSlot],
    );
    const visiblePins = useMemo(
        () =>
            selectedCoordinate
                ? pins.filter((slot) => slot.slotId !== selectedSlot?.slotId)
                : pins,
        [pins, selectedCoordinate, selectedSlot?.slotId],
    );
    const canPlacePins = !!rawMapImageUrl && !!mapImageDisplayUrl;
    const imageLoadFailed = imageErrorUrl === mapImageDisplayUrl;
    const coordinateText =
        draftCoordinate && draftCoordinate.slotId === selectedSlot?.slotId
            ? `x: ${draftCoordinate.xCoordinate.toFixed(2)}%, y: ${draftCoordinate.yCoordinate.toFixed(2)}%`
            : 'x: -, y: -';

    return (
        <Card className="overflow-hidden">
            <CardHeader className="space-y-4">
                <div>
                    <CardTitle>Map Canvas</CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Select a slot, then click the displayed map to place its
                        percentage coordinate.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground text-xs">
                            Selected slot
                        </p>
                        <p className="truncate text-sm font-semibold">
                            {selectedSlot?.slotCode ?? 'No slot selected'}
                        </p>
                    </div>
                    <div className="min-w-36">
                        <p className="text-muted-foreground text-xs">
                            Coordinate preview
                        </p>
                        <p className="text-sm font-semibold">
                            {coordinateText}
                        </p>
                    </div>
                    {draftCoordinate && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                            Unsaved changes
                        </span>
                    )}
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant={zoomMode === 'fit' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setZoomMode('fit')}
                        >
                            Fit
                        </Button>
                        <Button
                            type="button"
                            variant={
                                zoomMode === 'actual' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => setZoomMode('actual')}
                        >
                            100%
                        </Button>
                    </div>
                    {draftCoordinate && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClearPreview}
                        >
                            <X data-icon="inline-start" />
                            Clear
                        </Button>
                    )}
                    <Button
                        type="button"
                        disabled={
                            !draftCoordinate ||
                            isSavingCoordinate ||
                            !canPlacePins ||
                            imageLoadFailed
                        }
                        onClick={onSaveCoordinate}
                    >
                        <MapPin data-icon="inline-start" />
                        {isSavingCoordinate ? 'Saving...' : 'Save Pin'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative flex min-h-[520px] max-h-[calc(100vh-260px)] items-center justify-center overflow-auto rounded-lg border bg-[linear-gradient(45deg,var(--muted)_25%,transparent_25%),linear-gradient(-45deg,var(--muted)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--muted)_75%),linear-gradient(-45deg,transparent_75%,var(--muted)_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-4">
                    {!hasFloorSelected ? (
                        <CanvasMessage
                            icon={<Layers3 className="size-8" />}
                            title="Select a parking and floor first."
                            description="Choose a parking and floor to load the map setup."
                        />
                    ) : isMapLoading || isDownloadLoading ? (
                        <CanvasMessage
                            icon={<RefreshCw className="size-8 animate-spin" />}
                            title="Loading map image..."
                            description="The editor is loading floor map setup and resolving the image URL."
                        />
                    ) : hasDownloadError || imageLoadFailed ? (
                        <CanvasMessage
                            icon={<Layers3 className="size-8" />}
                            title="Cannot load map image."
                            description="The stored object key may be invalid or the download URL expired."
                            action={
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setImageErrorUrl('');
                                        onRetryMap();
                                    }}
                                >
                                    <RefreshCw data-icon="inline-start" />
                                    Retry
                                </Button>
                            }
                        />
                    ) : canPlacePins ? (
                        <div
                            className={cn(
                                'relative inline-block cursor-crosshair overflow-hidden rounded-md border bg-background shadow-sm',
                                zoomMode === 'fit' ? 'max-w-full' : 'max-w-none',
                            )}
                            onClick={onMapClick}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={mapImageDisplayUrl}
                                alt="Selected floor map"
                                className={cn(
                                    'block select-none object-contain',
                                    zoomMode === 'fit'
                                        ? 'max-h-[calc(100vh-330px)] max-w-full'
                                        : 'max-w-none',
                                )}
                                draggable={false}
                                onError={() =>
                                    setImageErrorUrl(mapImageDisplayUrl)
                                }
                                onLoad={() => setImageErrorUrl('')}
                            />
                            {visiblePins.map((slot) => (
                                <Pin
                                    key={slot.slotId}
                                    isSelected={
                                        slot.slotId === selectedSlot?.slotId
                                    }
                                    showLabel={
                                        slot.slotId === selectedSlot?.slotId ||
                                        slot.slotId === hoveredSlotId
                                    }
                                    slot={slot}
                                    onHoverChange={setHoveredSlotId}
                                />
                            ))}
                            {selectedCoordinate && selectedSlot && (
                                <Pin
                                    isDraft={
                                        draftCoordinate?.slotId ===
                                        selectedSlot.slotId
                                    }
                                    isSelected
                                    showLabel
                                    slot={{
                                        ...selectedSlot,
                                        xCoordinate:
                                            selectedCoordinate.xCoordinate,
                                        yCoordinate:
                                            selectedCoordinate.yCoordinate,
                                        hasCoordinate: true,
                                    }}
                                    onHoverChange={setHoveredSlotId}
                                />
                            )}
                            {!selectedSlot && (
                                <div className="absolute bottom-4 left-4 rounded-md border bg-background/95 px-3 py-2 text-sm shadow-sm">
                                    Select a slot to place or adjust its pin.
                                </div>
                            )}
                            {draftCoordinate &&
                                draftCoordinate.slotId ===
                                    selectedSlot?.slotId && (
                                    <div className="absolute top-4 right-4 rounded-md border bg-background/95 px-3 py-2 text-xs shadow-sm">
                                        x{' '}
                                        {draftCoordinate.xCoordinate.toFixed(2)}
                                        % · y{' '}
                                        {draftCoordinate.yCoordinate.toFixed(2)}
                                        %
                                    </div>
                                )}
                        </div>
                    ) : (
                        <CanvasMessage
                            icon={<Layers3 className="size-8" />}
                            title="No floor map configured yet."
                            description="Paste an image URL or upload a PNG, JPEG, or WebP map to start placing slot pins."
                        />
                    )}
                </div>
                <div className="text-muted-foreground mt-3 text-xs">
                    Coordinates and pins are calculated against the displayed
                    image wrapper, not the outer canvas.
                </div>
            </CardContent>
        </Card>
    );
}

function CanvasMessage({
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
        <div className="flex max-w-md flex-col items-center justify-center rounded-lg border bg-background/95 p-8 text-center shadow-sm">
            <div className="bg-muted mb-4 rounded-full p-4">{icon}</div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{description}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

function Pin({
    isDraft = false,
    isSelected = false,
    onHoverChange,
    showLabel = false,
    slot,
}: {
    isDraft?: boolean;
    isSelected?: boolean;
    onHoverChange: (slotId: string) => void;
    showLabel?: boolean;
    slot: FloorMapSlotResponse;
}) {
    return (
        <div
            className={cn(
                'absolute z-10 -translate-x-1/2 -translate-y-full',
                isSelected ? 'z-20' : 'z-10',
            )}
            style={{
                left: `${slot.xCoordinate ?? 0}%`,
                top: `${slot.yCoordinate ?? 0}%`,
            }}
            onMouseEnter={() => onHoverChange(slot.slotId)}
            onMouseLeave={() => onHoverChange('')}
        >
            <div
                className={cn(
                    'flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold shadow-sm',
                    isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-background bg-emerald-600 text-white',
                    isDraft && 'border-amber-300 bg-amber-500 text-white',
                )}
            >
                <MapPin className="size-3" />
                {showLabel && (
                    <span>
                        {slot.slotCode}
                        {isDraft ? ' · Unsaved' : ''}
                    </span>
                )}
            </div>
        </div>
    );
}

function SlotListPanel({
    filteredSlots,
    isLoading,
    mappingFilter,
    search,
    selectedSlotId,
    slots,
    zoneFilter,
    zones,
    onMappingFilterChange,
    onSearchChange,
    onSelectNextMissing,
    onShowMissing,
    onSlotSelect,
    onZoneFilterChange,
}: {
    filteredSlots: FloorMapSlotResponse[];
    isLoading: boolean;
    mappingFilter: MappingFilter;
    search: string;
    selectedSlotId: string;
    slots: FloorMapSlotResponse[];
    zoneFilter: string;
    zones: ZoneOption[];
    onMappingFilterChange: (value: MappingFilter) => void;
    onSearchChange: (value: string) => void;
    onSelectNextMissing: () => void;
    onShowMissing: () => void;
    onSlotSelect: (value: string) => void;
    onZoneFilterChange: (value: string) => void;
}) {
    return (
        <Card className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)]">
            <CardHeader>
                <CardTitle>Slots</CardTitle>
                <p className="text-muted-foreground text-sm">
                    {slots.length.toLocaleString()} slots loaded from the floor
                    map setup API.
                </p>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
                <div className="sticky top-0 z-10 space-y-3 border-b bg-card p-4">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            placeholder="Search slot code"
                            className="pl-9"
                            onChange={(event) =>
                                onSearchChange(event.target.value)
                            }
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Select
                            value={mappingFilter}
                            onValueChange={(value) =>
                                onMappingFilterChange(value as MappingFilter)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_MAPPING_STATES}>
                                    All
                                </SelectItem>
                                <SelectItem value={MAPPED}>Mapped</SelectItem>
                                <SelectItem value={MISSING}>Missing</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={zoneFilter}
                            onValueChange={onZoneFilterChange}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_ZONES}>
                                    All zones
                                </SelectItem>
                                {zones.map((zone) => (
                                    <SelectItem key={zone.id} value={zone.id}>
                                        {zone.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onSelectNextMissing}
                        >
                            Next missing
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onShowMissing}
                        >
                            Show only missing
                        </Button>
                    </div>
                </div>

                <div className="max-h-[620px] space-y-2 overflow-auto p-4">
                    {isLoading && (
                        <>
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="h-16 w-full" />
                            ))}
                        </>
                    )}
                    {!isLoading &&
                        filteredSlots.map((slot) => (
                            <button
                                key={slot.slotId}
                                type="button"
                                className={cn(
                                    'hover:bg-accent w-full rounded-lg border p-3 text-left transition-colors',
                                    selectedSlotId === slot.slotId &&
                                        'border-primary bg-accent',
                                )}
                                onClick={() => onSlotSelect(slot.slotId)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {slot.slotCode}
                                        </p>
                                        <p className="text-muted-foreground mt-1 truncate text-xs">
                                            {slot.zoneName} · {slot.status}
                                        </p>
                                    </div>
                                    <MappedBadge mapped={hasCoordinate(slot)} />
                                </div>
                            </button>
                        ))}
                    {!isLoading && filteredSlots.length === 0 && (
                        <EmptyState message="No slots match the current filters." />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ProgressTile({
    label,
    state,
    value,
}: {
    label: string;
    state: 'ready' | 'pending';
    value: string;
}) {
    return (
        <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
                <Wand2
                    className={cn(
                        'size-4',
                        state === 'ready'
                            ? 'text-emerald-600'
                            : 'text-amber-600',
                    )}
                />
                <p className="text-muted-foreground truncate text-xs">
                    {label}
                </p>
            </div>
            <p className="mt-2 truncate text-sm font-semibold">{value}</p>
        </div>
    );
}

function MappedBadge({ mapped }: { mapped: boolean }) {
    return (
        <span
            className={cn(
                'shrink-0 rounded-full border px-2 py-1 text-xs font-medium',
                mapped
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
            )}
        >
            {mapped ? 'Mapped' : 'Missing'}
        </span>
    );
}

function SelectorField({
    children,
    label,
}: {
    children: ReactNode;
    label: string;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}

function ParkingSelector({
    isLoading,
    onChange,
    parkings,
    value,
}: {
    isLoading: boolean;
    onChange: (value: string) => void;
    parkings: ParkingResponse[];
    value: string;
}) {
    if (isLoading) {
        return <Skeleton className="h-10 w-full" />;
    }

    if (parkings.length === 0) {
        return <EmptyState message="No parkings found. Create a parking first." />;
    }

    return (
        <Select value={value} onValueChange={onChange}>
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

function FloorSelector({
    disabled,
    floors,
    isLoading,
    onChange,
    value,
}: {
    disabled: boolean;
    floors: FloorResponse[];
    isLoading: boolean;
    onChange: (value: string) => void;
    value: string;
}) {
    if (isLoading) {
        return <Skeleton className="h-10 w-full" />;
    }

    if (floors.length === 0) {
        return <EmptyState message="No floors found. Create a floor first." />;
    }

    return (
        <Select disabled={disabled} value={value} onValueChange={onChange}>
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

function hasCoordinate(slot: FloorMapSlotResponse) {
    return (
        slot.hasCoordinate &&
        typeof slot.xCoordinate === 'number' &&
        typeof slot.yCoordinate === 'number'
    );
}

function clampPercentage(value: number) {
    return Math.min(Math.max(value, 0), 100);
}

function roundCoordinate(value: number) {
    return Math.round(value * 100) / 100;
}

function isHttpUrl(value: string) {
    return /^https?:\/\//i.test(value);
}

function isObjectKey(value: string) {
    return value.trim().length > 0 && !isHttpUrl(value);
}
