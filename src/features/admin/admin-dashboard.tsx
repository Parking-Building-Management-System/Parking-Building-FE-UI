'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    AlertTriangle,
    Building2,
    ParkingCircle,
    Plus,
    Server,
    ShieldAlert,
    UsersRound,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
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

const mockTenantGrowth = [
    { month: 'Jan', tenants: 18 },
    { month: 'Feb', tenants: 24 },
    { month: 'Mar', tenants: 31 },
    { month: 'Apr', tenants: 38 },
    { month: 'May', tenants: 46 },
    { month: 'Jun', tenants: 55 },
];

const mockTenantStatus = [
    { name: 'Active', value: 48, color: 'var(--primary)' },
    { name: 'Suspended', value: 7, color: 'var(--muted-foreground)' },
];

const mockProvisionedTenants = [
    { name: 'Metro Center Parking', plan: 'Enterprise', age: '2h ago' },
    { name: 'Rivergate Mall', plan: 'Business', age: '1d ago' },
    { name: 'Airport West Garage', plan: 'Enterprise', age: '3d ago' },
];

const mockRiskAlerts = [
    {
        title: 'Tenant suspended',
        detail: 'Old Quarter Parking suspended for overdue invoice.',
    },
    {
        title: 'No manager login yet',
        detail: 'Saigon Tower tenant has not completed first manager login.',
    },
    {
        title: 'API error spike',
        detail: 'Gate session API reached 2.4% errors in the last hour.',
    },
];

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
            value: data?.activeTenantCount ?? 48,
            description: data ? 'From admin API' : 'Mock data / API pending',
            icon: Building2,
        },
        {
            title: 'Suspended Tenants',
            value: 7,
            description: 'Mock data / API pending',
            icon: ShieldAlert,
        },
        {
            title: 'Total Parkings',
            value: data?.parkingCount ?? 136,
            description: data ? 'From admin API' : 'Mock data / API pending',
            icon: ParkingCircle,
        },
        {
            title: 'Total Manager Accounts',
            value: 214,
            description: 'Mock data / API pending',
            icon: UsersRound,
        },
        {
            title: 'Active Sessions Today',
            value: 18420,
            description: 'Mock data / API pending',
            icon: Activity,
        },
        {
            title: 'API Error Rate',
            value: '0.42%',
            description: 'Mock data / API pending',
            icon: Server,
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
                        risk signals, and global parking inventory.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                        <Link href="/admin/tenants/new">
                            <Plus data-icon="inline-start" />
                            Create Tenant
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/master-data/vehicle-types">
                            Manage Vehicle Types
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/system-health">
                            View System Health
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                            {isLoading &&
                            stat.description === 'From admin API' ? (
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

            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                <ChartCard title="Tenant Growth Over Time">
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={mockTenantGrowth}>
                            <CartesianGrid
                                stroke="var(--border)"
                                vertical={false}
                                strokeDasharray="4 4"
                            />
                            <XAxis dataKey="month" tickLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area
                                dataKey="tenants"
                                stroke="var(--primary)"
                                fill="var(--primary)"
                                fillOpacity={0.18}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Tenant Status Breakdown">
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={mockTenantStatus}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={56}
                                outerRadius={92}
                                paddingAngle={4}
                            >
                                {mockTenantStatus.map((entry) => (
                                    <Cell
                                        key={entry.name}
                                        fill={entry.color}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard title="Request Volume / API Traffic">
                {isLoading ? (
                    <Skeleton className="h-72 w-full" />
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={
                                trafficData.length
                                    ? trafficData
                                    : [
                                          {
                                              label: 'Mock Mon',
                                              requests: 12400,
                                              errors: 34,
                                          },
                                          {
                                              label: 'Mock Tue',
                                              requests: 15120,
                                              errors: 45,
                                          },
                                          {
                                              label: 'Mock Wed',
                                              requests: 16940,
                                              errors: 51,
                                          },
                                          {
                                              label: 'Mock Thu',
                                              requests: 14380,
                                              errors: 38,
                                          },
                                      ]
                            }
                        >
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
                )}
            </ChartCard>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recently Provisioned Tenants</CardTitle>
                        <p className="text-muted-foreground text-xs">
                            Mock data / API pending
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {mockProvisionedTenants.map((tenant) => (
                            <div
                                key={tenant.name}
                                className="flex items-center justify-between gap-4 rounded-lg border p-3"
                            >
                                <div>
                                    <p className="font-medium">
                                        {tenant.name}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {tenant.plan}
                                    </p>
                                </div>
                                <span className="text-muted-foreground text-xs">
                                    {tenant.age}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Risk Alerts</CardTitle>
                        <p className="text-muted-foreground text-xs">
                            Mock data / API pending
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {mockRiskAlerts.map((alert) => (
                            <div
                                key={alert.title}
                                className="flex gap-3 rounded-lg border p-3"
                            >
                                <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
                                <div>
                                    <p className="font-medium">
                                        {alert.title}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {alert.detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
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
                <p className="text-muted-foreground text-xs">
                    Mock data / API pending
                </p>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
