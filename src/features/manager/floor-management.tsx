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
    createFloorApi,
    deleteFloorApi,
    listFloorsApi,
    listParkingsApi,
    managerFacilityQueryKeys,
    updateFloorApi,
} from '@/service/manager/facility-api';
import type {
    FloorRequest,
    FloorResponse,
    ParkingResponse,
} from '@/service/manager/facility-type';

interface FloorDialogState {
    open: boolean;
    floor?: FloorResponse;
}

export function FloorManagement() {
    const queryClient = useQueryClient();
    const [selectedParkingId, setSelectedParkingId] = useState('');
    const [dialog, setDialog] = useState<FloorDialogState>({ open: false });

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

    const deleteMutation = useMutation({
        mutationFn: deleteFloorApi,
        onSuccess: () => {
            toast.success('Floor deleted.');
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.floors(parkingId),
            });
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.parkings,
            });
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.topology(parkingId),
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to delete floor.'));
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

    const parkings = parkingsQuery.data ?? [];
    const floors = floorsQuery.data ?? [];

    return (
        <div className="space-y-6 p-6">
            <FacilityHeader
                title="Floors"
                description="Select a parking first, then manage tenant-scoped floors under that parking."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Parking Selector</CardTitle>
                </CardHeader>
                <CardContent className="max-w-md">
                    <ParkingSelect
                        parkings={parkings}
                        value={parkingId}
                        isLoading={parkingsQuery.isLoading}
                        onChange={setSelectedParkingId}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>Floors</CardTitle>
                    <Button
                        disabled={!parkingId}
                        onClick={() => setDialog({ open: true })}
                    >
                        <Plus data-icon="inline-start" />
                        Create Floor
                    </Button>
                </CardHeader>
                <CardContent>
                    {!parkingId ? (
                        <EmptyState message="Select a parking to view floors." />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Display Order</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {floorsQuery.isLoading && (
                                    <SimpleSkeleton colSpan={5} />
                                )}
                                {!floorsQuery.isLoading &&
                                    floors.map((floor) => (
                                        <TableRow key={floor.id}>
                                            <TableCell className="font-medium">
                                                {floor.code}
                                            </TableCell>
                                            <TableCell>{floor.name}</TableCell>
                                            <TableCell>
                                                {floor.displayOrder}
                                            </TableCell>
                                            <TableCell>
                                                {floor.active
                                                    ? 'ACTIVE'
                                                    : 'INACTIVE'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDialog({
                                                                open: true,
                                                                floor,
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
                                                                floor.id
                                                        }
                                                        onClick={() =>
                                                            deleteMutation.mutate(
                                                                floor.id,
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
                                {!floorsQuery.isLoading &&
                                    floors.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-muted-foreground h-28 text-center"
                                            >
                                                No floors found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <FloorDialog
                key={dialog.floor?.id ?? 'create'}
                open={dialog.open}
                parkingId={parkingId}
                floor={dialog.floor}
                onOpenChange={(open) =>
                    setDialog((current) => ({
                        ...current,
                        open,
                        floor: open ? current.floor : undefined,
                    }))
                }
            />
        </div>
    );
}

function FloorDialog({
    open,
    parkingId,
    floor,
    onOpenChange,
}: {
    open: boolean;
    parkingId: string;
    floor?: FloorResponse;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FloorRequest>({
        code: floor?.code ?? '',
        name: floor?.name ?? '',
        displayOrder: floor?.displayOrder ?? 1,
        active: floor?.active ?? true,
    });

    const mutation = useMutation({
        mutationFn: () =>
            floor
                ? updateFloorApi(floor.id, form)
                : createFloorApi(parkingId, form),
        onSuccess: (result) => {
            toast.success(floor ? 'Floor updated.' : 'Floor created.');
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.floors(result.parkingId),
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
                    floor ? 'Failed to update floor.' : 'Failed to create floor.',
                ),
            );
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {floor ? 'Edit floor' : 'Create floor'}
                    </DialogTitle>
                    <DialogDescription>
                        Floors are created under the selected parking.
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
                    <Input
                        type="number"
                        placeholder="Display order"
                        value={form.displayOrder}
                        disabled={mutation.isPending}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                displayOrder: Number(event.target.value),
                            }))
                        }
                    />
                    <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        Active
                        <Switch
                            checked={form.active ?? true}
                            disabled={mutation.isPending}
                            onCheckedChange={(active) =>
                                setForm((current) => ({ ...current, active }))
                            }
                        />
                    </label>
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function FacilityHeader({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div>
            <p className="text-muted-foreground text-sm font-medium">
                PARKING_MANAGER
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                {title}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                {description}
            </p>
        </div>
    );
}

export function ParkingSelect({
    parkings,
    value,
    isLoading,
    onChange,
}: {
    parkings: ParkingResponse[];
    value: string;
    isLoading: boolean;
    onChange: (value: string) => void;
}) {
    if (isLoading) {
        return <Skeleton className="h-8 w-full" />;
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

export function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-muted-foreground flex min-h-28 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm">
            {message}
        </div>
    );
}

export function SimpleSkeleton({ colSpan }: { colSpan: number }) {
    return (
        <>
            {Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell colSpan={colSpan}>
                        <Skeleton className="h-6 w-full" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}
