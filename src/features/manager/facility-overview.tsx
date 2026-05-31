'use client';

import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
    BadgeCheck,
    CheckCircle2,
    Layers,
    Map,
    ParkingCircle,
    Plus,
    Upload,
    UsersRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getFloorMapApi,
    getParkingTopologyApi,
    listParkingsApi,
    listRfidCardsApi,
    listSlotsApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';
import {
    rfidCardStatusValues,
    slotStatusValues,
    type SlotStatus,
} from '@/service/manager/facility-type';
import { FacilityHeader } from './floor-management';

const MAX_OVERVIEW_FLOOR_MAP_REQUESTS = 30;

export function FacilityOverview() {
    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });
    const totalSlotsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.slotList({ page: 0, size: 1 }),
        queryFn: () => listSlotsApi({ page: 0, size: 1 }),
    });
    const totalRfidQuery = useQuery({
        queryKey: managerFacilityQueryKeys.rfidCardList({ page: 0, size: 1 }),
        queryFn: () => listRfidCardsApi({ page: 0, size: 1 }),
        retry: false,
    });

    const topologyQueries = useQueries({
        queries: (parkingsQuery.data ?? []).map((parking) => ({
            queryKey: managerFacilityQueryKeys.topology(parking.id),
            queryFn: () => getParkingTopologyApi(parking.id),
            enabled: !!parking.id,
        })),
    });
    const slotStatusQueries = useQueries({
        queries: slotStatusValues.map((status) => ({
            queryKey: managerFacilityQueryKeys.slotList({
                status,
                page: 0,
                size: 1,
            }),
            queryFn: () => listSlotsApi({ status, page: 0, size: 1 }),
        })),
    });
    const rfidStatusQueries = useQueries({
        queries: rfidCardStatusValues.map((status) => ({
            queryKey: managerFacilityQueryKeys.rfidCardList({
                status,
                page: 0,
                size: 1,
            }),
            queryFn: () => listRfidCardsApi({ status, page: 0, size: 1 }),
            retry: false,
        })),
    });

    const topology = topologyQueries
        .map((query) => query.data)
        .filter(Boolean);
    const floorIds = topology.flatMap(
        (parking) => parking?.floors.map((floor) => floor.id) ?? [],
    );
    const shouldLoadMappedSlotStats =
        floorIds.length > 0 && floorIds.length <= MAX_OVERVIEW_FLOOR_MAP_REQUESTS;
    const floorMapQueries = useQueries({
        queries: floorIds.map((floorId) => ({
            queryKey: managerFacilityQueryKeys.floorMap(floorId),
            queryFn: () => getFloorMapApi(floorId),
            enabled: shouldLoadMappedSlotStats,
            retry: false,
        })),
    });
    const totalFloors = topology.reduce(
        (total, parking) => total + (parking?.floors.length ?? 0),
        0,
    );
    const totalZones = topology.reduce(
        (total, parking) =>
            total +
            (parking?.floors.reduce(
                (floorTotal, floor) => floorTotal + floor.zones.length,
                0,
            ) ?? 0),
        0,
    );
    const slotStatusCounts = Object.fromEntries(
        slotStatusValues.map((status, index) => [
            status,
            slotStatusQueries[index]?.data?.totalElements ?? 0,
        ]),
    ) as Record<SlotStatus, number>;
    const rfidStatusCounts = Object.fromEntries(
        rfidCardStatusValues.map((status, index) => [
            status,
            rfidStatusQueries[index]?.data?.totalElements ?? 0,
        ]),
    );
    const rfidUnavailable =
        totalRfidQuery.isError || rfidStatusQueries.some((query) => query.isError);
    const mappedSlots = shouldLoadMappedSlotStats
        ? floorMapQueries.reduce(
              (total, query) =>
                  total +
                  (query.data?.slots.filter((slot) => slot.hasCoordinate).length ??
                      0),
              0,
          )
        : null;
    const mapStatsLoading = floorMapQueries.some((query) => query.isLoading);
    const mapStatsUnavailable = floorMapQueries.some((query) => query.isError);
    const coreError =
        parkingsQuery.isError ||
        totalSlotsQuery.isError ||
        topologyQueries.some((query) => query.isError) ||
        slotStatusQueries.some((query) => query.isError);
    const isLoading =
        parkingsQuery.isLoading ||
        totalSlotsQuery.isLoading ||
        topologyQueries.some((query) => query.isLoading) ||
        slotStatusQueries.some((query) => query.isLoading);
    const hasParking = (parkingsQuery.data?.length ?? 0) > 0;
    const hasFloor = totalFloors > 0;
    const hasZone = totalZones > 0;
    const hasSlot = (totalSlotsQuery.data?.totalElements ?? 0) > 0;
    const hasRfid = !rfidUnavailable && (totalRfidQuery.data?.totalElements ?? 0) > 0;
    const maintenanceOrInactiveSlots =
        slotStatusCounts.MAINTENANCE + slotStatusCounts.LOCKED;

    const stats = [
        {
            title: 'Total Parkings',
            value: parkingsQuery.data?.length ?? 0,
            icon: ParkingCircle,
        },
        { title: 'Total Floors', value: totalFloors, icon: Layers },
        { title: 'Total Zones', value: totalZones, icon: Map },
        {
            title: 'Total Slots',
            value: totalSlotsQuery.data?.totalElements ?? 0,
            icon: ParkingCircle,
        },
        {
            title: 'Mapped Slots',
            value:
                !shouldLoadMappedSlotStats || mapStatsUnavailable
                    ? 'Open Maps'
                    : (mappedSlots ?? 0),
            icon: Map,
            loading: mapStatsLoading,
        },
        {
            title: 'Available Slots',
            value: slotStatusCounts.AVAILABLE,
            icon: CheckCircle2,
        },
        {
            title: 'Occupied Slots',
            value: slotStatusCounts.OCCUPIED,
            icon: ParkingCircle,
        },
        {
            title: 'Maintenance / Locked Slots',
            value: maintenanceOrInactiveSlots,
            icon: ParkingCircle,
        },
        {
            title: 'RFID Card Count',
            value: rfidUnavailable
                ? 'API pending'
                : (totalRfidQuery.data?.totalElements ?? 0),
            icon: BadgeCheck,
        },
        {
            title: 'RFID Active Count',
            value: rfidUnavailable
                ? 'API pending'
                : (rfidStatusCounts.ACTIVE ?? 0),
            icon: BadgeCheck,
        },
        {
            title: 'RFID Disabled / Lost Count',
            value: rfidUnavailable
                ? 'API pending'
                : (rfidStatusCounts.INACTIVE ?? 0) + (rfidStatusCounts.LOST ?? 0),
            icon: BadgeCheck,
        },
    ];

    if (coreError) {
        return (
            <div className="space-y-6 p-6">
                <FacilityHeader
                    title="Facility Overview"
                    description="Tenant facility setup summary derived from manager APIs."
                />
                <Card>
                    <CardContent className="text-muted-foreground p-6 text-sm">
                        Facility overview could not load from the manager
                        APIs. Check manager token role and backend availability.
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <FacilityHeader
                    title="Facility Overview"
                    description="Tenant facility setup summary derived from manager APIs. No tenant id is sent by the frontend."
                />
                <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                        <Link href="/manager/facility/parkings">
                            <Plus data-icon="inline-start" />
                            Create Parking
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/manager/facility/slots/import">
                            <Upload data-icon="inline-start" />
                            Import Slots
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/manager/facility/rfid-cards">
                            Generate RFID Cards
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/manager/staff-devices/staff">
                            <UsersRound data-icon="inline-start" />
                            Manage Staff
                        </Link>
                    </Button>
                </div>
            </div>

            {!isLoading && !hasParking && (
                <Card>
                    <CardContent className="text-muted-foreground p-6 text-sm">
                        This tenant does not have a parking yet. Start by
                        creating a parking, then add floors, zones, slots, and
                        an RFID card pool.
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <CardTitle className="text-sm">
                                {stat.title}
                            </CardTitle>
                            <div className="bg-muted flex size-9 items-center justify-center rounded-lg border">
                                <stat.icon className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {(isLoading || stat.loading) &&
                            typeof stat.value === 'number' ? (
                                <Skeleton className="h-9 w-20" />
                            ) : (
                                <p className="text-3xl font-semibold">
                                    {typeof stat.value === 'number'
                                        ? stat.value.toLocaleString()
                                        : stat.value}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <BreakdownCard
                    title="Slot Status Breakdown"
                    rows={[
                        ['Available', slotStatusCounts.AVAILABLE],
                        ['Occupied', slotStatusCounts.OCCUPIED],
                        ['Reserved', slotStatusCounts.RESERVED],
                        ['Maintenance', slotStatusCounts.MAINTENANCE],
                        ['Locked', slotStatusCounts.LOCKED],
                    ]}
                />
                <BreakdownCard
                    title="RFID Card Status Breakdown"
                    rows={
                        rfidUnavailable
                            ? [['RFID API pending', 0]]
                            : [
                                  ['Active', rfidStatusCounts.ACTIVE ?? 0],
                                  ['Inactive', rfidStatusCounts.INACTIVE ?? 0],
                                  ['Lost', rfidStatusCounts.LOST ?? 0],
                              ]
                    }
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Facility Setup Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ChecklistItem done={hasParking} label="Has parking" />
                        <ChecklistItem done={hasFloor} label="Has floor" />
                        <ChecklistItem done={hasZone} label="Has zone" />
                        <ChecklistItem done={hasSlot} label="Has slot" />
                        <ChecklistItem
                            done={hasRfid}
                            label={
                                rfidUnavailable
                                    ? 'RFID card pool API pending'
                                    : 'Has RFID card pool'
                            }
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function BreakdownCard({
    title,
    rows,
}: {
    title: string;
    rows: Array<[string, number]>;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {rows.map(([label, value]) => (
                    <div
                        key={label}
                        className="flex items-center justify-between gap-4 rounded-lg border p-3"
                    >
                        <span className="text-sm">{label}</span>
                        <span className="font-semibold">
                            {value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-3">
            <span className="bg-muted flex size-6 items-center justify-center rounded-full border text-xs">
                {done ? 'Y' : '-'}
            </span>
            <span className="text-sm">{label}</span>
        </div>
    );
}
