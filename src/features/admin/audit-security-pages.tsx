'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
    forceLogoutAdminUserApi,
    getAdminDevicesApi,
    getAdminSessionsApi,
    getAuditLogsApi,
    revokeAdminDeviceApi,
    revokeAdminSessionApi,
    systemAdminQueryKeys,
} from '@/service/admin/system-admin-api';
import type {
    AdminDeviceItem,
    AdminSessionItem,
    AuditLogItem,
} from '@/service/admin/system-admin-type';
import { getErrorMessage } from './error-message';

const PAGE_SIZE = 20;

export function AuditLogsPageContent() {
    const [role, setRole] = useState('');
    const [severity, setSeverity] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(0);

    const auditLogsQuery = useQuery({
        queryKey: systemAdminQueryKeys.auditLogs(
            '',
            role,
            severity,
            from,
            to,
            page,
            PAGE_SIZE,
        ),
        queryFn: () =>
            getAuditLogsApi({
                role,
                severity,
                from: from ? toIsoDateTime(from) : undefined,
                to: to ? toIsoDateTime(to) : undefined,
                page,
                size: PAGE_SIZE,
            }),
    });

    const pageData = auditLogsQuery.data;
    const logs = pageData?.content ?? [];

    return (
        <AdminPageShell
            title="Audit Logs"
            subtitle="Inspect privileged actions across tenants and global System Admin modules."
        >
            <Card>
                <CardContent className="grid gap-3 md:grid-cols-[180px_180px_1fr_1fr_auto]">
                    <label className="space-y-1 text-sm">
                        <span className="text-muted-foreground">Role</span>
                        <Input
                            placeholder="SYSTEM_ADMIN"
                            value={role}
                            onChange={(event) => {
                                setRole(event.target.value);
                                setPage(0);
                            }}
                        />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span className="text-muted-foreground">
                            Severity
                        </span>
                        <Input
                            placeholder="INFO"
                            value={severity}
                            onChange={(event) => {
                                setSeverity(event.target.value);
                                setPage(0);
                            }}
                        />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span className="text-muted-foreground">From</span>
                        <Input
                            type="datetime-local"
                            value={from}
                            onChange={(event) => {
                                setFrom(event.target.value);
                                setPage(0);
                            }}
                        />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span className="text-muted-foreground">To</span>
                        <Input
                            type="datetime-local"
                            value={to}
                            onChange={(event) => {
                                setTo(event.target.value);
                                setPage(0);
                            }}
                        />
                    </label>
                    <div className="flex items-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => auditLogsQuery.refetch()}
                        >
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Audit Events</CardTitle>
                </CardHeader>
                <CardContent>
                    {auditLogsQuery.isLoading ? (
                        <StatePanel label="Loading audit logs..." />
                    ) : auditLogsQuery.isError ? (
                        <ErrorPanel
                            label="Failed to load audit logs."
                            onRetry={() => auditLogsQuery.refetch()}
                        />
                    ) : logs.length > 0 ? (
                        <>
                            <AuditLogsTable logs={logs} />
                            <PaginationFooter
                                page={page}
                                pageData={pageData}
                                onPageChange={setPage}
                            />
                        </>
                    ) : (
                        <StatePanel label="No audit logs found." />
                    )}
                </CardContent>
            </Card>
        </AdminPageShell>
    );
}

export function ForceLogoutSessionsPageContent() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'sessions' | 'devices'>(
        'sessions',
    );
    const [sessionStatus, setSessionStatus] = useState('');
    const [deviceStatus, setDeviceStatus] = useState('');

    const sessionsQuery = useQuery({
        queryKey: systemAdminQueryKeys.sessions(
            '',
            '',
            sessionStatus,
            0,
            PAGE_SIZE,
        ),
        queryFn: () =>
            getAdminSessionsApi({
                status: sessionStatus,
                page: 0,
                size: PAGE_SIZE,
            }),
    });

    const devicesQuery = useQuery({
        queryKey: systemAdminQueryKeys.devices('', deviceStatus, 0, PAGE_SIZE),
        queryFn: () =>
            getAdminDevicesApi({
                status: deviceStatus,
                page: 0,
                size: PAGE_SIZE,
            }),
    });

    const revokeSessionMutation = useMutation({
        mutationFn: (session: AdminSessionItem) =>
            revokeAdminSessionApi(
                session.id,
                `System Admin revoked session for ${session.username}`,
            ),
        onSuccess: async () => {
            toast.success('Session revoked.');
            await queryClient.invalidateQueries({
                queryKey: ['admin-sessions'],
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to revoke session.'));
        },
    });

    const forceLogoutMutation = useMutation({
        mutationFn: (session: AdminSessionItem) =>
            forceLogoutAdminUserApi(
                session.userId,
                `System Admin forced logout for ${session.username}`,
            ),
        onSuccess: async () => {
            toast.success('User sessions revoked.');
            await queryClient.invalidateQueries({
                queryKey: ['admin-sessions'],
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to force logout user.'));
        },
    });

    const revokeDeviceMutation = useMutation({
        mutationFn: (device: AdminDeviceItem) =>
            revokeAdminDeviceApi(
                device.id,
                `System Admin revoked device for ${device.username ?? device.userId}`,
            ),
        onSuccess: async () => {
            toast.success('Device revoked.');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-devices'] }),
                queryClient.invalidateQueries({ queryKey: ['admin-sessions'] }),
            ]);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to revoke device.'));
        },
    });

    return (
        <AdminPageShell
            title="Force Logout Sessions"
            subtitle="Review sessions and devices across tenants, then revoke risky access when needed."
        >
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant={activeTab === 'sessions' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('sessions')}
                >
                    Sessions
                </Button>
                <Button
                    type="button"
                    variant={activeTab === 'devices' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('devices')}
                >
                    Devices
                </Button>
            </div>

            {activeTab === 'sessions' ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle>Sessions</CardTitle>
                        <Input
                            className="max-w-48"
                            placeholder="Status filter"
                            value={sessionStatus}
                            onChange={(event) =>
                                setSessionStatus(event.target.value)
                            }
                        />
                    </CardHeader>
                    <CardContent>
                        {sessionsQuery.isLoading ? (
                            <StatePanel label="Loading sessions..." />
                        ) : sessionsQuery.isError ? (
                            <ErrorPanel
                                label="Failed to load sessions."
                                onRetry={() => sessionsQuery.refetch()}
                            />
                        ) : (sessionsQuery.data?.content ?? []).length > 0 ? (
                            <SessionsTable
                                forceLogoutPending={
                                    forceLogoutMutation.isPending
                                }
                                revokePending={
                                    revokeSessionMutation.isPending
                                }
                                sessions={sessionsQuery.data?.content ?? []}
                                onForceLogout={(session) => {
                                    if (
                                        window.confirm(
                                            `Force logout all active sessions for ${session.username}?`,
                                        )
                                    ) {
                                        forceLogoutMutation.mutate(session);
                                    }
                                }}
                                onRevokeSession={(session) => {
                                    if (
                                        window.confirm(
                                            `Revoke session ${shortId(session.id)}?`,
                                        )
                                    ) {
                                        revokeSessionMutation.mutate(session);
                                    }
                                }}
                            />
                        ) : (
                            <StatePanel label="No sessions found." />
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle>Devices</CardTitle>
                        <Input
                            className="max-w-48"
                            placeholder="Status filter"
                            value={deviceStatus}
                            onChange={(event) =>
                                setDeviceStatus(event.target.value)
                            }
                        />
                    </CardHeader>
                    <CardContent>
                        {devicesQuery.isLoading ? (
                            <StatePanel label="Loading devices..." />
                        ) : devicesQuery.isError ? (
                            <ErrorPanel
                                label="Failed to load devices."
                                onRetry={() => devicesQuery.refetch()}
                            />
                        ) : (devicesQuery.data?.content ?? []).length > 0 ? (
                            <DevicesTable
                                devices={devicesQuery.data?.content ?? []}
                                revokePending={revokeDeviceMutation.isPending}
                                onRevokeDevice={(device) => {
                                    if (
                                        window.confirm(
                                            `Revoke device ${device.label || shortId(device.id)}?`,
                                        )
                                    ) {
                                        revokeDeviceMutation.mutate(device);
                                    }
                                }}
                            />
                        ) : (
                            <StatePanel label="No devices found." />
                        )}
                    </CardContent>
                </Card>
            )}
        </AdminPageShell>
    );
}

function AuditLogsTable({ logs }: { logs: AuditLogItem[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>IP / Device</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log) => (
                    <TableRow key={log.id}>
                        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                        <TableCell>
                            {log.tenantName || log.tenantId || 'Global'}
                        </TableCell>
                        <TableCell className="font-medium">
                            {log.actorUsername || log.actorId || '-'}
                        </TableCell>
                        <TableCell>{log.actorRole || '-'}</TableCell>
                        <TableCell>{log.action || '-'}</TableCell>
                        <TableCell className="max-w-xs break-all">
                            {log.resourceType || '-'}
                            {log.resourceId ? ` / ${shortId(log.resourceId)}` : ''}
                        </TableCell>
                        <TableCell>
                            <SeverityPill severity={log.severity || 'INFO'} />
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs whitespace-normal">
                            {log.reason || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs whitespace-normal">
                            {log.ipAddress || '-'}
                            <br />
                            {log.deviceFingerprint || '-'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function SessionsTable({
    forceLogoutPending,
    onForceLogout,
    onRevokeSession,
    revokePending,
    sessions,
}: {
    forceLogoutPending: boolean;
    onForceLogout: (session: AdminSessionItem) => void;
    onRevokeSession: (session: AdminSessionItem) => void;
    revokePending: boolean;
    sessions: AdminSessionItem[];
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Revoked At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sessions.map((session) => (
                    <TableRow key={session.id}>
                        <TableCell className="font-medium">
                            {session.username}
                        </TableCell>
                        <TableCell>{session.role || '-'}</TableCell>
                        <TableCell>
                            {session.tenantName || session.tenantId || 'Global'}
                        </TableCell>
                        <TableCell>
                            {session.deviceLabel ||
                                shortId(session.deviceId) ||
                                '-'}
                        </TableCell>
                        <TableCell>
                            <StatusPill status={session.status || '-'} />
                        </TableCell>
                        <TableCell>{formatDateTime(session.createdAt)}</TableCell>
                        <TableCell>{formatDateTime(session.expiresAt)}</TableCell>
                        <TableCell>{formatDateTime(session.revokedAt)}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                        revokePending ||
                                        session.status === 'REVOKED'
                                    }
                                    onClick={() => onRevokeSession(session)}
                                >
                                    Revoke Session
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={forceLogoutPending}
                                    onClick={() => onForceLogout(session)}
                                >
                                    Force Logout User
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function DevicesTable({
    devices,
    onRevokeDevice,
    revokePending,
}: {
    devices: AdminDeviceItem[];
    onRevokeDevice: (device: AdminDeviceItem) => void;
    revokePending: boolean;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Fingerprint</TableHead>
                    <TableHead>Kiosk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved At</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {devices.map((device) => (
                    <TableRow key={device.id}>
                        <TableCell className="font-medium">
                            {device.username || device.userId}
                        </TableCell>
                        <TableCell>
                            {device.tenantName || device.tenantId || 'Global'}
                        </TableCell>
                        <TableCell>{device.label || '-'}</TableCell>
                        <TableCell>
                            {shortId(device.fingerprint) || '-'}
                        </TableCell>
                        <TableCell>
                            {device.kioskName || shortId(device.kioskId) || '-'}
                        </TableCell>
                        <TableCell>
                            <StatusPill status={device.status || '-'} />
                        </TableCell>
                        <TableCell>{formatDateTime(device.approvedAt)}</TableCell>
                        <TableCell>{formatDateTime(device.expiresAt)}</TableCell>
                        <TableCell className="text-right">
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={
                                    revokePending ||
                                    device.status === 'SUSPENDED' ||
                                    device.status === 'REVOKED'
                                }
                                onClick={() => onRevokeDevice(device)}
                            >
                                Revoke Device
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
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

function PaginationFooter({
    onPageChange,
    page,
    pageData,
}: {
    onPageChange: (page: number) => void;
    page: number;
    pageData?: { totalElements: number; totalPages: number };
}) {
    if (!pageData) {
        return null;
    }

    return (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
                {pageData.totalElements.toLocaleString()} total events
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page <= 0}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </Button>
                <span className="text-muted-foreground">
                    Page {page + 1} of {Math.max(pageData.totalPages, 1)}
                </span>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page + 1 >= pageData.totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

function StatePanel({ label }: { label: string }) {
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

function SeverityPill({ severity }: { severity: string }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                severity === 'WARN' || severity === 'WARNING'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : severity === 'ERROR' || severity === 'CRITICAL'
                      ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            )}
        >
            {severity}
        </span>
    );
}

function StatusPill({ status }: { status: string }) {
    const normalizedStatus = status.toUpperCase();

    return (
        <span
            className={cn(
                'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                normalizedStatus === 'ACTIVE' ||
                    normalizedStatus === 'APPROVED'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : normalizedStatus === 'REVOKED' ||
                        normalizedStatus === 'SUSPENDED'
                      ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
                      : 'border-muted-foreground/30 bg-muted text-muted-foreground',
            )}
        >
            {status}
        </span>
    );
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

function toIsoDateTime(value: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toISOString();
}

function shortId(value?: string | null) {
    if (!value) {
        return '';
    }

    return value.length > 12 ? value.slice(0, 12) : value;
}
