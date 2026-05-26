'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
    createZoneApi,
    deleteZoneApi,
    listFloorsApi,
    listGlobalVehicleTypesApi,
    listParkingsApi,
    listZonesApi,
    managerFacilityQueryKeys,
    updateZoneApi,
} from '@/service/manager/facility-api';
import {
    zoneStatusValues,
    type FloorResponse,
    type GlobalVehicleTypeResponse,
    type ZoneRequest,
    type ZoneResponse,
    type ZoneStatus,
} from '@/service/manager/facility-type';
import {
    EmptyState,
    FacilityHeader,
    ParkingSelect,
    SimpleSkeleton,
} from './floor-management';

interface ZoneDialogState {
    open: boolean;
    zone?: ZoneResponse;
}

export function ZoneManagement() {
    const queryClient = useQueryClient();
    const [selectedParkingId, setSelectedParkingId] = useState('');
    const [selectedFloorId, setSelectedFloorId] = useState('');
    const [dialog, setDialog] = useState<ZoneDialogState>({ open: false });

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
    const floorId = selectedFloorId || floorsQuery.data?.[0]?.id || '';
    const zonesQuery = useQuery({
        queryKey: managerFacilityQueryKeys.zones(floorId),
        queryFn: () => listZonesApi(floorId),
        enabled: !!floorId,
    });
    const vehicleTypesQuery = useQuery({
        queryKey: managerFacilityQueryKeys.vehicleTypes,
        queryFn: listGlobalVehicleTypesApi,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteZoneApi,
        onSuccess: () => {
            toast.success('Zone deleted.');
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.zones(floorId),
            });
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.topology(parkingId),
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to delete zone.'));
        },
    });

    useEffect(() => {
        if (zonesQuery.isError) {
            toast.error(
                getErrorMessage(zonesQuery.error, 'Failed to load zones.'),
            );
        }
    }, [zonesQuery.error, zonesQuery.isError]);

    const parkings = parkingsQuery.data ?? [];
    const floors = floorsQuery.data ?? [];
    const zones = zonesQuery.data ?? [];
    const vehicleTypes = (vehicleTypesQuery.data ?? []).filter(
        (type) => type.active,
    );

    return (
        <div className="space-y-6 p-6">
            <FacilityHeader
                title="Zones"
                description="Select a parking and floor, then manage zones with global vehicle type validation."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Scope</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                    <ParkingSelect
                        parkings={parkings}
                        value={parkingId}
                        isLoading={parkingsQuery.isLoading}
                        onChange={(value) => {
                            setSelectedParkingId(value);
                            setSelectedFloorId('');
                        }}
                    />
                    <FloorSelect
                        floors={floors}
                        value={floorId}
                        disabled={!parkingId || floorsQuery.isLoading}
                        onChange={setSelectedFloorId}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>Zones</CardTitle>
                    <Button
                        disabled={!floorId}
                        onClick={() => setDialog({ open: true })}
                    >
                        <Plus data-icon="inline-start" />
                        Create Zone
                    </Button>
                </CardHeader>
                <CardContent>
                    {!parkingId ? (
                        <EmptyState message="Select a parking first." />
                    ) : !floorId ? (
                        <EmptyState message="Select a floor to view zones." />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Vehicle Type</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {zonesQuery.isLoading && (
                                    <SimpleSkeleton colSpan={6} />
                                )}
                                {!zonesQuery.isLoading &&
                                    zones.map((zone) => (
                                        <TableRow key={zone.id}>
                                            <TableCell className="font-medium">
                                                {zone.code}
                                            </TableCell>
                                            <TableCell>{zone.name}</TableCell>
                                            <TableCell>
                                                {zone.vehicleTypeName ??
                                                    zone.vehicleTypeCode ??
                                                    '-'}
                                            </TableCell>
                                            <TableCell>
                                                {zone.capacity.toLocaleString()}
                                            </TableCell>
                                            <TableCell>{zone.status}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDialog({
                                                                open: true,
                                                                zone,
                                                            })
                                                        }
                                                    >
                                                        <Pencil data-icon="inline-start" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={
                                                            deleteMutation.isPending &&
                                                            deleteMutation.variables ===
                                                                zone.id
                                                        }
                                                        onClick={() =>
                                                            deleteMutation.mutate(
                                                                zone.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 data-icon="inline-start" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {!zonesQuery.isLoading && zones.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-muted-foreground h-28 text-center"
                                        >
                                            No zones found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ZoneDialog
                key={dialog.zone?.id ?? 'create'}
                open={dialog.open}
                floorId={floorId}
                parkingId={parkingId}
                zone={dialog.zone}
                vehicleTypes={vehicleTypes}
                onOpenChange={(open) =>
                    setDialog((current) => ({
                        ...current,
                        open,
                        zone: open ? current.zone : undefined,
                    }))
                }
            />
        </div>
    );
}

function FloorSelect({
    floors,
    value,
    disabled,
    onChange,
}: {
    floors: FloorResponse[];
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
}) {
    if (floors.length === 0) {
        return <EmptyState message="No floors under selected parking." />;
    }

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

function ZoneDialog({
    open,
    floorId,
    parkingId,
    zone,
    vehicleTypes,
    onOpenChange,
}: {
    open: boolean;
    floorId: string;
    parkingId: string;
    zone?: ZoneResponse;
    vehicleTypes: GlobalVehicleTypeResponse[];
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<ZoneRequest>({
        code: zone?.code ?? '',
        name: zone?.name ?? '',
        vehicleTypeCode:
            zone?.vehicleTypeCode ?? vehicleTypes[0]?.code ?? '',
        capacity: zone?.capacity ?? 0,
        status: zone?.status ?? 'ACTIVE',
    });

    const mutation = useMutation({
        mutationFn: () =>
            zone ? updateZoneApi(zone.id, form) : createZoneApi(floorId, form),
        onSuccess: (result) => {
            toast.success(zone ? 'Zone updated.' : 'Zone created.');
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.zones(result.floorId),
            });
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.topology(result.parkingId),
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(
                    error,
                    zone ? 'Failed to update zone.' : 'Failed to create zone.',
                ),
            );
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {zone ? 'Edit zone' : 'Create zone'}
                    </DialogTitle>
                    <DialogDescription>
                        Zone vehicle type must exist in active global master
                        data.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        mutation.mutate();
                    }}
                >
                    <Input
                        placeholder="Code"
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
                        placeholder="Name"
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
                        value={form.vehicleTypeCode}
                        disabled={mutation.isPending}
                        onValueChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                vehicleTypeCode: value,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                            {vehicleTypes.map((type) => (
                                <SelectItem key={type.code} value={type.code}>
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="number"
                        placeholder="Capacity"
                        value={form.capacity}
                        disabled={mutation.isPending}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                capacity: Number(event.target.value),
                            }))
                        }
                    />
                    <Select
                        value={form.status ?? 'ACTIVE'}
                        disabled={mutation.isPending}
                        onValueChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                status: value as ZoneStatus,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {zoneStatusValues.map((status) => (
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
                                !floorId ||
                                !parkingId ||
                                !form.vehicleTypeCode
                            }
                        >
                            {mutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
