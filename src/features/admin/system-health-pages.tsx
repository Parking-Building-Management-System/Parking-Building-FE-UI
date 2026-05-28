'use client';

import type { ComponentType, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    AlertTriangle,
    Clock,
    Database,
    Server,
    ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    getSystemHealthErrorsApi,
    getSystemHealthServicesApi,
    getSystemHealthSummaryApi,
    getSystemHealthTopEndpointsApi,
    getSystemHealthTrafficApi,
    systemAdminQueryKeys,
} from '@/service/admin/system-admin-api';
import type {
    SystemHealthServiceItem,
    SystemTrafficPoint,
} from '@/service/admin/system-admin-type';

export function ApiHealthPageContent() {
    const summaryQuery = useQuery({
        queryKey: systemAdminQueryKeys.healthSummary,
        queryFn: getSystemHealthSummaryApi,
    });
    const servicesQuery = useQuery({
        queryKey: systemAdminQueryKeys.healthServices,
        queryFn: getSystemHealthServicesApi,
    });

    const summary = summaryQuery.data;

    return (
        <AdminPageShell
            title="API Health"
            subtitle="Monitor platform API status, uptime, request volume, and dependency health."
        >
            {summaryQuery.isLoading ? (
                <LoadingPanel label="Loading system health summary..." />
            ) : summaryQuery.isError ? (
                <ErrorPanel
                    label="Failed to load system health summary."
                    onRetry={() => summaryQuery.refetch()}
                />
            ) : summary ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        icon={Activity}
                        label="Overall Status"
                        value={summary.status || '-'}
                        detail={`Timestamp: ${formatDateTime(summary.timestamp)}`}
                    />
                    <MetricCard
                        icon={Clock}
                        label="Uptime"
                        value={formatDuration(summary.uptimeSeconds)}
                        detail={`${summary.uptimeSeconds.toLocaleString()} seconds`}
                    />
                    <MetricCard
                        icon={Server}
                        label="Total Requests"
                        value={summary.totalRequests.toLocaleString()}
                        detail="Last 24 hours"
                    />
                    <MetricCard
                        icon={ShieldCheck}
                        label="Error Rate"
                        value={formatPercent(summary.errorRate)}
                        detail="Last 24 hours"
                    />
                    <MetricCard
                        icon={Activity}
                        label="Average Latency"
                        value={`${summary.avgLatencyMs.toLocaleString()} ms`}
                        detail="Last 24 hours"
                    />
                    <MetricCard
                        icon={Database}
                        label="Active Tenants"
                        value={summary.activeTenants.toLocaleString()}
                        detail="Currently active"
                    />
                    <MetricCard
                        icon={Server}
                        label="Active Sessions"
                        value={summary.activeSessions.toLocaleString()}
                        detail="Current session count"
                    />
                </div>
            ) : (
                <EmptyPanel label="No system health summary available." />
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Service Checks</CardTitle>
                </CardHeader>
                <CardContent>
                    {servicesQuery.isLoading ? (
                        <LoadingPanel label="Loading service health..." />
                    ) : servicesQuery.isError ? (
                        <ErrorPanel
                            label="Failed to load service health."
                            onRetry={() => servicesQuery.refetch()}
                        />
                    ) : (servicesQuery.data ?? []).length > 0 ? (
                        <ServiceTable services={servicesQuery.data ?? []} />
                    ) : (
                        <EmptyPanel label="No service health checks available." />
                    )}
                </CardContent>
            </Card>
        </AdminPageShell>
    );
}

export function ApiTrafficPageContent() {
    const defaultRange = useMemo(() => getDefaultTrafficRange(), []);
    const [from, setFrom] = useState(defaultRange.from);
    const [to, setTo] = useState(defaultRange.to);
    const [granularity, setGranularity] = useState('HOUR');
    const topEndpointLimit = 10;

    const trafficQuery = useQuery({
        queryKey: systemAdminQueryKeys.traffic(from, to, granularity),
        queryFn: () =>
            getSystemHealthTrafficApi({
                from: toIsoDateTime(from),
                to: toIsoDateTime(to),
                granularity,
            }),
    });
    const topEndpointsQuery = useQuery({
        queryKey: systemAdminQueryKeys.topEndpoints(
            from,
            to,
            topEndpointLimit,
        ),
        queryFn: () =>
            getSystemHealthTopEndpointsApi({
                from: toIsoDateTime(from),
                to: toIsoDateTime(to),
                limit: topEndpointLimit,
            }),
    });
    const errorsQuery = useQuery({
        queryKey: systemAdminQueryKeys.healthErrors(from, to),
        queryFn: () =>
            getSystemHealthErrorsApi({
                from: toIsoDateTime(from),
                to: toIsoDateTime(to),
            }),
    });

    const traffic = trafficQuery.data ?? [];
    const totals = getTrafficTotals(traffic);

    return (
        <AdminPageShell
            title="API Traffic"
            subtitle="Review real request telemetry, latency, top endpoints, and recent errors."
        >
            <Card>
                <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
                    <label className="space-y-1 text-sm">
                        <span className="text-muted-foreground">From</span>
                        <Input
                            type="datetime-local"
                            value={from}
                            onChange={(event) => setFrom(event.target.value)}
                        />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span className="text-muted-foreground">To</span>
                        <Input
                            type="datetime-local"
                            value={to}
                            onChange={(event) => setTo(event.target.value)}
                        />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span className="text-muted-foreground">
                            Granularity
                        </span>
                        <select
                            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                            value={granularity}
                            onChange={(event) =>
                                setGranularity(event.target.value)
                            }
                        >
                            <option value="MINUTE">Minute</option>
                            <option value="HOUR">Hour</option>
                            <option value="DAY">Day</option>
                        </select>
                    </label>
                    <div className="flex items-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                trafficQuery.refetch();
                                topEndpointsQuery.refetch();
                                errorsQuery.refetch();
                            }}
                        >
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    icon={Activity}
                    label="Requests"
                    value={totals.requests.toLocaleString()}
                    detail="Selected period"
                />
                <MetricCard
                    icon={AlertTriangle}
                    label="Errors"
                    value={totals.errors.toLocaleString()}
                    detail={`${formatPercent(totals.errorRate)} error rate`}
                />
                <MetricCard
                    icon={Clock}
                    label="Average Latency"
                    value={`${Math.round(totals.avgLatencyMs).toLocaleString()} ms`}
                    detail="Weighted by request count"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Request Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    {trafficQuery.isLoading ? (
                        <LoadingPanel label="Loading traffic telemetry..." />
                    ) : trafficQuery.isError ? (
                        <ErrorPanel
                            label="Failed to load traffic telemetry."
                            onRetry={() => trafficQuery.refetch()}
                        />
                    ) : traffic.length > 0 ? (
                        <TrafficTrend traffic={traffic} />
                    ) : (
                        <EmptyPanel label="No traffic telemetry available for this period." />
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topEndpointsQuery.isLoading ? (
                            <LoadingPanel label="Loading top endpoints..." />
                        ) : topEndpointsQuery.isError ? (
                            <ErrorPanel
                                label="Failed to load top endpoints."
                                onRetry={() => topEndpointsQuery.refetch()}
                            />
                        ) : (topEndpointsQuery.data ?? []).length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Path</TableHead>
                                        <TableHead>Requests</TableHead>
                                        <TableHead>Errors</TableHead>
                                        <TableHead>Avg Latency</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(topEndpointsQuery.data ?? []).map(
                                        (endpoint) => (
                                            <TableRow
                                                key={`${endpoint.method}-${endpoint.path}`}
                                            >
                                                <TableCell className="font-medium">
                                                    {endpoint.method}
                                                </TableCell>
                                                <TableCell className="max-w-xs break-all">
                                                    <code>
                                                        {endpoint.path}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    {endpoint.requestCount.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {endpoint.errorCount.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {endpoint.avgLatencyMs.toLocaleString()}{' '}
                                                    ms
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            <EmptyPanel label="No top endpoint telemetry available for this period." />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {errorsQuery.isLoading ? (
                            <LoadingPanel label="Loading recent errors..." />
                        ) : errorsQuery.isError ? (
                            <ErrorPanel
                                label="Failed to load recent errors."
                                onRetry={() => errorsQuery.refetch()}
                            />
                        ) : (errorsQuery.data ?? []).length > 0 ? (
                            <div className="space-y-3">
                                {(errorsQuery.data ?? []).map(
                                    (error, index) => (
                                        <div
                                            key={`${error.timestamp}-${error.path}-${index}`}
                                            className="rounded-lg border p-3 text-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-medium break-all">
                                                        {error.method || '-'}{' '}
                                                        {error.path || '-'}
                                                    </p>
                                                    <p className="text-muted-foreground mt-1">
                                                        {error.message ||
                                                            error.errorCode ||
                                                            'No message'}
                                                    </p>
                                                </div>
                                                <StatusPill
                                                    status={String(
                                                        error.status ?? 'ERR',
                                                    )}
                                                />
                                            </div>
                                            <p className="text-muted-foreground mt-2 text-xs">
                                                {formatDateTime(
                                                    error.timestamp,
                                                )}{' '}
                                                · Count {error.count ?? 1}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            <EmptyPanel label="No errors available for this period." />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminPageShell>
    );
}

function ServiceTable({ services }: { services: SystemHealthServiceItem[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Message</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {services.map((service) => (
                    <TableRow key={service.name}>
                        <TableCell className="font-medium">
                            {service.name}
                        </TableCell>
                        <TableCell>
                            <StatusPill status={service.status} />
                        </TableCell>
                        <TableCell>
                            {typeof service.latencyMs === 'number'
                                ? `${service.latencyMs.toLocaleString()} ms`
                                : '-'}
                        </TableCell>
                        <TableCell>
                            {formatDateTime(service.lastCheckedAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {service.message || '-'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function TrafficTrend({ traffic }: { traffic: SystemTrafficPoint[] }) {
    const maxRequests = Math.max(...traffic.map((point) => point.requestCount));

    return (
        <div className="space-y-3">
            {traffic.map((point) => (
                <div
                    key={point.timestamp}
                    className="grid grid-cols-[140px_minmax(0,1fr)_160px] items-center gap-3 text-sm"
                >
                    <span className="text-muted-foreground">
                        {formatShortDateTime(point.timestamp)}
                    </span>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                        <div
                            className="bg-primary h-full rounded-full"
                            style={{
                                width: `${maxRequests > 0 ? (point.requestCount / maxRequests) * 100 : 0}%`,
                            }}
                        />
                    </div>
                    <span className="text-right font-medium">
                        {point.requestCount.toLocaleString()} req ·{' '}
                        {point.avgLatencyMs.toLocaleString()} ms
                    </span>
                </div>
            ))}
        </div>
    );
}

function AdminPageShell({
    children,
    subtitle,
    title,
}: {
    children: ReactNode;
    subtitle: string;
    title: string;
}) {
    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm font-medium">
                    SYSTEM_ADMIN
                </p>
                <h1 className="text-3xl font-semibold tracking-normal">
                    {title}
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                    {subtitle}
                </p>
            </div>
            {children}
        </div>
    );
}

function MetricCard({
    detail,
    icon: Icon,
    label,
    value,
}: {
    detail: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-start gap-3">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg border">
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="mt-1 text-xl font-semibold break-words">
                        {value}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                        {detail}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusPill({ status }: { status: string }) {
    const normalizedStatus = status.toUpperCase();

    return (
        <span
            className={cn(
                'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                ['UP', 'OPERATIONAL', 'ACTIVE', '200'].includes(
                    normalizedStatus,
                )
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : normalizedStatus === 'UNCONFIGURED'
                      ? 'border-muted-foreground/30 bg-muted text-muted-foreground'
                      : ['DOWN', 'ERR'].includes(normalizedStatus) ||
                          Number(normalizedStatus) >= 500
                        ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
            )}
        >
            {status || '-'}
        </span>
    );
}

function LoadingPanel({ label }: { label: string }) {
    return (
        <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            {label}
        </div>
    );
}

function ErrorPanel({
    label,
    onRetry,
}: {
    label: string;
    onRetry: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm">
            <p>{label}</p>
            <Button type="button" variant="outline" onClick={onRetry}>
                Retry
            </Button>
        </div>
    );
}

function EmptyPanel({ label }: { label: string }) {
    return (
        <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            {label}
        </div>
    );
}

function getTrafficTotals(traffic: SystemTrafficPoint[]) {
    const requests = traffic.reduce((total, point) => total + point.requestCount, 0);
    const errors = traffic.reduce((total, point) => total + point.errorCount, 0);
    const latencyTotal = traffic.reduce(
        (total, point) => total + point.avgLatencyMs * point.requestCount,
        0,
    );

    return {
        requests,
        errors,
        errorRate: requests > 0 ? errors / requests : 0,
        avgLatencyMs: requests > 0 ? latencyTotal / requests : 0,
    };
}

function getDefaultTrafficRange() {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);

    return {
        from: toDatetimeLocalValue(from),
        to: toDatetimeLocalValue(to),
    };
}

function toDatetimeLocalValue(date: Date) {
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toISOString();
}

function formatDateTime(value?: string | null) {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString('en-US');
}

function formatShortDateTime(value: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDuration(seconds: number) {
    const days = Math.floor(seconds / 86_400);
    const hours = Math.floor((seconds % 86_400) / 3_600);
    const minutes = Math.floor((seconds % 3_600) / 60);

    if (days > 0) {
        return `${days}d ${hours}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

function formatPercent(value: number) {
    return `${(value * 100).toFixed(2)}%`;
}
