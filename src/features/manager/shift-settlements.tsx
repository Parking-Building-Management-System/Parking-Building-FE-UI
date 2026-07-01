'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Banknote, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/features/admin/error-message';
import { cn } from '@/lib/utils';
import {
    listParkingsApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';
import {
    getShiftSettlementDetailApi,
    getShiftSettlementsApi,
    managerShiftSettlementQueryKeys,
} from '@/service/manager/shift-settlement-api';
import type {
    ManagerShiftSettlementListItem,
    ManagerShiftSettlementListParams,
    ManagerShiftSettlementTransaction,
} from '@/service/manager/shift-settlement-type';
import {
    listManagerStaffApi,
    managerStaffQueryKeys,
} from '@/service/manager/staff-api';

const ALL_PARKINGS = 'ALL_PARKINGS';
const ALL_STAFF = 'ALL_STAFF';
const ALL_STATUSES = 'ALL_STATUSES';
const PAGE_SIZE = 20;

const formatMoney = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const transactionTypeLabels: Record<string, string> = {
    PARKING_CASH: 'Parking cash',
    SURCHARGE_CASH: 'Surcharge cash',
    PENALTY_CASH: 'Penalty cash',
    LOST_CARD_FINE: 'Lost card fine',
    ADJUSTMENT: 'Adjustment',
};

const sourceLabels: Record<string, string> = {
    NORMAL_EXIT: 'Normal exit',
    LOST_CARD_EXIT: 'Lost card exit',
    PENALTY_COLLECTION: 'Penalty collection',
};

export function ManagerShiftSettlements() {
    const [parkingId, setParkingId] = useState(ALL_PARKINGS);
    const [staffId, setStaffId] = useState(ALL_STAFF);
    const [status, setStatus] = useState(ALL_STATUSES);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });

    const staffQuery = useQuery({
        queryKey: managerStaffQueryKeys.staffList({ page: 0, size: 100 }),
        queryFn: () => listManagerStaffApi({ page: 0, size: 100 }),
    });

    const params = useMemo<ManagerShiftSettlementListParams>(
        () => ({
            parkingId: parkingId === ALL_PARKINGS ? undefined : parkingId,
            staffId: staffId === ALL_STAFF ? undefined : staffId,
            status:
                status === ALL_STATUSES
                    ? undefined
                    : (status as ManagerShiftSettlementListParams['status']),
            from: from || undefined,
            to: to || undefined,
            page,
            size: PAGE_SIZE,
        }),
        [from, page, parkingId, staffId, status, to],
    );

    const settlementsQuery = useQuery({
        queryKey: managerShiftSettlementQueryKeys.settlementList(params),
        queryFn: () => getShiftSettlementsApi(params),
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        if (settlementsQuery.isError) {
            toast.error(
                getErrorMessage(
                    settlementsQuery.error,
                    'Failed to load shift settlements.',
                ),
            );
        }
    }, [settlementsQuery.error, settlementsQuery.isError]);

    const settlements = settlementsQuery.data?.content ?? [];
    const selectedSettlementId =
        settlements.find((settlement) => settlement.id === selectedId)?.id ??
        settlements[0]?.id ??
        null;
    const totalElements = settlementsQuery.data?.totalElements ?? 0;
    const totalPages =
        settlementsQuery.data?.totalPages ??
        (PAGE_SIZE > 0 ? Math.ceil(totalElements / PAGE_SIZE) : 0);

    const detailQuery = useQuery({
        queryKey: selectedSettlementId
            ? managerShiftSettlementQueryKeys.settlementDetail(
                  selectedSettlementId,
              )
            : ['manager', 'shifts', 'settlements', 'none'],
        queryFn: () =>
            getShiftSettlementDetailApi(selectedSettlementId as string),
        enabled: Boolean(selectedSettlementId),
    });

    const selectedShift = detailQuery.data?.shift ?? null;
    const transactions = detailQuery.data?.transactions ?? [];

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Shift Settlements / Giao ca
                    </h1>
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        settlementsQuery.refetch();
                        detailQuery.refetch();
                    }}
                >
                    <RefreshCw data-icon="inline-start" />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 xl:grid-cols-[220px_220px_180px_180px_180px]">
                    <Select
                        value={parkingId}
                        onValueChange={(value) => {
                            setPage(0);
                            setParkingId(value);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Parking" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_PARKINGS}>
                                All parkings
                            </SelectItem>
                            {(parkingsQuery.data ?? []).map((parking) => (
                                <SelectItem key={parking.id} value={parking.id}>
                                    {parking.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={staffId}
                        onValueChange={(value) => {
                            setPage(0);
                            setStaffId(value);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Staff" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STAFF}>All staff</SelectItem>
                            {(staffQuery.data?.content ?? []).map((staff) => (
                                <SelectItem key={staff.id} value={staff.id}>
                                    {staff.fullName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setPage(0);
                            setStatus(value);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES}>
                                All statuses
                            </SelectItem>
                            <SelectItem value="OPEN">OPEN</SelectItem>
                            <SelectItem value="CLOSED">CLOSED</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="space-y-1">
                        <Label htmlFor="shiftFrom">From</Label>
                        <Input
                            id="shiftFrom"
                            type="datetime-local"
                            value={from}
                            onChange={(event) => {
                                setPage(0);
                                setFrom(event.target.value);
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="shiftTo">To</Label>
                        <Input
                            id="shiftTo"
                            type="datetime-local"
                            value={to}
                            onChange={(event) => {
                                setPage(0);
                                setTo(event.target.value);
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Settlements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SettlementTable
                            rows={settlements}
                            selectedId={selectedSettlementId}
                            onSelect={setSelectedId}
                            loading={settlementsQuery.isLoading}
                        />
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-muted-foreground text-sm">
                                {totalElements} settlements
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    disabled={page === 0}
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.max(current - 1, 0),
                                        )
                                    }
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-medium">
                                    {page + 1} / {Math.max(totalPages, 1)}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={page + 1 >= Math.max(totalPages, 1)}
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

                <Card>
                    <CardHeader>
                        <CardTitle>Detail</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedShift ? (
                            <>
                                <div className="grid gap-3">
                                    <AmountLine
                                        label="Expected cash"
                                        value={selectedShift.expectedCashAmount}
                                    />
                                    <AmountLine
                                        label="Counted cash"
                                        value={selectedShift.countedCashAmount}
                                    />
                                    <AmountLine
                                        label="Variance"
                                        value={selectedShift.varianceAmount}
                                        highlight
                                    />
                                    <AmountLine
                                        label="Online PayOS"
                                        value={selectedShift.onlineAmount}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <AmountLine
                                        label="Parking cash"
                                        value={selectedShift.cashParkingAmount}
                                    />
                                    <AmountLine
                                        label="Surcharge cash"
                                        value={selectedShift.surchargeCashAmount}
                                    />
                                    <AmountLine
                                        label="Penalty cash"
                                        value={selectedShift.penaltyCashAmount}
                                    />
                                    <AmountLine
                                        label="Lost card cash"
                                        value={selectedShift.lostCardCashAmount}
                                    />
                                </div>
                                <div className="rounded-md border p-3 text-sm">
                                    <p className="text-muted-foreground text-xs font-medium">
                                        Note
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap">
                                        {selectedShift.note || '-'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-muted-foreground rounded-md border p-4 text-sm">
                                Select a settlement to view detail.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <TransactionsTable
                        transactions={transactions}
                        loading={detailQuery.isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function SettlementTable({
    rows,
    selectedId,
    onSelect,
    loading,
}: {
    rows: ManagerShiftSettlementListItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="text-muted-foreground rounded-md border p-4 text-sm">
                Loading settlements...
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="text-muted-foreground rounded-md border p-4 text-sm">
                No settlements found.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Parking</TableHead>
                    <TableHead>Kiosk</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Closed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Counted</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Online</TableHead>
                    <TableHead />
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((row) => (
                    <TableRow
                        key={row.id}
                        data-state={row.id === selectedId ? 'selected' : undefined}
                    >
                        <TableCell>{row.staffName ?? row.staffUsername}</TableCell>
                        <TableCell>{row.parkingName ?? row.parkingId}</TableCell>
                        <TableCell>{row.kioskName ?? row.kioskId}</TableCell>
                        <TableCell>{formatDateTime(row.openedAt)}</TableCell>
                        <TableCell>{formatDateTime(row.closedAt)}</TableCell>
                        <TableCell>
                            <StatusPill status={row.status} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {formatMoney(row.expectedCashAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                            {formatMoney(row.countedCashAmount)}
                        </TableCell>
                        <TableCell
                            className={cn(
                                'text-right font-medium',
                                varianceClass(row.varianceAmount),
                            )}
                        >
                            {formatMoney(row.varianceAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                            {formatMoney(row.onlineAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSelect(row.id)}
                            >
                                <Eye data-icon="inline-start" />
                                Detail
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function TransactionsTable({
    transactions,
    loading,
}: {
    transactions: ManagerShiftSettlementTransaction[];
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="text-muted-foreground rounded-md border p-4 text-sm">
                Loading transactions...
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-muted-foreground rounded-md border p-4 text-sm">
                No transactions for this settlement.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Penalty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell>{formatDateTime(transaction.occurredAt)}</TableCell>
                        <TableCell>
                            {transactionTypeLabels[transaction.type] ??
                                transaction.type}
                        </TableCell>
                        <TableCell>
                            {sourceLabels[transaction.source] ??
                                transaction.source}
                        </TableCell>
                        <TableCell>
                            {shortId(transaction.parkingSessionId)}
                        </TableCell>
                        <TableCell>{shortId(transaction.penaltyCaseId)}</TableCell>
                        <TableCell className="text-right font-medium">
                            {formatMoney(transaction.amount)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function AmountLine({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value?: number | null;
    highlight?: boolean;
}) {
    return (
        <div className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs font-medium">
                    {label}
                </p>
                <Banknote className="text-muted-foreground size-4" />
            </div>
            <p
                className={cn(
                    'mt-2 text-lg font-semibold',
                    highlight && varianceClass(value),
                )}
            >
                {formatMoney(value)}
            </p>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    return (
        <span
            className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium',
                status === 'OPEN'
                    ? 'text-emerald-700'
                    : 'text-muted-foreground',
            )}
        >
            {status}
        </span>
    );
}

function varianceClass(value?: number | null) {
    if (typeof value !== 'number' || value === 0) {
        return 'text-emerald-700';
    }

    return value < 0 ? 'text-red-700' : 'text-amber-700';
}

function shortId(value?: string | null) {
    if (!value) {
        return '-';
    }

    return value.length > 8 ? value.slice(0, 8) : value;
}
