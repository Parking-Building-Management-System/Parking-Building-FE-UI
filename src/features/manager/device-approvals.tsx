'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    approveManagerDeviceApi,
    listManagerDeviceApprovalsApi,
    listManagerKiosksApi,
    managerKioskDeviceQueryKeys,
    rejectManagerDeviceApprovalApi,
    revokeManagerDeviceApi,
} from '@/service/manager/kiosk-device-api';
import type { DeviceApprovalItem } from '@/service/manager/kiosk-device-type';

type ApprovalExpiryMode = 'PERMANENT' | 'TEMPORARY';

export function DeviceApprovals() {
    const queryClient = useQueryClient();
    const [approval, setApproval] = useState<DeviceApprovalItem | undefined>();
    const approvalsQuery = useQuery({
        queryKey: managerKioskDeviceQueryKeys.deviceApprovals,
        queryFn: listManagerDeviceApprovalsApi,
        retry: false,
    });
    const pendingCount = getPendingApprovalCount(approvalsQuery.data);
    const rejectMutation = useMutation({
        mutationFn: rejectManagerDeviceApprovalApi,
        onSuccess: () => {
            toast.success('Device request rejected.');
            queryClient.invalidateQueries({
                queryKey: managerKioskDeviceQueryKeys.deviceApprovals,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to reject device.'));
        },
    });
    const revokeMutation = useMutation({
        mutationFn: revokeManagerDeviceApi,
        onSuccess: () => {
            toast.success('Device access revoked.');
            queryClient.invalidateQueries({
                queryKey: managerKioskDeviceQueryKeys.deviceApprovals,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to revoke device.'));
        },
    });

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">
                    PARKING_MANAGER
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-normal">
                        Device Approvals
                    </h1>
                    {approvalsQuery.isLoading ? (
                        <Skeleton className="h-6 w-20 rounded-full" />
                    ) : !approvalsQuery.isError && pendingCount > 0 ? (
                        <PendingBadge count={pendingCount} />
                    ) : null}
                </div>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                    Review pending staff devices and bind approved devices to
                    kiosks only after staff assignment is in place.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Approval Queue</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        {(approvalsQuery.data?.length ?? 0).toLocaleString()}{' '}
                        requests
                    </p>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Fingerprint</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead>Bound Kiosk</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {approvalsQuery.isLoading && <ApprovalSkeleton />}
                            {!approvalsQuery.isLoading &&
                                (approvalsQuery.data ?? []).map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="min-w-56">
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    {item.staffFullName ||
                                                        item.fullName ||
                                                        item.staffUsername ||
                                                        item.username ||
                                                        'Staff'}
                                                </p>
                                                <p className="text-muted-foreground max-w-64 truncate text-xs">
                                                    {item.staffUsername ||
                                                        item.username ||
                                                        item.staffId ||
                                                        item.userId ||
                                                        '-'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.deviceLabel ||
                                                item.label ||
                                                'Unlabeled device'}
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs">
                                                {shortFingerprint(
                                                    item.fingerprint,
                                                )}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge value={item.status} />
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(
                                                item.requestedAt ??
                                                    item.createdAt,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.kioskName ||
                                                item.parkingName ||
                                                '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    disabled={
                                                        item.status !==
                                                            'PENDING' ||
                                                        rejectMutation.isPending
                                                    }
                                                    onClick={() =>
                                                        setApproval(item)
                                                    }
                                                >
                                                    <Check data-icon="inline-start" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                        item.status !==
                                                            'PENDING' ||
                                                        rejectMutation.isPending
                                                    }
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                'Reject this device request?',
                                                            )
                                                        ) {
                                                            rejectMutation.mutate(
                                                                item.id,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <X data-icon="inline-start" />
                                                    Reject
                                                </Button>
                                                {item.deviceId && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={
                                                            revokeMutation.isPending
                                                        }
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    'Revoke this device access?',
                                                                )
                                                            ) {
                                                                revokeMutation.mutate(
                                                                    item.deviceId ??
                                                                        '',
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Revoke
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!approvalsQuery.isLoading &&
                                approvalsQuery.isError && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-muted-foreground h-28 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <p>
                                                    Device approvals API could
                                                    not be loaded.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        approvalsQuery.refetch()
                                                    }
                                                >
                                                    Retry
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            {!approvalsQuery.isLoading &&
                                !approvalsQuery.isError &&
                                (approvalsQuery.data?.length ?? 0) === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-muted-foreground h-28 text-center"
                                        >
                                            No pending device approvals.
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ApproveDeviceDialog
                approval={approval}
                onOpenChange={(open) => {
                    if (!open) {
                        setApproval(undefined);
                    }
                }}
            />
        </div>
    );
}

function ApproveDeviceDialog({
    approval,
    onOpenChange,
}: {
    approval?: DeviceApprovalItem;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [kioskId, setKioskId] = useState('');
    const [expiryMode, setExpiryMode] =
        useState<ApprovalExpiryMode>('PERMANENT');
    const [expiresAt, setExpiresAt] = useState('');
    const kiosksQuery = useQuery({
        queryKey: managerKioskDeviceQueryKeys.kioskList({ status: 'ACTIVE' }),
        queryFn: () => listManagerKiosksApi({ status: 'ACTIVE' }),
        enabled: !!approval,
        retry: false,
    });
    const approveMutation = useMutation({
        mutationFn: () => {
            const temporaryExpiresAt =
                expiryMode === 'TEMPORARY'
                    ? getFutureExpiresAtIso(expiresAt)
                    : null;

            return approveManagerDeviceApi(approval?.id ?? '', {
                kioskId,
                expiresAt: temporaryExpiresAt,
            });
        },
        onSuccess: () => {
            toast.success('Device approved.');
            queryClient.invalidateQueries({
                queryKey: managerKioskDeviceQueryKeys.deviceApprovals,
            });
            onOpenChange(false);
            setKioskId('');
            setExpiryMode('PERMANENT');
            setExpiresAt('');
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to approve device. Confirm this staff account is assigned to the selected kiosk.',
                ),
            );
        },
    });
    const temporaryInvalid =
        expiryMode === 'TEMPORARY' && !isFutureDateTime(expiresAt);

    return (
        <Dialog
            open={!!approval}
            onOpenChange={(open) => {
                if (!open) {
                    setKioskId('');
                    setExpiryMode('PERMANENT');
                    setExpiresAt('');
                }

                onOpenChange(open);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve staff device</DialogTitle>
                    <DialogDescription>
                        Select the active kiosk this staff device is allowed to
                        operate from.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Select
                        value={kioskId}
                        disabled={kiosksQuery.isLoading || approveMutation.isPending}
                        onValueChange={setKioskId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Active kiosk" />
                        </SelectTrigger>
                        <SelectContent>
                            {(kiosksQuery.data ?? []).map((kiosk) => (
                                <SelectItem key={kiosk.id} value={kiosk.id}>
                                    {kiosk.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={
                                    expiryMode === 'PERMANENT'
                                        ? 'secondary'
                                        : 'outline'
                                }
                                disabled={approveMutation.isPending}
                                onClick={() => {
                                    setExpiryMode('PERMANENT');
                                    setExpiresAt('');
                                }}
                            >
                                Permanent
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    expiryMode === 'TEMPORARY'
                                        ? 'secondary'
                                        : 'outline'
                                }
                                disabled={approveMutation.isPending}
                                onClick={() => setExpiryMode('TEMPORARY')}
                            >
                                Temporary until
                            </Button>
                        </div>
                        {expiryMode === 'TEMPORARY' && (
                            <div className="space-y-2">
                                <Input
                                    type="datetime-local"
                                    value={expiresAt}
                                    disabled={approveMutation.isPending}
                                    min={getDateTimeLocalMin()}
                                    onChange={(event) =>
                                        setExpiresAt(event.target.value)
                                    }
                                />
                                {temporaryInvalid && (
                                    <p className="text-destructive text-xs">
                                        Temporary approval requires a future
                                        date and time.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground rounded-lg border p-3 text-xs">
                        If approval fails with staff assignment validation,
                        assign the staff account to this kiosk first.
                    </p>
                    <DialogFooter>
                        <Button
                            disabled={
                                !kioskId ||
                                temporaryInvalid ||
                                approveMutation.isPending
                            }
                            onClick={() => approveMutation.mutate()}
                        >
                            <ShieldCheck data-icon="inline-start" />
                            {approveMutation.isPending
                                ? 'Approving...'
                                : 'Approve Device'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ApprovalSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

function StatusBadge({ value }: { value: string }) {
    return (
        <span className="bg-muted inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
            {value}
        </span>
    );
}

function PendingBadge({ count }: { count: number }) {
    return (
        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
            {count.toLocaleString()} pending
        </span>
    );
}

function getPendingApprovalCount(
    items?: DeviceApprovalItem[] & { totalElements?: number },
) {
    if (!items) {
        return 0;
    }

    return items.filter((item) => item.status === 'PENDING').length;
}

function shortFingerprint(value?: string | null) {
    if (!value) {
        return '-';
    }

    return value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function formatDate(value?: string | null) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString();
}

function getFutureExpiresAtIso(value: string) {
    const parsed = new Date(value);

    if (!value || Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
        throw new Error('Temporary approval requires a future date and time.');
    }

    return parsed.toISOString();
}

function isFutureDateTime(value: string) {
    if (!value) {
        return false;
    }

    const parsed = new Date(value);

    return !Number.isNaN(parsed.getTime()) && parsed > new Date();
}

function getDateTimeLocalMin() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);

    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16);
}
