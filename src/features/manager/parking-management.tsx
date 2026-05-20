'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Building2, MapPinned, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getErrorMessage } from '@/features/admin/error-message';
import {
    listParkingsApi,
    managerFacilityQueryKeys,
    toggleParkingStatusApi,
} from '@/service/manager/facility-api';
import type { ParkingResponse } from '@/service/manager/facility-type';

export function ParkingManagement() {
    const queryClient = useQueryClient();
    const { data, error, isError, isLoading } = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });

    const statusMutation = useMutation({
        mutationFn: (id: string) => toggleParkingStatusApi(id),
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
            <div>
                <p className="text-muted-foreground text-sm font-medium">
                    PARKING_MANAGER
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                    Building Management
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                    Manage tenant-scoped parking buildings, operating status,
                    and topology.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {isLoading && <ParkingCardSkeleton />}

                {!isLoading &&
                    parkings.map((parking) => (
                        <ParkingCard
                            key={parking.id}
                            parking={parking}
                            isUpdating={
                                statusMutation.isPending &&
                                statusMutation.variables === parking.id
                            }
                            onToggleStatus={() =>
                                statusMutation.mutate(parking.id)
                            }
                        />
                    ))}

                {!isLoading && parkings.length === 0 && (
                    <Card className="md:col-span-2 xl:col-span-3">
                        <CardContent className="text-muted-foreground flex h-40 items-center justify-center text-sm">
                            No parkings found.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function ParkingCard({
    parking,
    isUpdating,
    onToggleStatus,
}: {
    parking: ParkingResponse;
    isUpdating: boolean;
    onToggleStatus: () => void;
}) {
    const isActive = parking.status === 'ACTIVE';

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                    <CardTitle className="truncate">{parking.name}</CardTitle>
                    <p className="text-muted-foreground mt-1 truncate text-sm">
                        {parking.address ?? 'No address'}
                    </p>
                </div>
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg border">
                    {parking.status === 'MAINTENANCE' ? (
                        <Wrench className="size-5" />
                    ) : (
                        <Building2 className="size-5" />
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">
                            Total Capacity
                        </p>
                        <p className="mt-1 text-2xl font-semibold">
                            {parking.totalCapacity.toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">Code</p>
                        <p className="mt-1 truncate text-sm font-medium">
                            {parking.code}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-medium">
                            {isActive ? 'Active' : 'Maintenance'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                            Current status: {parking.status}
                        </p>
                    </div>
                    <Switch
                        checked={isActive}
                        disabled={isUpdating}
                        onCheckedChange={onToggleStatus}
                        aria-label={`Toggle ${parking.name} status`}
                    />
                </div>

                <Button asChild variant="outline" className="w-full">
                    <Link href={`/manager/parkings/${parking.id}/topology`}>
                        <MapPinned data-icon="inline-start" />
                        Manage Topology
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function ParkingCardSkeleton() {
    return (
        <>
            {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
