'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { Loader2, MoreHorizontal, Plus, RefreshCw, Search } from 'lucide-react';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    generateRfidCardsApi,
    listRfidCardsApi,
    managerFacilityQueryKeys,
    updateRfidCardStatusApi,
} from '@/service/manager/facility-api';
import {
    rfidCardStatusValues,
    type RfidCardListParams,
    type RfidCardResponse,
    type RfidCardStatus,
} from '@/service/manager/facility-type';
import { FacilityHeader } from './floor-management';

const ALL_STATUSES = 'ALL_STATUSES';
const RFID_SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const MAX_GENERATE_COUNT = 10000;
const MAX_PREFIX_LENGTH = 30;

type RfidStatusFilter = RfidCardStatus | typeof ALL_STATUSES;

export function RfidCardManagement() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, RFID_SEARCH_DEBOUNCE_MS);
    const [status, setStatus] = useState<RfidStatusFilter>(ALL_STATUSES);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [generateOpen, setGenerateOpen] = useState(false);

    const params = useMemo<RfidCardListParams>(
        () => ({
            search: debouncedSearch.trim() || undefined,
            status: status === ALL_STATUSES ? undefined : status,
            page,
            size: pageSize,
        }),
        [debouncedSearch, page, pageSize, status],
    );

    const cardsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.rfidCardList(params),
        queryFn: () => listRfidCardsApi(params),
        placeholderData: keepPreviousData,
    });

    const statusMutation = useMutation({
        mutationFn: ({
            id,
            status: nextStatus,
        }: {
            id: string;
            status: RfidCardStatus;
        }) => updateRfidCardStatusApi(id, { status: nextStatus }),
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

    const cards = cardsQuery.data?.content ?? [];
    const totalCards = cardsQuery.data?.totalElements ?? 0;
    const totalPages = cardsQuery.data?.totalPages ?? 0;
    const hasFilters =
        debouncedSearch.trim().length > 0 || status !== ALL_STATUSES;
    const firstResult = totalCards === 0 ? 0 : page * pageSize + 1;
    const lastResult = Math.min((page + 1) * pageSize, totalCards);

    const updateSearch = (value: string) => {
        setSearch(value);
        setPage(0);
    };

    const updateStatus = (value: RfidStatusFilter) => {
        setStatus(value);
        setPage(0);
    };

    const updatePageSize = (value: string) => {
        setPageSize(Number(value));
        setPage(0);
    };

    const updateCardStatus = (
        card: RfidCardResponse,
        nextStatus: RfidCardStatus,
    ) => {
        if (card.status === nextStatus || statusMutation.isPending) {
            return;
        }

        const confirmed = window.confirm(
            `Change RFID card ${card.code} from ${humanizeStatus(card.status)} to ${humanizeStatus(nextStatus)}?`,
        );
        if (!confirmed) {
            return;
        }

        statusMutation.mutate({ id: card.id, status: nextStatus });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <FacilityHeader
                    title="RFID Cards"
                    description="Search, filter, and manage the tenant RFID card pool."
                />
                <Button onClick={() => setGenerateOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Generate cards
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cards</CardTitle>
                    <p
                        className="text-muted-foreground text-sm"
                        aria-live="polite"
                    >
                        {cardsQuery.isFetching
                            ? 'Updating results...'
                            : `${totalCards.toLocaleString()} result${totalCards === 1 ? '' : 's'}`}
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_130px_auto]">
                        <div className="relative">
                            <Label htmlFor="rfid-search" className="sr-only">
                                Search by card code
                            </Label>
                            <Search
                                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                                aria-hidden="true"
                            />
                            <Input
                                id="rfid-search"
                                type="search"
                                className="pl-9"
                                placeholder="Search by card code"
                                value={search}
                                onChange={(event) =>
                                    updateSearch(event.target.value)
                                }
                            />
                        </div>
                        <Select
                            value={status}
                            onValueChange={(value) =>
                                updateStatus(value as RfidStatusFilter)
                            }
                        >
                            <SelectTrigger aria-label="Filter by status">
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
                                        {humanizeStatus(cardStatus)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={String(pageSize)}
                            onValueChange={updatePageSize}
                        >
                            <SelectTrigger aria-label="Results per page">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size} per page
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={cardsQuery.isFetching}
                            onClick={() => cardsQuery.refetch()}
                        >
                            <RefreshCw
                                data-icon="inline-start"
                                className={
                                    cardsQuery.isFetching
                                        ? 'animate-spin'
                                        : undefined
                                }
                            />
                            Refresh
                        </Button>
                    </div>

                    {cardsQuery.isError ? (
                        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center">
                            <div>
                                <p className="font-medium">
                                    RFID cards could not be loaded
                                </p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {getErrorMessage(
                                        cardsQuery.error,
                                        'Please try again.',
                                    )}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => cardsQuery.refetch()}
                            >
                                <RefreshCw data-icon="inline-start" />
                                Retry
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-24 text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cardsQuery.isLoading
                                        ? Array.from({ length: 6 }).map(
                                              (_, index) => (
                                                  <TableRow key={index}>
                                                      <TableCell colSpan={3}>
                                                          <Skeleton className="h-6 w-full" />
                                                      </TableCell>
                                                  </TableRow>
                                              ),
                                          )
                                        : null}
                                    {!cardsQuery.isLoading
                                        ? cards.map((card) => {
                                              const updatingThisCard =
                                                  statusMutation.isPending &&
                                                  statusMutation.variables
                                                      ?.id === card.id;

                                              return (
                                                  <TableRow key={card.id}>
                                                      <TableCell>
                                                          <span className="font-mono font-semibold tracking-wide">
                                                              {card.code}
                                                          </span>
                                                      </TableCell>
                                                      <TableCell>
                                                          <RfidStatusBadge
                                                              status={
                                                                  card.status
                                                              }
                                                          />
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
                                                                          statusMutation.isPending
                                                                      }
                                                                  >
                                                                      {updatingThisCard ? (
                                                                          <Loader2 className="animate-spin" />
                                                                      ) : (
                                                                          <MoreHorizontal />
                                                                      )}
                                                                      <span className="sr-only">
                                                                          Actions
                                                                          for
                                                                          RFID
                                                                          card{' '}
                                                                          {
                                                                              card.code
                                                                          }
                                                                      </span>
                                                                  </Button>
                                                              </DropdownMenuTrigger>
                                                              <DropdownMenuContent align="end">
                                                                  {rfidCardStatusValues.map(
                                                                      (
                                                                          cardStatus,
                                                                      ) => (
                                                                          <DropdownMenuItem
                                                                              key={
                                                                                  cardStatus
                                                                              }
                                                                              disabled={
                                                                                  cardStatus ===
                                                                                  card.status
                                                                              }
                                                                              variant={
                                                                                  cardStatus ===
                                                                                      'LOST' ||
                                                                                  cardStatus ===
                                                                                      'BLOCKED'
                                                                                      ? 'destructive'
                                                                                      : 'default'
                                                                              }
                                                                              onSelect={() =>
                                                                                  updateCardStatus(
                                                                                      card,
                                                                                      cardStatus,
                                                                                  )
                                                                              }
                                                                          >
                                                                              Mark{' '}
                                                                              {humanizeStatus(
                                                                                  cardStatus,
                                                                              )}
                                                                          </DropdownMenuItem>
                                                                      ),
                                                                  )}
                                                              </DropdownMenuContent>
                                                          </DropdownMenu>
                                                      </TableCell>
                                                  </TableRow>
                                              );
                                          })
                                        : null}
                                    {!cardsQuery.isLoading &&
                                    cards.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                className="h-36 text-center"
                                            >
                                                <p className="font-medium">
                                                    {hasFilters
                                                        ? 'No cards match these filters.'
                                                        : 'No RFID cards exist yet.'}
                                                </p>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {hasFilters
                                                        ? 'Try a different card code or status.'
                                                        : 'Generate a card pool to get started.'}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {!cardsQuery.isError ? (
                        <div className="flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-muted-foreground">
                                {totalCards === 0
                                    ? '0 results'
                                    : `${firstResult.toLocaleString()}–${lastResult.toLocaleString()} of ${totalCards.toLocaleString()}`}
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">
                                    Page {totalPages === 0 ? 0 : page + 1} of{' '}
                                    {totalPages}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        page === 0 || cardsQuery.isFetching
                                    }
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.max(0, current - 1),
                                        )
                                    }
                                >
                                    Previous
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        totalPages === 0 ||
                                        page + 1 >= totalPages ||
                                        cardsQuery.isFetching
                                    }
                                    onClick={() =>
                                        setPage((current) => current + 1)
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            <GenerateCardsDialog
                open={generateOpen}
                onOpenChange={setGenerateOpen}
            />
        </div>
    );
}

function GenerateCardsDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [count, setCount] = useState('');
    const [prefix, setPrefix] = useState('');
    const trimmedCount = count.trim();
    const trimmedPrefix = prefix.trim();
    const parsedCount = trimmedCount ? Number(trimmedCount) : undefined;
    const countError =
        typeof parsedCount === 'number' &&
        (!Number.isInteger(parsedCount) ||
            parsedCount < 1 ||
            parsedCount > MAX_GENERATE_COUNT)
            ? 'Count must be a whole number from 1 to 10,000.'
            : null;
    const prefixError =
        trimmedPrefix.length > MAX_PREFIX_LENGTH
            ? 'Prefix must be 30 characters or fewer.'
            : null;

    const resetForm = () => {
        setCount('');
        setPrefix('');
    };

    const generateMutation = useMutation({
        mutationFn: () =>
            generateRfidCardsApi({
                count: parsedCount,
                prefix: trimmedPrefix || undefined,
            }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.rfidCards,
            });
            toast.success(
                `Generation complete: ${result.createdCount.toLocaleString()} created, ${result.existingCount.toLocaleString()} already existed (${result.requestedCount.toLocaleString()} requested).`,
            );
            onOpenChange(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to generate RFID cards.'),
            );
        },
    });

    const changeOpen = (nextOpen: boolean) => {
        if (generateMutation.isPending) {
            return;
        }
        if (!nextOpen) {
            resetForm();
        }
        onOpenChange(nextOpen);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (countError || prefixError || generateMutation.isPending) {
            return;
        }
        generateMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogContent>
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Generate RFID cards</DialogTitle>
                        <DialogDescription>
                            Add a card pool without leaving or resetting your
                            current search and filters.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="rfid-generate-count">Count</Label>
                        <Input
                            id="rfid-generate-count"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={MAX_GENERATE_COUNT}
                            step={1}
                            placeholder="Use parking-based default"
                            value={count}
                            disabled={generateMutation.isPending}
                            aria-invalid={Boolean(countError)}
                            aria-describedby="rfid-count-help"
                            onChange={(event) => setCount(event.target.value)}
                        />
                        <p
                            id="rfid-count-help"
                            className={
                                countError
                                    ? 'text-destructive text-xs'
                                    : 'text-muted-foreground text-xs'
                            }
                        >
                            {countError ??
                                'Optional. Enter 1–10,000, or leave blank to use the parking-based default.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rfid-generate-prefix">Prefix</Label>
                        <Input
                            id="rfid-generate-prefix"
                            maxLength={MAX_PREFIX_LENGTH}
                            placeholder="Example: UXTEST"
                            value={prefix}
                            disabled={generateMutation.isPending}
                            aria-invalid={Boolean(prefixError)}
                            aria-describedby="rfid-prefix-help"
                            onChange={(event) => setPrefix(event.target.value)}
                        />
                        <p
                            id="rfid-prefix-help"
                            className={
                                prefixError
                                    ? 'text-destructive text-xs'
                                    : 'text-muted-foreground text-xs'
                            }
                        >
                            {prefixError ??
                                'Optional. The backend removes punctuation and stores the prefix in uppercase.'}
                        </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg border p-3 text-sm">
                        Generate{' '}
                        <span className="font-semibold">
                            {parsedCount
                                ? parsedCount.toLocaleString()
                                : 'the default number of'}
                        </span>{' '}
                        cards using{' '}
                        <span className="font-semibold">
                            {trimmedPrefix || 'the tenant default prefix'}
                        </span>
                        . Existing card codes will be skipped.
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={generateMutation.isPending}
                            onClick={() => changeOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                Boolean(countError) ||
                                Boolean(prefixError) ||
                                generateMutation.isPending
                            }
                        >
                            {generateMutation.isPending ? (
                                <Loader2
                                    data-icon="inline-start"
                                    className="animate-spin"
                                />
                            ) : (
                                <Plus data-icon="inline-start" />
                            )}
                            {generateMutation.isPending
                                ? 'Generating...'
                                : 'Generate cards'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RfidStatusBadge({ status }: { status: RfidCardStatus }) {
    const styles: Record<RfidCardStatus, string> = {
        ACTIVE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        INACTIVE:
            'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
        LOST: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
        BLOCKED:
            'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    };

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
        >
            {humanizeStatus(status)}
        </span>
    );
}

function humanizeStatus(status: RfidCardStatus) {
    return status.charAt(0) + status.slice(1).toLowerCase();
}

function useDebouncedValue<T>(value: T, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeout = window.setTimeout(
            () => setDebouncedValue(value),
            delay,
        );
        return () => window.clearTimeout(timeout);
    }, [delay, value]);

    return debouncedValue;
}
