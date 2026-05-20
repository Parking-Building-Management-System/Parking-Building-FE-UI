'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Building2, ParkingCircle, Server } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminQueryKeys, getDashboardStats } from '@/service/admin/api';
import { getErrorMessage } from './error-message';
import { SystemTrafficChart } from './system-traffic-chart';

export function AdminDashboard() {
    const { data, error, isError, isLoading } = useQuery({
        queryKey: adminQueryKeys.dashboardStats,
        queryFn: getDashboardStats,
    });

    useEffect(() => {
        if (isError) {
            toast.error(
                getErrorMessage(error, 'Failed to load dashboard statistics.'),
            );
        }
    }, [error, isError]);

    const statCards = [
        {
            title: 'Active Tenants',
            value: isLoading
                ? '...'
                : (data?.activeTenantCount ?? 0).toLocaleString(),
            description: 'Enabled SaaS customers',
            icon: Building2,
        },
        {
            title: 'Total Parkings',
            value: isLoading
                ? '...'
                : (data?.parkingCount ?? 0).toLocaleString(),
            description: 'Buildings and parking sites',
            icon: ParkingCircle,
        },
        {
            title: 'System Health',
            value: isError ? 'Degraded' : 'Online',
            description: 'Admin API availability',
            icon: Server,
        },
    ] as const;

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm font-medium">
                    SYSTEM_ADMIN
                </p>
                <h1 className="text-3xl font-semibold tracking-normal">
                    Global Dashboard
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                    Monitor tenant growth, parking inventory, trusted devices,
                    and traffic across the SmartPark SaaS control plane.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-sm">
                                    {stat.title}
                                </CardTitle>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {stat.description}
                                </p>
                            </div>
                            <div className="bg-muted flex size-9 items-center justify-center rounded-lg border">
                                <stat.icon className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-9 w-24" />
                            ) : (
                                <p className="text-3xl font-semibold">
                                    {stat.value}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle>System Traffic</CardTitle>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Traffic volume returned by the admin dashboard
                                API.
                            </p>
                        </div>
                        <div className="bg-muted hidden size-9 items-center justify-center rounded-lg border sm:flex">
                            <Activity className="size-4" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-80 w-full" />
                    ) : (
                        <SystemTrafficChart data={data?.traffic ?? []} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
