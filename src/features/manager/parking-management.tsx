'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, MoreHorizontal, Pencil, Plus } from 'lucide-react';
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
    createParkingApi,
    listParkingsApi,
    managerFacilityQueryKeys,
    updateParkingApi,
    updateParkingStatusApi,
} from '@/service/manager/facility-api';
import {
    parkingStatusValues,
    type ParkingRequest,
    type ParkingResponse,
    type ParkingStatus,
} from '@/service/manager/facility-type';

interface ParkingDialogState {
    open: boolean;
    parking?: ParkingResponse;
}

export function ParkingManagement() {
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState<ParkingDialogState>({ open: false });
    const { data, error, isError, isLoading } = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });

    const statusMutation = useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string;
            status: ParkingStatus;
        }) => updateParkingStatusApi(id, { status }),
        onSuccess: (updatedParking) => {
            toast.success('Parking status updated.');
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.parkings,
            });
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.topology(updatedParking.id),
            });
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update parking status.'),
            );
        },
    });

    useEffect(() => {
        if (isError) {
            toast.error(getErrorMessage(error, 'Failed to load parkings.'));
        }
    }, [error, isError]);

    const parkings = data ?? [];

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Parkings
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        Manage tenant-scoped parking buildings and operating
                        status. Backend scopes all records by manager token.
                    </p>
                </div>
                <Button onClick={() => setDialog({ open: true })}>
                    <Plus data-icon="inline-start" />
                    Create Parking
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Parking List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <ParkingTableSkeleton />}
                            {!isLoading &&
                                parkings.map((parking) => (
                                    <TableRow key={parking.id}>
                                        <TableCell className="font-medium">
                                            {parking.code}
                                        </TableCell>
                                        <TableCell>{parking.name}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">
                                            {parking.address ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {parking.totalCapacity.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={parking.status}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDialog({
                                                            open: true,
                                                            parking,
                                                        })
                                                    }
                                                >
                                                    <Pencil data-icon="inline-start" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Link
                                                        href={`/manager/parkings/${parking.id}/topology`}
                                                    >
                                                        <Eye data-icon="inline-start" />
                                                        Topology
                                                    </Link>
                                                </Button>
                                                <ParkingStatusMenu
                                                    parking={parking}
                                                    isPending={
                                                        statusMutation.isPending &&
                                                        statusMutation.variables
                                                            ?.id === parking.id
                                                    }
                                                    onChange={(status) =>
                                                        statusMutation.mutate({
                                                            id: parking.id,
                                                            status,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!isLoading && parkings.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        No parkings found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ParkingDialog
                key={dialog.parking?.id ?? 'create'}
                open={dialog.open}
                parking={dialog.parking}
                onOpenChange={(open) =>
                    setDialog((current) => ({
                        ...current,
                        open,
                        parking: open ? current.parking : undefined,
                    }))
                }
            />
        </div>
    );
}

function ParkingDialog({
    open,
    parking,
    onOpenChange,
}: {
    open: boolean;
    parking?: ParkingResponse;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<ParkingRequest>({
        code: parking?.code ?? '',
        name: parking?.name ?? '',
        address: parking?.address ?? '',
        status: parking?.status ?? 'ACTIVE',
    });

    const mutation = useMutation({
        mutationFn: () =>
            parking
                ? updateParkingApi(parking.id, form)
                : createParkingApi(form),
        onSuccess: (result) => {
            toast.success(
                parking ? 'Parking updated.' : 'Parking created.',
            );
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.parkings,
            });
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.topology(result.id),
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(
                    error,
                    parking
                        ? 'Failed to update parking.'
                        : 'Failed to create parking.',
                ),
            );
        },
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {parking ? 'Edit parking' : 'Create parking'}
                    </DialogTitle>
                    <DialogDescription>
                        Submit only parking fields; tenant ownership is resolved
                        by the backend from the manager token.
                    </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={submit}>
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
                        placeholder="Address"
                        value={form.address ?? ''}
                        disabled={mutation.isPending}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                address: event.target.value,
                            }))
                        }
                    />
                    <Select
                        value={form.status ?? 'ACTIVE'}
                        disabled={mutation.isPending}
                        onValueChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                status: value as ParkingStatus,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {parkingStatusValues.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

function ParkingStatusMenu({
    parking,
    isPending,
    onChange,
}: {
    parking: ParkingResponse;
    isPending: boolean;
    onChange: (status: ParkingStatus) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" disabled={isPending}>
                    <MoreHorizontal />
                    <span className="sr-only">Status actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {parkingStatusValues.map((status) => (
                    <DropdownMenuItem
                        key={status}
                        disabled={status === parking.status}
                        onClick={() => onChange(status)}
                    >
                        Mark {status}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className="bg-muted inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
            {status}
        </span>
    );
}

function ParkingTableSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                            <Skeleton className="h-5 w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}
