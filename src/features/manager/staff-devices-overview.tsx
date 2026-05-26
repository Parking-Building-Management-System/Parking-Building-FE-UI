'use client';

import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
    CheckCircle2,
    ClipboardCheck,
    DoorOpen,
    KeyRound,
    Plus,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    listManagerDeviceApprovalsApi,
    listManagerKioskStaffApi,
    listManagerKiosksApi,
    managerKioskDeviceQueryKeys,
} from '@/service/manager/kiosk-device-api';
import { listManagerStaffApi, managerStaffQueryKeys } from '@/service/manager/staff-api';

export function StaffDevicesOverview() {
    const staffQuery = useQuery({
        queryKey: managerStaffQueryKeys.staffList({ page: 0, size: 1 }),
        queryFn: () => listManagerStaffApi({ page: 0, size: 1 }),
    });
    const activeStaffQuery = useQuery({
        queryKey: managerStaffQueryKeys.staffList({
            status: 'ACTIVE',
            page: 0,
            size: 1,
        }),
        queryFn: () =>
            listManagerStaffApi({ status: 'ACTIVE', page: 0, size: 1 }),
    });
    const inactiveStaffQuery = useQuery({
        queryKey: managerStaffQueryKeys.staffList({
            status: 'INACTIVE',
            page: 0,
            size: 1,
        }),
        queryFn: () =>
            listManagerStaffApi({ status: 'INACTIVE', page: 0, size: 1 }),
    });
    const kiosksQuery = useQuery({
        queryKey: managerKioskDeviceQueryKeys.kioskList({}),
        queryFn: () => listManagerKiosksApi(),
        retry: false,
    });
    const activeKiosksQuery = useQuery({
        queryKey: managerKioskDeviceQueryKeys.kioskList({ status: 'ACTIVE' }),
        queryFn: () => listManagerKiosksApi({ status: 'ACTIVE' }),
        retry: false,
    });
    const approvalsQuery = useQuery({
        queryKey: managerKioskDeviceQueryKeys.deviceApprovals,
        queryFn: listManagerDeviceApprovalsApi,
        retry: false,
    });
    const assignmentQueries = useQueries({
        queries: (kiosksQuery.data ?? []).map((kiosk) => ({
            queryKey: managerKioskDeviceQueryKeys.kioskStaff(kiosk.id),
            queryFn: () => listManagerKioskStaffApi(kiosk.id),
            enabled: !!kiosk.id,
            retry: false,
        })),
    });

    const staffTotal = staffQuery.data?.totalElements ?? 0;
    const activeStaffTotal = activeStaffQuery.data?.totalElements ?? 0;
    const inactiveStaffTotal = inactiveStaffQuery.data?.totalElements ?? 0;
    const kiosks = kiosksQuery.data ?? [];
    const activeKiosks = activeKiosksQuery.data ?? [];
    const pendingApprovals = getPendingApprovalCount(approvalsQuery.data);
    const assignedStaffCount = assignmentQueries.reduce(
        (total, query) => total + (query.data?.length ?? 0),
        0,
    );
    const assignmentPending = assignmentQueries.some(
        (query) => query.isLoading || query.isPending,
    );
    const assignmentApiPending = assignmentQueries.some((query) => query.isError);
    const isLoading =
        staffQuery.isLoading ||
        activeStaffQuery.isLoading ||
        inactiveStaffQuery.isLoading ||
        kiosksQuery.isLoading ||
        activeKiosksQuery.isLoading ||
        approvalsQuery.isLoading;
    const hasError =
        staffQuery.isError ||
        activeStaffQuery.isError ||
        inactiveStaffQuery.isError;

    const stats = [
        {
            label: 'Total Staff',
            value: staffTotal,
            loading: staffQuery.isLoading,
            apiPending: false,
            icon: UsersRound,
        },
        {
            label: 'Active Staff',
            value: activeStaffTotal,
            loading: activeStaffQuery.isLoading,
            apiPending: false,
            icon: CheckCircle2,
        },
        {
            label: 'Inactive Staff',
            value: inactiveStaffTotal,
            loading: inactiveStaffQuery.isLoading,
            apiPending: false,
            icon: UsersRound,
        },
        {
            label: 'Total Kiosks',
            value: kiosks.length,
            loading: kiosksQuery.isLoading,
            apiPending: kiosksQuery.isError,
            icon: DoorOpen,
        },
        {
            label: 'Active Kiosks',
            value: activeKiosks.length,
            loading: activeKiosksQuery.isLoading,
            apiPending: activeKiosksQuery.isError,
            icon: DoorOpen,
        },
        {
            label: 'Pending Device Approvals',
            value: pendingApprovals,
            loading: approvalsQuery.isLoading,
            apiPending: approvalsQuery.isError,
            badge: pendingApprovals,
            icon: ShieldCheck,
        },
    ];

    const checklist = [
        {
            label: 'Staff accounts created',
            done: staffTotal > 0,
            pending: staffQuery.isLoading,
        },
        {
            label: 'Kiosks created',
            done: kiosks.length > 0,
            pending: kiosksQuery.isLoading,
            apiPending: kiosksQuery.isError,
        },
        {
            label: 'Staff assigned to kiosks',
            done: assignedStaffCount > 0,
            pending: assignmentPending,
            apiPending: assignmentApiPending,
        },
        {
            label: 'Pending approvals reviewed',
            done: pendingApprovals === 0,
            pending: approvalsQuery.isLoading,
            apiPending: approvalsQuery.isError,
        },
        {
            label: 'Staff device trust configured',
            done: kiosks.length > 0 && staffTotal > 0 && pendingApprovals === 0,
            pending: isLoading,
            apiPending: kiosksQuery.isError || approvalsQuery.isError,
        },
    ];

    if (hasError) {
        return (
            <div className="space-y-6 p-6">
                <OverviewHeader />
                <Card>
                    <CardContent className="flex flex-col gap-3 p-6 text-sm">
                        <p className="text-muted-foreground">
                            Staff & Devices overview could not load the staff
                            account summary. Check manager role and backend
                            availability.
                        </p>
                        <Button
                            className="w-fit"
                            variant="outline"
                            onClick={() => {
                                staffQuery.refetch();
                                activeStaffQuery.refetch();
                                inactiveStaffQuery.refetch();
                            }}
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <OverviewHeader />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                                <CardTitle className="text-sm">
                                    {stat.label}
                                </CardTitle>
                                {typeof stat.badge === 'number' &&
                                    !stat.loading &&
                                    !stat.apiPending &&
                                    stat.badge > 0 && (
                                        <PendingBadge count={stat.badge} />
                                    )}
                            </div>
                            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg border">
                                <stat.icon className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {stat.apiPending ? (
                                <p className="text-muted-foreground text-sm">
                                    API pending
                                </p>
                            ) : stat.loading ? (
                                <Skeleton className="h-9 w-20" />
                            ) : (
                                <p className="text-3xl font-semibold">
                                    {stat.value.toLocaleString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Operational Readiness</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {checklist.map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center justify-between gap-4 rounded-lg border p-3"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg border">
                                        <ClipboardCheck className="size-4" />
                                    </span>
                                    <span className="truncate text-sm font-medium">
                                        {item.label}
                                    </span>
                                </div>
                                <ReadinessState
                                    done={item.done}
                                    pending={item.pending}
                                    apiPending={item.apiPending}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Button asChild>
                            <Link href="/manager/staff-devices/staff">
                                <Plus data-icon="inline-start" />
                                Create Staff
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/manager/staff-devices/kiosks">
                                <DoorOpen data-icon="inline-start" />
                                Create Kiosk
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/manager/staff-devices/device-approvals">
                                <ShieldCheck data-icon="inline-start" />
                                Review Device Approvals
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/staff">
                                <KeyRound data-icon="inline-start" />
                                Open Staff Entry Guide
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recommended Setup Order</CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-3">
                        {[
                            'Create staff accounts',
                            'Create kiosks/gates',
                            'Assign staff to kiosks',
                            'Staff logs in from kiosk device',
                            'Manager approves device',
                            'Staff can operate entry/exit',
                        ].map((step, index) => (
                            <li
                                key={step}
                                className="flex items-center gap-3 rounded-lg border p-3"
                            >
                                <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                    {index + 1}
                                </span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}

function PendingBadge({ count }: { count: number }) {
    return (
        <span className="inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium">
            {count.toLocaleString()} pending
        </span>
    );
}

function getPendingApprovalCount(
    items?: { status: string }[] & { totalElements?: number },
) {
    if (!items) {
        return 0;
    }

    if (typeof items.totalElements === 'number') {
        return items.totalElements;
    }

    return items.filter((item) => item.status === 'PENDING').length;
}

function OverviewHeader() {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <p className="text-muted-foreground text-sm font-medium">
                    PARKING_MANAGER
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                    Staff & Devices
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                    Manage staff accounts, kiosk assignments, and trusted staff
                    devices for tenant operations.
                </p>
            </div>
        </div>
    );
}

function ReadinessState({
    done,
    pending,
    apiPending,
}: {
    done: boolean;
    pending?: boolean;
    apiPending?: boolean;
}) {
    if (apiPending) {
        return (
            <span className="text-muted-foreground rounded-full border px-2.5 py-1 text-xs">
                API pending
            </span>
        );
    }

    if (pending) {
        return <Skeleton className="h-6 w-20" />;
    }

    return (
        <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
            {done ? 'Ready' : 'Needs setup'}
        </span>
    );
}
