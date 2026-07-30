'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/admin/error-message';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
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
import {
    approveViolationReportApi,
    getViolationReportApi,
    listViolationReportsApi,
    rejectViolationReportApi,
    staffQueryKeys,
    type StaffViolationReportResponse,
} from '@/service/staff';

const ALL_STATUSES = 'ALL';

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-US');
};

const formatMoney = (value?: number | null, currency = 'VND') => {
    if (typeof value !== 'number') {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'VND' ? 0 : 2,
    }).format(value);
};

export function StaffViolationReports() {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState(ALL_STATUSES);
    const [reportedPlate, setReportedPlate] = useState('');
    const [selectedReportId, setSelectedReportId] = useState<string | null>(
        null,
    );
    const [approvalOpen, setApprovalOpen] = useState(false);
    const params = useMemo(
        () => ({
            status: status === ALL_STATUSES ? undefined : status,
            reportedPlate: reportedPlate.trim() || undefined,
        }),
        [reportedPlate, status],
    );
    const reportsQuery = useQuery({
        queryKey: [...staffQueryKeys.violationReports, params],
        queryFn: () => listViolationReportsApi(params),
    });
    const detailQuery = useQuery({
        queryKey: staffQueryKeys.violationReport(selectedReportId ?? 'none'),
        queryFn: () => getViolationReportApi(selectedReportId ?? ''),
        enabled: !!selectedReportId,
    });

    const refreshReports = () => {
        queryClient.invalidateQueries({
            queryKey: staffQueryKeys.violationReports,
        });
        queryClient.invalidateQueries({
            queryKey: staffQueryKeys.pendingViolationReportCount,
        });
        if (selectedReportId) {
            queryClient.invalidateQueries({
                queryKey: staffQueryKeys.violationReport(selectedReportId),
            });
        }
        queryClient.invalidateQueries({ queryKey: staffQueryKeys.exitPreview });
    };

    const approveMutation = useMutation({
        mutationFn: ({ id, plate, note }: { id: string; plate: string; note?: string }) =>
            approveViolationReportApi(id, {
                confirmedOffenderPlateNumber: plate,
                note,
            }),
        onSuccess: () => {
            setApprovalOpen(false);
            toast.success('Violation report approved and penalty applied.');
            refreshReports();
        },
        onError: (error) =>
            toast.error(getErrorMessage(error, 'Failed to approve report.')),
    });
    const rejectMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note: string }) =>
            rejectViolationReportApi(id, { note }),
        onSuccess: () => {
            toast.success('Violation report rejected.');
            refreshReports();
        },
        onError: (error) =>
            toast.error(getErrorMessage(error, 'Failed to reject report.')),
    });

    const pendingCount = (reportsQuery.data ?? []).filter(
        (report) => report.status === 'REPORTED',
    ).length;

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm font-medium">STAFF</p>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-normal">
                        Violation Reports
                    </h1>
                    {pendingCount > 0 ? (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            {pendingCount} pending
                        </span>
                    ) : null}
                </div>
            </div>

            <Card>
                <CardContent className="flex flex-col gap-3 pt-6 md:flex-row">
                    <label className="relative flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            className="pl-9"
                            value={reportedPlate}
                            placeholder="Search reported plate"
                            onChange={(event) =>
                                setReportedPlate(event.target.value)
                            }
                        />
                    </label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="md:w-52">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                            <SelectItem value="REPORTED">Pending review</SelectItem>
                            <SelectItem value="APPLIED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Occupied-slot reports</CardTitle>
                    <CardDescription>
                        Reports are limited to the current kiosk parking.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reported</TableHead>
                                <TableHead>Victim</TableHead>
                                <TableHead>Reported offender</TableHead>
                                <TableHead>Slots</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Review</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportsQuery.isLoading ? (
                                <ReportRowsSkeleton />
                            ) : reportsQuery.isError ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-destructive h-24 text-center"
                                    >
                                        {getErrorMessage(
                                            reportsQuery.error,
                                            'Failed to load violation reports.',
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (reportsQuery.data ?? []).length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-muted-foreground h-24 text-center"
                                    >
                                        No violation reports found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (reportsQuery.data ?? []).map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            {formatDateTime(report.reportedAt)}
                                        </TableCell>
                                        <TableCell>
                                            {report.victimPlateNumber ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {report.reportedOffenderPlateNumber ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {report.oldSlotCode ?? '-'} to{' '}
                                            {report.replacementSlotCode ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={report.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setSelectedReportId(report.id)
                                                }
                                            >
                                                <Eye data-icon="inline-start" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ViolationReportDetailDialog
                open={!!selectedReportId}
                report={detailQuery.data}
                loading={detailQuery.isLoading}
                pending={approveMutation.isPending || rejectMutation.isPending}
                onApprove={({ plate, note }) => {
                    if (!selectedReportId) {
                        return;
                    }
                    approveMutation.mutate({
                        id: selectedReportId,
                        plate,
                        note,
                    });
                }}
                onApprovalConfirm={() => setApprovalOpen(true)}
                onReject={(note) => {
                    if (!selectedReportId) {
                        return;
                    }
                    rejectMutation.mutate({ id: selectedReportId, note });
                }}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedReportId(null);
                        setApprovalOpen(false);
                    }
                }}
            />
            <ApproveReportDialog
                open={approvalOpen}
                pending={approveMutation.isPending}
                onConfirm={() => {
                    const form = document.getElementById(
                        'violation-report-review-form',
                    ) as HTMLFormElement | null;
                    form?.requestSubmit();
                }}
                onOpenChange={setApprovalOpen}
            />
        </div>
    );
}

function ViolationReportDetailDialog({
    open,
    report,
    loading,
    pending,
    onApprove,
    onApprovalConfirm,
    onReject,
    onOpenChange,
}: {
    open: boolean;
    report?: StaffViolationReportResponse;
    loading: boolean;
    pending: boolean;
    onApprove: (values: { plate: string; note?: string }) => void;
    onApprovalConfirm: () => void;
    onReject: (note: string) => void;
    onOpenChange: (open: boolean) => void;
}) {
    const [plate, setPlate] = useState('');
    const [note, setNote] = useState('');

    const isPending = report?.status === 'REPORTED';
    const submitApproval = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!plate.trim()) {
            toast.error('Confirm the offender plate number before approval.');
            return;
        }
        onApprove({ plate: plate.trim(), note: note.trim() || undefined });
    };

    const reject = () => {
        if (!note.trim()) {
            toast.error('A review note is required to reject a report.');
            return;
        }
        onReject(note.trim());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Violation report review</DialogTitle>
                    <DialogDescription>
                        Confirm the vehicle in the reported slot before applying a penalty.
                    </DialogDescription>
                </DialogHeader>
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : report ? (
                    <div className="space-y-5">
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <Detail label="Victim" value={report.victimPlateNumber} />
                            <Detail
                                label="Reported offender"
                                value={report.reportedOffenderPlateNumber}
                            />
                            <Detail label="Reported slot" value={report.oldSlotCode} />
                            <Detail
                                label="Replacement slot"
                                value={report.replacementSlotCode}
                            />
                            <Detail label="Reported at" value={formatDateTime(report.reportedAt)} />
                            <Detail label="Status" value={report.status} />
                        </div>
                        <EvidenceImages report={report} />
                        {report.reportNote ? (
                            <Detail label="Driver note" value={report.reportNote} />
                        ) : null}
                        {isPending ? (
                            <form
                                id="violation-report-review-form"
                                className="space-y-3"
                                onSubmit={submitApproval}
                            >
                                <label className="space-y-1.5">
                                    <span className="text-sm font-medium">
                                        Confirmed offender plate
                                    </span>
                                    <Input
                                        value={plate}
                                        placeholder={
                                            report.matchedOffenderPlateNumber ??
                                            report.reportedOffenderPlateNumber ??
                                            'Plate number'
                                        }
                                        disabled={pending}
                                        onChange={(event) => setPlate(event.target.value)}
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-sm font-medium">
                                        Review note
                                    </span>
                                    <Input
                                        value={note}
                                        placeholder="Required when rejecting"
                                        disabled={pending}
                                        onChange={(event) => setNote(event.target.value)}
                                    />
                                </label>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={pending}
                                        onClick={reject}
                                    >
                                        <X data-icon="inline-start" />
                                        Reject
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={pending || !plate.trim()}
                                        onClick={onApprovalConfirm}
                                    >
                                        <Check data-icon="inline-start" />
                                        Approve
                                    </Button>
                                </DialogFooter>
                            </form>
                        ) : (
                            <div className="rounded-md border p-3 text-sm">
                                <Detail
                                    label="Reviewed by"
                                    value={report.reviewedByStaffName}
                                />
                                <Detail
                                    label="Review note"
                                    value={report.reviewNote}
                                />
                                {report.status === 'APPLIED' ? (
                                    <Detail
                                        label="Applied penalty"
                                        value={formatMoney(
                                            report.appliedAmount,
                                            report.currency ?? 'VND',
                                        )}
                                    />
                                ) : null}
                            </div>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

function ApproveReportDialog({
    open,
    pending,
    onConfirm,
    onOpenChange,
}: {
    open: boolean;
    pending: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Apply penalty?</DialogTitle>
                    <DialogDescription>
                        Approval creates a charge for the confirmed offender at exit.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={pending}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" disabled={pending} onClick={onConfirm}>
                        {pending ? <Loader2 className="animate-spin" /> : null}
                        Apply penalty
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EvidenceImages({ report }: { report: StaffViolationReportResponse }) {
    const images = [
        ['Report evidence', report.evidenceImageUrl],
        ['Victim entry', report.victimEntryImageUrl],
        ['Victim plate', report.victimLicensePlateImageUrl],
        ['Offender entry', report.offenderEntryImageUrl],
        ['Offender plate', report.offenderLicensePlateImageUrl],
    ].filter((item): item is [string, string] => Boolean(item[1]));

    if (images.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {images.map(([label, url]) => (
                <a
                    key={label}
                    className="overflow-hidden rounded-md border"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed object-storage URLs cannot use Next image optimization. */}
                    <img
                        className="aspect-video w-full object-cover"
                        src={url}
                        alt={label}
                    />
                    <span className="block p-2 text-xs font-medium">{label}</span>
                </a>
            ))}
        </div>
    );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-medium">{value || '-'}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const className =
        status === 'REPORTED'
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-800'
            : status === 'APPLIED'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800'
              : 'border-muted bg-muted text-muted-foreground';
    return <span className={`rounded-full border px-2 py-1 text-xs font-medium ${className}`}>{status}</span>;
}

function ReportRowsSkeleton() {
    return (
        <>
            {Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                            <Skeleton className="h-5 w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}
