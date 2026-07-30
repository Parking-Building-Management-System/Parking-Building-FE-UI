'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    KeyRound,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
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
    DropdownMenuSeparator,
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
import { managerKioskDeviceQueryKeys } from '@/service/manager/kiosk-device-api';
import { managerPasswordResetQueryKeys } from '@/service/manager/password-reset-api';
import {
    createManagerStaffApi,
    deleteManagerStaffApi,
    listManagerStaffApi,
    managerStaffQueryKeys,
    resetManagerStaffPasswordApi,
    updateManagerStaffApi,
    updateManagerStaffStatusApi,
} from '@/service/manager/staff-api';
import {
    managerStaffStatusValues,
    type CreateManagerStaffRequest,
    type ManagerStaffItem,
    type ManagerStaffListParams,
    type ManagerStaffStatus,
    type ResetManagerStaffPasswordRequest,
    type UpdateManagerStaffRequest,
} from '@/service/manager/staff-type';

const ALL_STATUSES = 'ALL_STATUSES';
const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;

type StaffStatusFilter = ManagerStaffStatus | typeof ALL_STATUSES;

interface StaffDialogState {
    open: boolean;
    staff?: ManagerStaffItem;
}

export function StaffAccounts() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [status, setStatus] = useState<StaffStatusFilter>(ALL_STATUSES);
    const [page, setPage] = useState(DEFAULT_PAGE);
    const [dialog, setDialog] = useState<StaffDialogState>({ open: false });
    const [resetStaff, setResetStaff] = useState<ManagerStaffItem | undefined>();
    const [deleteStaff, setDeleteStaff] = useState<ManagerStaffItem | undefined>();

    const params = useMemo<ManagerStaffListParams>(
        () => ({
            search: deferredSearch.trim() || undefined,
            status: status === ALL_STATUSES ? undefined : status,
            page,
            size: DEFAULT_PAGE_SIZE,
        }),
        [deferredSearch, page, status],
    );

    const staffQuery = useQuery({
        queryKey: managerStaffQueryKeys.staffList(params),
        queryFn: () => listManagerStaffApi(params),
        placeholderData: keepPreviousData,
    });

    const statusMutation = useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string;
            status: ManagerStaffStatus;
        }) => updateManagerStaffStatusApi(id, { status }),
        onSuccess: () => {
            toast.success('Staff status updated.');
            queryClient.invalidateQueries({
                queryKey: managerStaffQueryKeys.staff,
            });
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update staff status.'),
            );
        },
    });

    useEffect(() => {
        if (staffQuery.isError) {
            toast.error(
                getErrorMessage(staffQuery.error, 'Failed to load staff.'),
            );
        }
    }, [staffQuery.error, staffQuery.isError]);

    const staffPage = staffQuery.data;
    const staff = staffPage?.content ?? [];
    const normalizedPage = staffPage?.page ?? page;
    const normalizedSize = staffPage?.size ?? DEFAULT_PAGE_SIZE;
    const totalElements = staffPage?.totalElements ?? 0;
    const totalPages =
        normalizedSize > 0 ? Math.ceil(totalElements / normalizedSize) : 0;

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Staff Accounts
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        Manage tenant staff users. Staff device is not trusted
                        yet. Device approval/kiosk binding will be configured
                        later.
                    </p>
                </div>
                <Button onClick={() => setDialog({ open: true })}>
                    <Plus data-icon="inline-start" />
                    Create Staff
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="relative">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            className="pl-8"
                            placeholder="Search staff"
                            value={search}
                            onChange={(event) => {
                                setPage(DEFAULT_PAGE);
                                setSearch(event.target.value);
                            }}
                        />
                    </div>
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setPage(DEFAULT_PAGE);
                            setStatus(value as StaffStatusFilter);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES}>
                                All statuses
                            </SelectItem>
                            {managerStaffStatusValues.map((staffStatus) => (
                                <SelectItem
                                    key={staffStatus}
                                    value={staffStatus}
                                >
                                    {staffStatus}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Staff List</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        {totalElements.toLocaleString()} accounts
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffQuery.isLoading && <StaffSkeleton />}
                            {!staffQuery.isLoading &&
                                staff.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="min-w-64">
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    {item.fullName || 'Unnamed staff'}
                                                </p>
                                                <p className="text-muted-foreground max-w-72 truncate text-xs">
                                                    {item.username}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.phone || '-'}</TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={item.status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(
                                                item.updatedAt ?? item.createdAt,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <StaffActionsMenu
                                                staff={item}
                                                disabled={
                                                    statusMutation.isPending &&
                                                    statusMutation.variables
                                                        ?.id === item.id
                                                }
                                                onEdit={() =>
                                                    setDialog({
                                                        open: true,
                                                        staff: item,
                                                    })
                                                }
                                                onReset={() =>
                                                    setResetStaff(item)
                                                }
                                                onDelete={() =>
                                                    setDeleteStaff(item)
                                                }
                                                onStatusChange={(nextStatus) =>
                                                    statusMutation.mutate({
                                                        id: item.id,
                                                        status: nextStatus,
                                                    })
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!staffQuery.isLoading && staffQuery.isError && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <p>Failed to load staff accounts.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => staffQuery.refetch()}
                                            >
                                                Retry
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {!staffQuery.isLoading &&
                                !staffQuery.isError &&
                                staff.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <p>No staff accounts yet.</p>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    setDialog({ open: true })
                                                }
                                            >
                                                <Plus data-icon="inline-start" />
                                                Create Staff
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t pt-4">
                        <p className="text-muted-foreground text-sm">
                            Page {totalPages === 0 ? 0 : normalizedPage + 1} of{' '}
                            {totalPages.toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    normalizedPage === 0 ||
                                    staffQuery.isFetching
                                }
                                onClick={() =>
                                    setPage((current) =>
                                        Math.max(DEFAULT_PAGE, current - 1),
                                    )
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    totalPages === 0 ||
                                    normalizedPage + 1 >= totalPages ||
                                    staffQuery.isFetching
                                }
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <StaffDialog
                key={dialog.staff?.id ?? 'create'}
                open={dialog.open}
                staff={dialog.staff}
                onOpenChange={(open) =>
                    setDialog((current) => ({
                        ...current,
                        open,
                        staff: open ? current.staff : undefined,
                    }))
                }
            />
            <ResetPasswordDialog
                staff={resetStaff}
                onOpenChange={(open) => {
                    if (!open) {
                        setResetStaff(undefined);
                    }
                }}
            />
            <DeleteStaffDialog
                key={deleteStaff?.id ?? 'no-delete-target'}
                staff={deleteStaff}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteStaff(undefined);
                    }
                }}
            />
        </div>
    );
}

function StaffDialog({
    open,
    staff,
    onOpenChange,
}: {
    open: boolean;
    staff?: ManagerStaffItem;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<
        CreateManagerStaffRequest | UpdateManagerStaffRequest
    >(
        staff
            ? {
                  fullName: staff.fullName,
                  phone: staff.phone,
                  status: staff.status,
              }
            : {
                  username: '',
                  initialPassword: '',
                  fullName: '',
                  phone: '',
                  status: 'ACTIVE',
              },
    );

    const mutation = useMutation({
        mutationFn: () =>
            staff
                ? updateManagerStaffApi(
                      staff.id,
                      form as UpdateManagerStaffRequest,
                  )
                : createManagerStaffApi(
                      form as CreateManagerStaffRequest,
                  ),
        onSuccess: () => {
            toast.success(staff ? 'Staff updated.' : 'Staff created.');
            queryClient.invalidateQueries({
                queryKey: managerStaffQueryKeys.staff,
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(
                    error,
                    staff ? 'Failed to update staff.' : 'Failed to create staff.',
                ),
            );
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {staff ? 'Edit staff' : 'Create staff'}
                    </DialogTitle>
                    <DialogDescription>
                        Staff account creation does not bind or trust a device.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        mutation.mutate();
                    }}
                >
                    {!staff && (
                        <>
                            <Input
                                placeholder="Username"
                                value={
                                    (form as CreateManagerStaffRequest)
                                        .username
                                }
                                disabled={mutation.isPending}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        username: event.target.value,
                                    }))
                                }
                            />
                            <Input
                                type="password"
                                placeholder="Initial password"
                                value={
                                    (form as CreateManagerStaffRequest)
                                        .initialPassword
                                }
                                disabled={mutation.isPending}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        initialPassword: event.target.value,
                                    }))
                                }
                            />
                        </>
                    )}
                    <Input
                        placeholder="Full name"
                        value={form.fullName}
                        disabled={mutation.isPending}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                fullName: event.target.value,
                            }))
                        }
                    />
                    <Input
                        placeholder="Phone"
                        value={form.phone}
                        disabled={mutation.isPending}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                phone: event.target.value,
                            }))
                        }
                    />
                    <Select
                        value={form.status ?? 'ACTIVE'}
                        disabled={mutation.isPending}
                        onValueChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                status: value as ManagerStaffStatus,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {managerStaffStatusValues.map((staffStatus) => (
                                <SelectItem
                                    key={staffStatus}
                                    value={staffStatus}
                                >
                                    {staffStatus}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="text-muted-foreground rounded-lg border p-3 text-xs">
                        Staff device is not trusted yet. Device approval/kiosk
                        binding will be configured later.
                    </div>
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

function ResetPasswordDialog({
    staff,
    onOpenChange,
}: {
    staff?: ManagerStaffItem;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<ResetManagerStaffPasswordRequest>({
        newPassword: '',
    });
    const mutation = useMutation({
        mutationFn: () =>
            resetManagerStaffPasswordApi(staff?.id ?? '', form),
        onSuccess: () => {
            toast.success('Staff password reset. Active sessions were revoked.');
            queryClient.invalidateQueries({
                queryKey: managerStaffQueryKeys.staff,
            });
            setForm({ newPassword: '' });
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to reset staff password.'),
            );
        },
    });

    return (
        <Dialog open={!!staff} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset password</DialogTitle>
                    <DialogDescription>
                        Reset password for {staff?.username}. This revokes
                        active sessions for the staff account.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        mutation.mutate();
                    }}
                >
                    <Input
                        type="password"
                        placeholder="New password"
                        value={form.newPassword}
                        disabled={mutation.isPending}
                        onChange={(event) =>
                            setForm({ newPassword: event.target.value })
                        }
                    />
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={mutation.isPending || !staff}
                        >
                            {mutation.isPending
                                ? 'Resetting...'
                                : 'Reset Password'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function StaffActionsMenu({
    staff,
    disabled,
    onEdit,
    onReset,
    onDelete,
    onStatusChange,
}: {
    staff: ManagerStaffItem;
    disabled: boolean;
    onEdit: () => void;
    onReset: () => void;
    onDelete: () => void;
    onStatusChange: (status: ManagerStaffStatus) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" disabled={disabled}>
                    <MoreHorizontal />
                    <span className="sr-only">
                        Actions for {staff.fullName || staff.username}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    <Pencil />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReset}>
                    <KeyRound />
                    Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {managerStaffStatusValues.map((staffStatus) => (
                    <DropdownMenuItem
                        key={staffStatus}
                        disabled={staffStatus === staff.status}
                        onClick={() => onStatusChange(staffStatus)}
                    >
                        Mark {staffStatus}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 />
                    Delete Account
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function DeleteStaffDialog({
    staff,
    onOpenChange,
}: {
    staff?: ManagerStaffItem;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [confirmation, setConfirmation] = useState('');
    const normalizedConfirmation = confirmation.trim();
    const confirmed =
        normalizedConfirmation === 'DELETE' ||
        normalizedConfirmation === staff?.username;
    const mutation = useMutation({
        mutationFn: () => deleteManagerStaffApi(staff?.id ?? ''),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: managerStaffQueryKeys.staff,
                }),
                queryClient.invalidateQueries({
                    queryKey: managerKioskDeviceQueryKeys.kiosks,
                }),
                queryClient.invalidateQueries({
                    queryKey: managerKioskDeviceQueryKeys.deviceApprovals,
                }),
                queryClient.invalidateQueries({
                    queryKey: managerPasswordResetQueryKeys.all,
                }),
            ]);
            toast.success('Staff account deleted and active access revoked.');
            setConfirmation('');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to delete Staff account.'),
            );
        },
    });

    const changeOpen = (open: boolean) => {
        if (mutation.isPending) {
            return;
        }
        if (!open) {
            setConfirmation('');
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={Boolean(staff)} onOpenChange={changeOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Staff account</DialogTitle>
                    <DialogDescription>
                        This permanently disables login access for{' '}
                        <span className="text-foreground font-medium">
                            {staff?.fullName || 'this Staff member'}
                        </span>
                        .
                    </DialogDescription>
                </DialogHeader>

                <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-4 text-sm">
                    <p className="font-medium">{staff?.username}</p>
                    <ul className="text-muted-foreground list-disc space-y-1 pl-5">
                        <li>Account login will be disabled.</li>
                        <li>Every active session will be revoked.</li>
                        <li>Kiosk assignments and device access will be disabled.</li>
                        <li>Cash, inspection, violation, and audit history will remain.</li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="delete-staff-confirmation"
                        className="text-sm font-medium"
                    >
                        Type <span className="font-mono">DELETE</span> or{' '}
                        <span className="font-mono">{staff?.username}</span> to
                        confirm
                    </label>
                    <Input
                        id="delete-staff-confirmation"
                        autoComplete="off"
                        value={confirmation}
                        disabled={mutation.isPending}
                        onChange={(event) =>
                            setConfirmation(event.target.value)
                        }
                    />
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={mutation.isPending}
                        onClick={() => changeOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={!staff || !confirmed || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending
                            ? 'Deleting account...'
                            : 'Delete account'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function StatusBadge({ status }: { status: ManagerStaffStatus }) {
    return (
        <span className="bg-muted inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
            {status}
        </span>
    );
}

function StaffSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell colSpan={5}>
                        <Skeleton className="h-6 w-full" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

function formatDate(value?: string) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString();
}
