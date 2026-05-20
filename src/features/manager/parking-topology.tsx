'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { Layers3, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
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
import {
    createZoneApi,
    getParkingTopologyApi,
    listGlobalVehicleTypesApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';
import {
    createZoneFormSchema,
    zoneStatusValues,
    type CreateZoneFormValues,
    type FloorTopologyResponse,
    type ZoneRequest,
    type ZoneStatus,
    type ZoneTopologyResponse,
} from '@/service/manager/facility-type';

export function ParkingTopology({ parkingId }: { parkingId: string }) {
    const {
        data: topology,
        error,
        isError,
        isLoading,
    } = useQuery({
        queryKey: managerFacilityQueryKeys.topology(parkingId),
        queryFn: () => getParkingTopologyApi(parkingId),
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        if (isError) {
            toast.error(getErrorMessage(error, 'Failed to load topology.'));
        }
    }, [error, isError]);

    const floors = useMemo(() => {
        return [...(topology?.floors ?? [])].sort(
            (left, right) => left.displayOrder - right.displayOrder,
        );
    }, [topology?.floors]);

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Floor & Zone Management
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        {topology
                            ? `${topology.name} (${topology.code})`
                            : 'Inspect floors and zones for this parking.'}
                    </p>
                </div>

                <CreateZoneDialog parkingId={parkingId} floors={floors} />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle>Topology</CardTitle>
                        {topology && (
                            <p className="text-muted-foreground mt-1 text-sm">
                                Capacity{' '}
                                {topology.totalCapacity.toLocaleString()} -
                                {topology.status}
                            </p>
                        )}
                    </div>
                    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg border">
                        <Layers3 className="size-5" />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TopologySkeleton />
                    ) : (
                        <TopologyAccordion floors={floors} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function TopologyAccordion({ floors }: { floors: FloorTopologyResponse[] }) {
    if (floors.length === 0) {
        return (
            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                No floors configured.
            </div>
        );
    }

    return (
        <Accordion
            type="multiple"
            defaultValue={floors.map((floor) => floor.id)}
            className="w-full"
        >
            {floors.map((floor) => (
                <AccordionItem key={floor.id} value={floor.id}>
                    <AccordionTrigger>
                        <div className="text-left">
                            <p>{floor.name}</p>
                            <p className="text-muted-foreground mt-1 text-xs font-normal">
                                {floor.code} - {floor.zones.length} zones
                            </p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {floor.zones.map((zone) => (
                                <ZoneCard key={zone.id} zone={zone} />
                            ))}

                            {floor.zones.length === 0 && (
                                <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                                    No zones configured.
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

function ZoneCard({ zone }: { zone: ZoneTopologyResponse }) {
    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-medium">{zone.name}</p>
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                        {zone.code}
                    </p>
                </div>
                <span className="bg-muted shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium">
                    {zone.status}
                </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs">Vehicle</p>
                    <p className="truncate font-semibold">
                        {zone.vehicleTypeName ?? zone.vehicleTypeCode ?? '-'}
                    </p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">Capacity</p>
                    <p className="font-semibold">
                        {zone.capacity.toLocaleString()}
                    </p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">Slots</p>
                    <p className="font-semibold">
                        {zone.slotCount.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}

function CreateZoneDialog({
    parkingId,
    floors,
}: {
    parkingId: string;
    floors: FloorTopologyResponse[];
}) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const vehicleTypesQuery = useQuery({
        queryKey: managerFacilityQueryKeys.vehicleTypes,
        queryFn: listGlobalVehicleTypesApi,
        placeholderData: keepPreviousData,
    });
    const form = useForm<CreateZoneFormValues>({
        resolver: zodResolver(createZoneFormSchema),
        defaultValues: {
            floorId: '',
            code: '',
            name: '',
            vehicleTypeCode: '',
            capacity: 0,
            status: 'ACTIVE',
        },
    });

    const activeVehicleTypes = useMemo(() => {
        return (vehicleTypesQuery.data ?? []).filter(
            (vehicleType) => vehicleType.active,
        );
    }, [vehicleTypesQuery.data]);

    const createMutation = useMutation({
        mutationFn: (values: CreateZoneFormValues) => {
            const request: ZoneRequest = {
                code: values.code,
                name: values.name,
                vehicleTypeCode: values.vehicleTypeCode,
                capacity: values.capacity,
                status: values.status ?? 'ACTIVE',
            };

            return createZoneApi(values.floorId, request);
        },
        onSuccess: () => {
            toast.success('Zone created.');
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.topology(parkingId),
            });
            form.reset();
            setOpen(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to create zone.'));
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={floors.length === 0}>
                    <Plus data-icon="inline-start" />
                    Create Zone
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create zone</DialogTitle>
                    <DialogDescription>
                        Add a zone under a floor and bind it to a global vehicle
                        type code.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit((values) =>
                            createMutation.mutate(values),
                        )}
                    >
                        <FormField
                            control={form.control}
                            name="floorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Floor</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select floor" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {floors.map((floor) => (
                                                <SelectItem
                                                    key={floor.id}
                                                    value={floor.id}
                                                >
                                                    {floor.name} ({floor.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="vehicleTypeCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vehicle Type</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={vehicleTypesQuery.isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select vehicle type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {activeVehicleTypes.map(
                                                (vehicleType) => (
                                                    <SelectItem
                                                        key={vehicleType.code}
                                                        value={vehicleType.code}
                                                    >
                                                        {vehicleType.name} (
                                                        {vehicleType.code})
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Code</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="B1-A"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Capacity</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={field.value}
                                                onBlur={field.onBlur}
                                                onChange={(event) =>
                                                    field.onChange(
                                                        Number.isNaN(
                                                            event.target
                                                                .valueAsNumber,
                                                        )
                                                            ? 0
                                                            : event.target
                                                                  .valueAsNumber,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="B1 Zone A - Premium Cars"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        value={field.value ?? 'ACTIVE'}
                                        onValueChange={(value) =>
                                            field.onChange(value as ZoneStatus)
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {zoneStatusValues.map((status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={
                                    createMutation.isPending ||
                                    vehicleTypesQuery.isLoading
                                }
                            >
                                {createMutation.isPending
                                    ? 'Creating...'
                                    : 'Create Zone'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function TopologySkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-lg border p-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="mt-2 h-4 w-24" />
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}
