'use client';

import {
    useDeferredValue,
    useMemo,
    useState,
    type FormEvent,
} from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Check,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Search,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    completeManagerPasswordResetRequestApi,
    getManagerPasswordResetRequestApi,
    listManagerPasswordResetRequestsApi,
    managerPasswordResetQueryKeys,
    rejectManagerPasswordResetRequestApi,
} from '@/service/manager/password-reset-api';
import {
    managerPasswordResetStatusValues,
    type ManagerPasswordResetListParams,
    type ManagerPasswordResetRequestItem,
    type ManagerPasswordResetStatus,
} from '@/service/manager/password-reset-type';

const ALL_STATUSES = 'ALL_STATUSES';
const DEFAULT_PAGE_SIZE = 20;
const PENDING_SUMMARY_PARAMS = {
    status: 'PENDING' as const,
    page: 0,
    size: 1,
};

type StatusFilter = ManagerPasswordResetStatus | typeof ALL_STATUSES;

export function PasswordResetRequests() {
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [status, setStatus] = useState<StatusFilter>(ALL_STATUSES);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(0);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
        null,
    );
    const [completeRequest, setCompleteRequest] =
        useState<ManagerPasswordResetRequestItem | null>(null);
    const [rejectRequest, setRejectRequest] =
        useState<ManagerPasswordResetRequestItem | null>(null);

    const params = useMemo<ManagerPasswordResetListParams>(
        () => ({
            search: deferredSearch.trim() || undefined,
            status: status === ALL_STATUSES ? undefined : status,
            from: from || undefined,
            to: to || undefined,
            page,
            size: DEFAULT_PAGE_SIZE,
        }),
        [deferredSearch, from, page, status, to],
    );
    const requestsQuery = useQuery({
        queryKey: managerPasswordResetQueryKeys.list(params),
        queryFn: () => listManagerPasswordResetRequestsApi(params),
        placeholderData: keepPreviousData,
    });
    const pendingSummaryQuery = useQuery({
        queryKey:
            managerPasswordResetQueryKeys.list(PENDING_SUMMARY_PARAMS),
        queryFn: () =>
            listManagerPasswordResetRequestsApi(PENDING_SUMMARY_PARAMS),
    });

    const requests = requestsQuery.data?.content ?? [];
    const totalElements = requestsQuery.data?.totalElements ?? 0;
    const totalPages = requestsQuery.data?.totalPages ?? 0;
    const currentPage = requestsQuery.data?.page ?? page;
    const pendingCount = pendingSummaryQuery.data?.totalElements ?? 0;

    const openComplete = (request: ManagerPasswordResetRequestItem) => {
        setSelectedRequestId(null);
        setCompleteRequest(request);
    };
    const openReject = (request: ManagerPasswordResetRequestItem) => {
        setSelectedRequestId(null);
        setRejectRequest(request);
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">
                    PARKING_MANAGER
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-normal">
                        Password Reset Requests
                    </h1>
                    {pendingSummaryQuery.isLoading ? (
                        <Skeleton className="h-6 w-20 rounded-full" />
                    ) : pendingCount > 0 ? (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                            {pendingCount > 99 ? '99+' : pendingCount} pending
                        </span>
                    ) : null}
                </div>
                <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
                    Verify the employee before setting a new password. Completing
                    a reset revokes every active session for that Staff account.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_190px_210px_210px]">
                    <label className="relative">
                        <span className="sr-only">
                            Search Staff name or email
                        </span>
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            className="pl-8"
                            placeholder="Search Staff name or email"
                            value={search}
                            onChange={(event) => {
                                setPage(0);
                                setSearch(event.target.value);
                            }}
                        />
                    </label>
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setPage(0);
                            setStatus(value as StatusFilter);
                        }}
                    >
                        <SelectTrigger aria-label="Request status">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES}>
                                All statuses
                            </SelectItem>
                            {managerPasswordResetStatusValues.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {humanize(value)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <label className="space-y-1">
                        <span className="text-muted-foreground text-xs">
                            Requested from
                        </span>
                        <Input
                            type="datetime-local"
                            value={from}
                            onChange={(event) => {
                                setPage(0);
                                setFrom(event.target.value);
                            }}
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-muted-foreground text-xs">
                            Requested to
                        </span>
                        <Input
                            type="datetime-local"
                            value={to}
                            onChange={(event) => {
                                setPage(0);
                                setTo(event.target.value);
                            }}
                        />
                    </label>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Request Queue</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        {totalElements.toLocaleString()} requests
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff</TableHead>
                                <TableHead>Account status</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead>Request status</TableHead>
                                <TableHead>Reviewed by</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requestsQuery.isLoading && <RequestSkeleton />}
                            {!requestsQuery.isLoading &&
                                requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="min-w-60">
                                            <p className="font-medium">
                                                {request.staffFullName ||
                                                    'Unnamed Staff'}
                                            </p>
                                            <p className="text-muted-foreground max-w-72 truncate text-xs">
                                                {request.staffUsername ||
                                                    request.requestedEmail}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                value={request.staffStatus}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(
                                                request.requestedAt,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                value={request.status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {request.reviewedByName || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelectedRequestId(
                                                            request.id,
                                                        )
                                                    }
                                                >
                                                    Details
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={
                                                        request.status !==
                                                        'PENDING'
                                                    }
                                                    onClick={() =>
                                                        openComplete(request)
                                                    }
                                                >
                                                    <KeyRound data-icon="inline-start" />
                                                    Complete
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={
                                                        request.status !==
                                                        'PENDING'
                                                    }
                                                    onClick={() =>
                                                        openReject(request)
                                                    }
                                                >
                                                    <X data-icon="inline-start" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!requestsQuery.isLoading &&
                            requestsQuery.isError ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <p>
                                                {getErrorMessage(
                                                    requestsQuery.error,
                                                    'Failed to load password reset requests.',
                                                )}
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    requestsQuery.refetch()
                                                }
                                            >
                                                Retry
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : null}
                            {!requestsQuery.isLoading &&
                            !requestsQuery.isError &&
                            requests.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        No password reset requests match these
                                        filters.
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t pt-4">
                        <p className="text-muted-foreground text-sm">
                            Page {totalPages === 0 ? 0 : currentPage + 1} of{' '}
                            {totalPages.toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    currentPage === 0 ||
                                    requestsQuery.isFetching
                                }
                                onClick={() =>
                                    setPage((value) => Math.max(0, value - 1))
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    totalPages === 0 ||
                                    currentPage + 1 >= totalPages ||
                                    requestsQuery.isFetching
                                }
                                onClick={() => setPage((value) => value + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <RequestDetailDialog
                requestId={selectedRequestId}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedRequestId(null);
                    }
                }}
                onComplete={openComplete}
                onReject={openReject}
            />
            <CompleteResetDialog
                key={completeRequest?.id ?? 'complete-closed'}
                request={completeRequest}
                onOpenChange={(open) => {
                    if (!open) {
                        setCompleteRequest(null);
                    }
                }}
            />
            <RejectRequestDialog
                key={rejectRequest?.id ?? 'reject-closed'}
                request={rejectRequest}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectRequest(null);
                    }
                }}
            />
        </div>
    );
}

function RequestDetailDialog({
    requestId,
    onOpenChange,
    onComplete,
    onReject,
}: {
    requestId: string | null;
    onOpenChange: (open: boolean) => void;
    onComplete: (request: ManagerPasswordResetRequestItem) => void;
    onReject: (request: ManagerPasswordResetRequestItem) => void;
}) {
    const detailQuery = useQuery({
        queryKey: managerPasswordResetQueryKeys.detail(requestId ?? 'none'),
        queryFn: () => getManagerPasswordResetRequestApi(requestId ?? ''),
        enabled: Boolean(requestId),
    });
    const request = detailQuery.data;

    return (
        <Dialog open={Boolean(requestId)} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Password reset request</DialogTitle>
                    <DialogDescription>
                        Review the Staff account and request history before
                        taking action.
                    </DialogDescription>
                </DialogHeader>
                {detailQuery.isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-4/5" />
                    </div>
                ) : detailQuery.isError ? (
                    <p className="text-destructive text-sm">
                        {getErrorMessage(
                            detailQuery.error,
                            'Failed to load request details.',
                        )}
                    </p>
                ) : request ? (
                    <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">Staff</dt>
                        <dd>{request.staffFullName || '-'}</dd>
                        <dt className="text-muted-foreground">Email / login</dt>
                        <dd className="break-all">{request.staffUsername}</dd>
                        <dt className="text-muted-foreground">
                            Account status
                        </dt>
                        <dd>{humanize(request.staffStatus)}</dd>
                        <dt className="text-muted-foreground">Requested</dt>
                        <dd>{formatDateTime(request.requestedAt)}</dd>
                        <dt className="text-muted-foreground">
                            Request status
                        </dt>
                        <dd>{humanize(request.status)}</dd>
                        <dt className="text-muted-foreground">Reviewed</dt>
                        <dd>{formatDateTime(request.reviewedAt)}</dd>
                        <dt className="text-muted-foreground">Reviewed by</dt>
                        <dd>{request.reviewedByName || '-'}</dd>
                        {request.rejectionReason ? (
                            <>
                                <dt className="text-muted-foreground">
                                    Rejection reason
                                </dt>
                                <dd className="whitespace-pre-wrap">
                                    {request.rejectionReason}
                                </dd>
                            </>
                        ) : null}
                    </dl>
                ) : null}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    {request?.status === 'PENDING' ? (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => onReject(request)}
                            >
                                Reject
                            </Button>
                            <Button onClick={() => onComplete(request)}>
                                Complete Reset
                            </Button>
                        </>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CompleteResetDialog({
    request,
    onOpenChange,
}: {
    request: ManagerPasswordResetRequestItem | null;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [identityVerified, setIdentityVerified] = useState(false);
    const mismatch =
        confirmPassword.length > 0 && newPassword !== confirmPassword;
    const passwordValid =
        newPassword.length >= 8 &&
        newPassword.length <= 72 &&
        newPassword === confirmPassword;
    const mutation = useMutation({
        mutationFn: () =>
            completeManagerPasswordResetRequestApi(request?.id ?? '', {
                newPassword,
                confirmPassword,
            }),
        onSuccess: async (completed) => {
            setNewPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setIdentityVerified(false);
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: managerPasswordResetQueryKeys.lists,
                }),
                queryClient.invalidateQueries({
                    queryKey: managerPasswordResetQueryKeys.detail(
                        completed.id,
                    ),
                }),
            ]);
            toast.success(
                'Password reset completed. Previous Staff sessions were revoked.',
            );
            onOpenChange(false);
        },
        onError: (error) =>
            toast.error(
                getErrorMessage(error, 'Failed to complete password reset.'),
            ),
    });

    const close = () => {
        if (mutation.isPending) {
            return;
        }
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setIdentityVerified(false);
        onOpenChange(false);
    };
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!passwordValid || !identityVerified || !request) {
            return;
        }
        mutation.mutate();
    };

    return (
        <Dialog open={Boolean(request)} onOpenChange={(open) => !open && close()}>
            <DialogContent>
                <form className="space-y-4" onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Complete password reset</DialogTitle>
                        <DialogDescription>
                            Set a new password for{' '}
                            <strong>
                                {request?.staffFullName ||
                                    request?.staffUsername}
                            </strong>
                            . This security action revokes every active session
                            for the Staff account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New password</Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                minLength={8}
                                maxLength={72}
                                className="pr-10"
                                value={newPassword}
                                disabled={mutation.isPending}
                                onChange={(event) =>
                                    setNewPassword(event.target.value)
                                }
                            />
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                aria-label={
                                    showPassword
                                        ? 'Hide passwords'
                                        : 'Show passwords'
                                }
                                onClick={() =>
                                    setShowPassword((value) => !value)
                                }
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Use 8–72 characters. The current password cannot be
                            reused.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                            Confirm new password
                        </Label>
                        <Input
                            id="confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            value={confirmPassword}
                            disabled={mutation.isPending}
                            aria-invalid={mismatch}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                        />
                        {mismatch ? (
                            <p className="text-destructive text-xs" role="alert">
                                Password confirmation does not match.
                            </p>
                        ) : null}
                    </div>
                    <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                        <Checkbox
                            className="mt-0.5"
                            checked={identityVerified}
                            disabled={mutation.isPending}
                            onCheckedChange={(checked) =>
                                setIdentityVerified(checked === true)
                            }
                        />
                        <span>
                            I verified the employee&apos;s identity and
                            understand that all active Staff sessions will be
                            revoked.
                        </span>
                    </label>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={mutation.isPending}
                            onClick={close}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={
                                mutation.isPending ||
                                !passwordValid ||
                                !identityVerified
                            }
                        >
                            {mutation.isPending ? (
                                <Loader2
                                    className="animate-spin"
                                    data-icon="inline-start"
                                />
                            ) : (
                                <Check data-icon="inline-start" />
                            )}
                            Complete Reset
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RejectRequestDialog({
    request,
    onOpenChange,
}: {
    request: ManagerPasswordResetRequestItem | null;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState('');
    const normalizedReason = reason.trim();
    const mutation = useMutation({
        mutationFn: () =>
            rejectManagerPasswordResetRequestApi(request?.id ?? '', {
                reason: normalizedReason,
            }),
        onSuccess: async (rejected) => {
            setReason('');
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: managerPasswordResetQueryKeys.lists,
                }),
                queryClient.invalidateQueries({
                    queryKey: managerPasswordResetQueryKeys.detail(rejected.id),
                }),
            ]);
            toast.success('Password reset request rejected.');
            onOpenChange(false);
        },
        onError: (error) =>
            toast.error(
                getErrorMessage(error, 'Failed to reject reset request.'),
            ),
    });
    const close = () => {
        if (!mutation.isPending) {
            setReason('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={Boolean(request)} onOpenChange={(open) => !open && close()}>
            <DialogContent>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (request && normalizedReason.length >= 3) {
                            mutation.mutate();
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Reject password reset request</DialogTitle>
                        <DialogDescription>
                            The Staff password and current sessions will remain
                            unchanged.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="rejection-reason">
                            Rejection reason
                        </Label>
                        <textarea
                            id="rejection-reason"
                            className="border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
                            minLength={3}
                            maxLength={1000}
                            required
                            value={reason}
                            disabled={mutation.isPending}
                            placeholder="Explain why the employee identity could not be verified."
                            onChange={(event) => setReason(event.target.value)}
                        />
                        {reason.length > 0 && normalizedReason.length < 3 ? (
                            <p className="text-destructive text-xs" role="alert">
                                Enter a meaningful reason of at least 3
                                characters.
                            </p>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={mutation.isPending}
                            onClick={close}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={
                                mutation.isPending ||
                                normalizedReason.length < 3
                            }
                        >
                            {mutation.isPending ? (
                                <Loader2
                                    className="animate-spin"
                                    data-icon="inline-start"
                                />
                            ) : (
                                <X data-icon="inline-start" />
                            )}
                            Reject Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RequestSkeleton() {
    return Array.from({ length: 4 }, (_, index) => (
        <TableRow key={index}>
            <TableCell>
                <Skeleton className="h-5 w-44" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-32" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-28" />
            </TableCell>
            <TableCell>
                <Skeleton className="ml-auto h-7 w-48" />
            </TableCell>
        </TableRow>
    ));
}

function StatusBadge({ value }: { value: string }) {
    const normalized = value.toUpperCase();
    const className =
        normalized === 'PENDING'
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
            : normalized === 'COMPLETED' || normalized === 'ACTIVE'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-muted-foreground/25 bg-muted text-muted-foreground';

    return (
        <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
        >
            {humanize(value)}
        </span>
    );
}

function humanize(value: string) {
    return value
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function formatDateTime(value?: string | null) {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-US');
}
