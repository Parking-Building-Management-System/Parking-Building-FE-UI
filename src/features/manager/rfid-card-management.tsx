'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import {
    generateRfidCardsApi,
    listRfidCardsApi,
    managerFacilityQueryKeys,
    updateRfidCardStatusApi,
} from '@/service/manager/facility-api';
import {
    rfidCardStatusValues,
    type RfidCardStatus,
} from '@/service/manager/facility-type';
import { FacilityHeader } from './floor-management';

const ALL_STATUSES = 'ALL_STATUSES';
type RfidStatusFilter = RfidCardStatus | typeof ALL_STATUSES;

export function RfidCardManagement() {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<RfidStatusFilter>(ALL_STATUSES);
    const [count, setCount] = useState('');
    const [prefix, setPrefix] = useState('');
    const params = useMemo(
        () => ({
            status: status === ALL_STATUSES ? undefined : status,
            page: 0,
            size: 50,
        }),
        [status],
    );

    const cardsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.rfidCardList(params),
        queryFn: () => listRfidCardsApi(params),
        placeholderData: keepPreviousData,
    });

    const generateMutation = useMutation({
        mutationFn: () => {
            const parsedCount = count.trim() ? Number(count) : undefined;

            if (
                typeof parsedCount === 'number' &&
                (!Number.isInteger(parsedCount) ||
                    parsedCount < 1 ||
                    parsedCount > 10000)
            ) {
                throw new Error('Count must be an integer from 1 to 10,000.');
            }

            return generateRfidCardsApi({
                count: parsedCount,
                prefix: prefix.trim() || undefined,
            });
        },
        onSuccess: () => {
            toast.success('RFID card pool generated.');
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.rfidCards,
            });
            setCount('');
            setPrefix('');
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to generate RFID cards.'),
            );
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: RfidCardStatus }) =>
            updateRfidCardStatusApi(id, { status }),
        onSuccess: () => {
            toast.success('RFID card status updated.');
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.rfidCards,
            });
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update RFID card status.'),
            );
        },
    });

    useEffect(() => {
        if (cardsQuery.isError) {
            toast.error(
                getErrorMessage(
                    cardsQuery.error,
                    'Failed to load RFID cards.',
                ),
            );
        }
    }, [cardsQuery.error, cardsQuery.isError]);

    const cards = cardsQuery.data?.content ?? [];
    const totalCards = cardsQuery.data?.totalElements ?? cards.length;

    return (
        <div className="space-y-6 p-6">
            <FacilityHeader
                title="RFID Cards"
                description="Manage the tenant RFID card pool. This UI uses list, generate, and status endpoints only."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Generate Card Pool</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Count is optional. If omitted, backend generates the
                        documented default pool size.
                    </p>
                </CardHeader>
                <CardContent>
                    <form
                        className="grid gap-3 md:grid-cols-[180px_180px_auto]"
                        onSubmit={(event) => {
                            event.preventDefault();
                            generateMutation.mutate();
                        }}
                    >
                        <Input
                            type="number"
                            placeholder="Count"
                            value={count}
                            disabled={generateMutation.isPending}
                            onChange={(event) => setCount(event.target.value)}
                        />
                        <Input
                            placeholder="Prefix"
                            value={prefix}
                            disabled={generateMutation.isPending}
                            onChange={(event) => setPrefix(event.target.value)}
                        />
                        <Button
                            type="submit"
                            disabled={generateMutation.isPending}
                        >
                            <Plus data-icon="inline-start" />
                            {generateMutation.isPending
                                ? 'Generating...'
                                : 'Generate'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle>Cards</CardTitle>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {totalCards.toLocaleString()} cards
                        </p>
                    </div>
                    <Select
                        value={status}
                        onValueChange={(value) =>
                            setStatus(value as RfidStatusFilter)
                        }
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES}>
                                All statuses
                            </SelectItem>
                            {rfidCardStatusValues.map((cardStatus) => (
                                <SelectItem
                                    key={cardStatus}
                                    value={cardStatus}
                                >
                                    {cardStatus}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    {cardsQuery.isError ? (
                        <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                            RFID API is pending or unavailable on this backend.
                            The configured endpoint is `/manager/rfid-cards`;
                            local curl returned 404 during verification.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cardsQuery.isLoading && (
                                    <>
                                        {Array.from({ length: 5 }).map(
                                            (_, index) => (
                                                <TableRow key={index}>
                                                    <TableCell colSpan={4}>
                                                        <Skeleton className="h-6 w-full" />
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </>
                                )}
                                {!cardsQuery.isLoading &&
                                    cards.map((card) => (
                                        <TableRow key={card.id}>
                                            <TableCell className="font-medium">
                                                {card.code}
                                            </TableCell>
                                            <TableCell>{card.status}</TableCell>
                                            <TableCell>
                                                {card.createdAt
                                                    ? new Date(
                                                          card.createdAt,
                                                      ).toLocaleString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="icon-sm"
                                                            disabled={
                                                                statusMutation.isPending &&
                                                                statusMutation
                                                                    .variables
                                                                    ?.id ===
                                                                    card.id
                                                            }
                                                        >
                                                            <MoreHorizontal />
                                                            <span className="sr-only">
                                                                RFID actions
                                                            </span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {rfidCardStatusValues.map(
                                                            (cardStatus) => (
                                                                <DropdownMenuItem
                                                                    key={
                                                                        cardStatus
                                                                    }
                                                                    disabled={
                                                                        cardStatus ===
                                                                        card.status
                                                                    }
                                                                    onClick={() =>
                                                                        statusMutation.mutate(
                                                                            {
                                                                                id: card.id,
                                                                                status: cardStatus,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    Mark{' '}
                                                                    {cardStatus}
                                                                </DropdownMenuItem>
                                                            ),
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {!cardsQuery.isLoading && cards.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-muted-foreground h-28 text-center"
                                        >
                                            No RFID cards found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
