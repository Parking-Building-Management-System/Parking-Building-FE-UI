'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
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
    zoneRequestSchema,
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

interface ZoneFormState {
    code: string;
    name: string;
    vehicleTypeCode: string;
    capacity: string;
    status: ZoneStatus;
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
    const vehicleTypes = useMemo(
        () => (vehicleTypesQuery.data ?? []).filter((type) => type.active),
        [vehicleTypesQuery.data],
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
                                {!zonesQuery.isLoading &&
                                    zones.length === 0 && (
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
                vehicleTypesError={
                    vehicleTypesQuery.isError ? vehicleTypesQuery.error : null
                }
                vehicleTypesLoading={vehicleTypesQuery.isLoading}
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
    vehicleTypesError,
    vehicleTypesLoading,
    onOpenChange,
}: {
    open: boolean;
    floorId: string;
    parkingId: string;
    zone?: ZoneResponse;
    vehicleTypes: GlobalVehicleTypeResponse[];
    vehicleTypesError: unknown;
    vehicleTypesLoading: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<ZoneFormState>({
        code: zone?.code ?? '',
        name: zone?.name ?? '',
        vehicleTypeCode: zone?.vehicleTypeCode ?? vehicleTypes[0]?.code ?? '',
        capacity:
            typeof zone?.capacity === 'number' ? String(zone.capacity) : '',
        status: zone?.status ?? 'ACTIVE',
    });
    const [validationErrors, setValidationErrors] = useState<
        Partial<Record<keyof ZoneRequest, string>>
    >({});

    const mutation = useMutation({
        mutationFn: (payload: ZoneRequest) =>
            zone
                ? updateZoneApi(zone.id, payload)
                : createZoneApi(floorId, payload),
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

    const vehicleTypeLoadError = vehicleTypesError
        ? getErrorMessage(vehicleTypesError, 'Failed to load vehicle types.')
        : '';
    const hasVehicleTypeOptions = vehicleTypes.length > 0;
    const selectedVehicleTypeCode =
        form.vehicleTypeCode || vehicleTypes[0]?.code || '';
    const canSave =
        !mutation.isPending &&
        !!floorId &&
        !!parkingId &&
        !vehicleTypesLoading &&
        !vehicleTypeLoadError &&
        hasVehicleTypeOptions;

    const submit = () => {
        const payload: ZoneRequest = {
            code: form.code.trim(),
            name: form.name.trim(),
            vehicleTypeCode: selectedVehicleTypeCode.trim(),
            capacity: Number(form.capacity),
            status: form.status,
        };
        const parsed = zoneRequestSchema.safeParse(payload);

        if (!parsed.success) {
            const errors: Partial<Record<keyof ZoneRequest, string>> = {};
            parsed.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof ZoneRequest | undefined;

                if (field && !errors[field]) {
                    errors[field] = issue.message;
                }
            });
            setValidationErrors(errors);
            return;
        }

        setValidationErrors({});
        mutation.mutate(parsed.data);
    };

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
                        submit();
                    }}
                >
                    <div className="space-y-2">
                        <Label htmlFor="zone-code">Code</Label>
                        <Input
                            id="zone-code"
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
                        <FieldError message={validationErrors.code} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="zone-name">Name</Label>
                        <Input
                            id="zone-name"
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
                        <FieldError message={validationErrors.name} />
                    </div>
                    <div className="space-y-2">
                        <Label>Vehicle Type</Label>
                        {vehicleTypeLoadError ? (
                            <p className="text-destructive text-sm">
                                {vehicleTypeLoadError}
                            </p>
                        ) : !vehicleTypesLoading && !hasVehicleTypeOptions ? (
                            <p className="text-muted-foreground rounded-md border p-3 text-sm">
                                No active vehicle types. Please ask System Admin
                                to configure master data.
                            </p>
                        ) : (
                            <Select
                                value={selectedVehicleTypeCode}
                                disabled={
                                    mutation.isPending || vehicleTypesLoading
                                }
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        vehicleTypeCode: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            vehicleTypesLoading
                                                ? 'Loading vehicle types...'
                                                : 'Vehicle type'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicleTypes.map((type) => (
                                        <SelectItem
                                            key={type.id}
                                            value={type.code}
                                        >
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <FieldError
                            message={validationErrors.vehicleTypeCode}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="zone-capacity">
                            Capacity (0 allowed)
                        </Label>
                        <Input
                            id="zone-capacity"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="Capacity"
                            value={form.capacity}
                            disabled={mutation.isPending}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    capacity: event.target.value,
                                }))
                            }
                        />
                        <FieldError message={validationErrors.capacity} />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
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
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!canSave}>
                            {mutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-destructive text-sm">{message}</p>;
}
