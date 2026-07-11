'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
    Building2,
    ParkingCircle,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminQueryKeys, getDashboardStats } from '@/service/admin/api';
import { getErrorMessage } from './error-message';

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

    const trafficData =
        data?.traffic?.map((item) => ({
            label: new Date(item.bucketStart).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
            }),
            requests: item.requestCount,
            errors: item.errorCount,
        })) ?? [];

    const statCards = [
        {
            title: 'Active Tenants',
            value: data?.activeTenantCount,
            description: 'From admin API',
            icon: Building2,
        },
        {
            title: 'Total Parkings',
            value: data?.parkingCount,
            description: 'From admin API',
            icon: ParkingCircle,
        },
    ];

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        SYSTEM_ADMIN
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        SaaS Global Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
                        Control-plane view for tenant health, platform traffic,
                        platform traffic, and global parking inventory.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/master-data/vehicle-types">
                            Manage Vehicle Types
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/system-health/api">
                            View System Health
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                                    {typeof stat.value === 'number'
                                        ? stat.value.toLocaleString()
                                        : stat.value}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <ChartCard title="Request Volume / API Traffic">
                {isLoading ? (
                    <Skeleton className="h-72 w-full" />
                ) : trafficData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={trafficData}>
                            <CartesianGrid
                                stroke="var(--border)"
                                vertical={false}
                                strokeDasharray="4 4"
                            />
                            <XAxis dataKey="label" tickLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar
                                dataKey="requests"
                                fill="var(--primary)"
                                radius={[6, 6, 0, 0]}
                            />
                            <Bar
                                dataKey="errors"
                                fill="var(--destructive)"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-muted-foreground flex h-72 items-center justify-center rounded-md border border-dashed text-sm">
                        No traffic data available.
                    </div>
                )}
            </ChartCard>
        </div>
    );
}

function ChartCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
