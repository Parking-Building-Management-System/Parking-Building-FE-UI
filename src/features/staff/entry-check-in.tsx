'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
    Copy,
    DoorOpen,
    ExternalLink,
    IdCard,
    ImageIcon,
    ParkingCircle,
    RefreshCw,
    Search,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/api/axios-config';
import {
    checkInParkingSessionApi,
    listAvailableRfidCardsApi,
    staffQueryKeys,
    staffCheckInFormSchema,
    type StaffCheckInFormValues,
    type StaffCheckInResponse,
} from '@/service/staff';
import { useAuthStore } from '@/stores/use-auth-store';

const getStaffCheckInErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        const message = error.message || '';
        const normalizedMessage = message.toLowerCase();

        if (
            normalizedMessage.includes('card not found') ||
            normalizedMessage.includes('không tìm thấy thẻ')
        ) {
            return 'Card was not found. Check the card code and try again.';
        }

        if (
            normalizedMessage.includes('already in use') ||
            normalizedMessage.includes('đang được sử dụng')
        ) {
            return 'This card is already being used by another active session.';
        }

        if (
            normalizedMessage.includes('no available slot') ||
            normalizedMessage.includes('hết chỗ') ||
            normalizedMessage.includes('không còn chỗ')
        ) {
            return 'No suitable parking slot is currently available.';
        }

        if (
            error.code === 4002 ||
            normalizedMessage.includes('kiosk_context_required')
        ) {
            return 'Kiosk context is missing. Sign in again from an approved kiosk device.';
        }

        if (
            normalizedMessage.includes('device_not_trust') ||
            normalizedMessage.includes('device_not_trusted') ||
            normalizedMessage.includes('thiết bị chưa được cấp quyền')
        ) {
            return 'This staff device has not been approved by a manager.';
        }

        if (normalizedMessage.includes('staff_not_assigned_to_kiosk')) {
            return 'Your staff account is not assigned to this kiosk.';
        }

        if (normalizedMessage.includes('kiosk_inactive')) {
            return 'This kiosk is inactive.';
        }

        if (error.status === 401) {
            return 'Your login session has expired. Please sign in again.';
        }

        if (error.status === 403) {
            return 'You do not have permission to create entry sessions from this device.';
        }

        return message || 'Could not create the entry session.';
    }

    if (error instanceof Error) {
        return error.message || 'Could not create the entry session.';
    }

    return 'Could not create the entry session.';
};

const formatEntryTime = (entryTime: string) => {
    const parsed = new Date(entryTime);

    if (Number.isNaN(parsed.getTime())) {
        return entryTime;
    }

    return parsed.toLocaleString('en-US');
};

const buildPwaPath = (result: StaffCheckInResponse) => {
    if (result.pwaAccessPath) {
        return result.pwaAccessPath;
    }

    if (result.qrToken) {
        return `/pwa/c/${encodeURIComponent(result.qrToken)}`;
    }

    return '';
};

const buildPublicUrl = (path: string) => {
    if (!path) {
        return '';
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    if (typeof window === 'undefined') {
        return path;
    }

    return new URL(path, window.location.origin).toString();
};

const buildCheckInRequest = (
    values: StaffCheckInFormValues,
    hasWorkContext: boolean,
) => {
    const request = {
        plateNumber: values.plateNumber.trim().toUpperCase(),
        cardCode: values.cardCode.trim().toUpperCase(),
        entryImageUrl: values.entryImageUrl?.trim() || undefined,
    };

    if (hasWorkContext) {
        return request;
    }

    return request;
};

export function StaffEntryCheckIn() {
    const queryClient = useQueryClient();
    const workContext = useAuthStore((state) => state.user?.workContext);
    const [checkInResult, setCheckInResult] =
        useState<StaffCheckInResponse | null>(null);
    const [cardSearch, setCardSearch] = useState('');
    const deferredCardSearch = useDeferredValue(cardSearch);
    const form = useForm<StaffCheckInFormValues>({
        resolver: zodResolver(staffCheckInFormSchema),
        defaultValues: {
            plateNumber: '',
            cardCode: '',
            entryImageUrl: '',
        },
    });

    const availableCardsQuery = useQuery({
        queryKey: staffQueryKeys.availableRfidCards(
            deferredCardSearch.trim(),
        ),
        queryFn: () => listAvailableRfidCardsApi(deferredCardSearch, 50),
    });

    const checkInMutation = useMutation({
        mutationFn: checkInParkingSessionApi,
        onSuccess: async (result) => {
            setCheckInResult(result);
            toast.success('Slot assigned. Entry gate can open.');
            form.reset({
                plateNumber: '',
                cardCode: '',
                entryImageUrl: '',
            });
            setCardSearch('');
            await queryClient.invalidateQueries({
                queryKey: ['staff-available-rfid-cards'],
            });
        },
        onError: (error) => {
            toast.error(getStaffCheckInErrorMessage(error));
        },
    });

    const resultItems = useMemo(() => {
        if (!checkInResult) {
            return [];
        }

        return [
            {
                label: 'Plate',
                value: checkInResult.plateNumber,
            },
            {
                label: 'Card',
                value: checkInResult.cardCode,
            },
            {
                label: 'Assigned slot',
                value: checkInResult.assignedSlotCode,
            },
            {
                label: 'Zone',
                value: checkInResult.zoneName,
            },
            {
                label: 'Parking',
                value: checkInResult.parkingName ?? checkInResult.parkingId,
            },
            {
                label: 'Entry time',
                value: formatEntryTime(checkInResult.entryTime),
            },
            {
                label: 'Status',
                value: checkInResult.status,
            },
        ];
    }, [checkInResult]);

    const pwaPath = useMemo(
        () => (checkInResult ? buildPwaPath(checkInResult) : ''),
        [checkInResult],
    );
    const publicPwaUrl = useMemo(() => buildPublicUrl(pwaPath), [pwaPath]);
    const availableCards = availableCardsQuery.data ?? [];

    const onCopyPwaLink = async () => {
        if (!publicPwaUrl) {
            toast.error('The backend did not return a PWA link for this card.');
            return;
        }

        try {
            await navigator.clipboard.writeText(publicPwaUrl);
            toast.success('PWA link copied.');
        } catch {
            toast.error(
                'Could not copy the link. Copy it manually from the link field.',
            );
        }
    };

    const onSubmit = (values: StaffCheckInFormValues) => {
        setCheckInResult(null);
        checkInMutation.mutate(buildCheckInRequest(values, !!workContext));
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm font-medium">
                    STAFF
                </p>
                <h1 className="text-3xl font-semibold tracking-normal">
                    Entry Check-in
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                    Create an entry session with a plate number and RFID card,
                    then hand the driver their public PWA guide.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Create entry session</CardTitle>
                        <CardDescription>
                            Fast check-in for staffed entry gates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {workContext ? (
                            <div className="mb-5 grid gap-3 rounded-lg border p-3 text-sm md:grid-cols-3">
                                <ContextItem
                                    label="Kiosk"
                                    value={workContext.kioskName}
                                />
                                <ContextItem
                                    label="Type"
                                    value={workContext.kioskType}
                                />
                                <ContextItem
                                    label="Parking"
                                    value={workContext.parkingName}
                                />
                            </div>
                        ) : (
                            <div className="text-muted-foreground mb-5 rounded-lg border p-3 text-xs">
                                No kiosk context was returned by your session.
                                The backend may reject check-in until this
                                device is approved.
                            </div>
                        )}
                        <Form {...form}>
                            <form
                                className="space-y-5"
                                onSubmit={form.handleSubmit(onSubmit)}
                            >
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="plateNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Plate number
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="51A-12345"
                                                        autoComplete="off"
                                                        autoFocus
                                                        disabled={
                                                            checkInMutation.isPending
                                                        }
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="cardCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>RFID card</FormLabel>
                                                <div className="space-y-2">
                                                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                                        <div className="relative">
                                                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                                            <Input
                                                                className="pl-9"
                                                                placeholder="Search available cards"
                                                                autoComplete="off"
                                                                disabled={
                                                                    checkInMutation.isPending
                                                                }
                                                                value={
                                                                    cardSearch
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setCardSearch(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            disabled={
                                                                availableCardsQuery.isFetching
                                                            }
                                                            onClick={() =>
                                                                availableCardsQuery.refetch()
                                                            }
                                                        >
                                                            <RefreshCw className="size-4" />
                                                        </Button>
                                                    </div>
                                                    <Select
                                                        value={
                                                            availableCards.some(
                                                                (card) =>
                                                                    card.code ===
                                                                    field.value,
                                                            )
                                                                ? field.value
                                                                : undefined
                                                        }
                                                        disabled={
                                                            checkInMutation.isPending ||
                                                            availableCardsQuery.isLoading ||
                                                            availableCards.length ===
                                                                0
                                                        }
                                                        onValueChange={(value) =>
                                                            field.onChange(
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose available card" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableCards.map(
                                                                (card) => (
                                                                    <SelectItem
                                                                        key={
                                                                            card.id
                                                                        }
                                                                        value={
                                                                            card.code
                                                                        }
                                                                    >
                                                                        {card.label ||
                                                                            card.code}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    {availableCardsQuery.isError ? (
                                                        <p className="text-destructive text-xs">
                                                            Could not load
                                                            available cards.
                                                            Manual entry is
                                                            still available.
                                                        </p>
                                                    ) : availableCardsQuery.isLoading ? (
                                                        <p className="text-muted-foreground text-xs">
                                                            Loading available
                                                            cards...
                                                        </p>
                                                    ) : availableCards.length ===
                                                      0 ? (
                                                        <p className="text-muted-foreground text-xs">
                                                            No available cards.
                                                            Ask manager to
                                                            generate or release
                                                            cards.
                                                        </p>
                                                    ) : (
                                                        <p className="text-muted-foreground text-xs">
                                                            {availableCards.length.toLocaleString()}{' '}
                                                            available cards
                                                            loaded.
                                                        </p>
                                                    )}
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Manual card code fallback"
                                                            autoComplete="off"
                                                            disabled={
                                                                checkInMutation.isPending
                                                            }
                                                            value={field.value}
                                                            onChange={(event) =>
                                                                field.onChange(
                                                                    event.target.value.toUpperCase(),
                                                                )
                                                            }
                                                            onBlur={
                                                                field.onBlur
                                                            }
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="entryImageUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Entry image URL (optional)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://example.com/entry-image.jpg"
                                                    autoComplete="off"
                                                    disabled={
                                                        checkInMutation.isPending
                                                    }
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Camera upload is not part of
                                                this demo; paste an image URL
                                                only when available.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="h-12 w-full text-base"
                                    disabled={checkInMutation.isPending}
                                >
                                    <DoorOpen data-icon="inline-start" />
                                    {checkInMutation.isPending
                                        ? 'Creating session...'
                                        : 'Create Entry & Open Gate'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Check-in result</CardTitle>
                            <CardDescription>
                                Slot assignment and PWA handoff details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {checkInResult ? (
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm font-medium text-green-700 dark:text-green-300">
                                        Slot assigned. Entry gate can open.
                                    </div>

                                    <div className="grid gap-3">
                                        {resultItems.map((item) => (
                                            <div
                                                key={item.label}
                                                className="flex items-start justify-between gap-4 rounded-lg border p-3"
                                            >
                                                <span className="text-muted-foreground text-sm">
                                                    {item.label}
                                                </span>
                                                <span className="text-right text-sm font-medium break-all">
                                                    {item.value || '-'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-muted/30 rounded-lg border p-4">
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">
                                                    Driver PWA handoff
                                                </h3>
                                                <p className="text-muted-foreground text-sm">
                                                    Ask the driver to scan this
                                                    QR code or open the public
                                                    parking guide link.
                                                </p>
                                            </div>

                                            {publicPwaUrl ? (
                                                <>
                                                    <div className="flex justify-center">
                                                        <div className="rounded-md border bg-white p-3 shadow-sm">
                                                            <QRCodeSVG
                                                                value={
                                                                    publicPwaUrl
                                                                }
                                                                size={176}
                                                                level="M"
                                                                marginSize={2}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="bg-background rounded-md border px-3 py-2 text-xs break-all">
                                                        {publicPwaUrl}
                                                    </div>
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={
                                                                onCopyPwaLink
                                                            }
                                                        >
                                                            <Copy data-icon="inline-start" />
                                                            Copy Link
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    publicPwaUrl
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <ExternalLink data-icon="inline-start" />
                                                                Open PWA Preview
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-muted-foreground bg-background rounded-md border border-dashed p-4 text-sm">
                                                    The backend did not return a
                                                    QR token or PWA access path.
                                                    Do not use the card code as
                                                    a public token.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted-foreground flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center text-sm">
                                    <ParkingCircle className="size-10" />
                                    <p>
                                        No entry session yet. Enter the plate
                                        and card code to assign a slot.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <Card size="sm">
                            <CardContent className="flex items-center gap-3">
                                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg border">
                                    <IdCard className="size-4" />
                                </div>
                                <div>
                                    <p className="font-medium">Card binding</p>
                                    <p className="text-muted-foreground text-xs">
                                        The backend verifies that the card
                                        exists and is not attached to another
                                        active session.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card size="sm">
                            <CardContent className="flex items-center gap-3">
                                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg border">
                                    <ImageIcon className="size-4" />
                                </div>
                                <div>
                                    <p className="font-medium">Entry image</p>
                                    <p className="text-muted-foreground text-xs">
                                        This demo sends an image URL only when
                                        staff provides one.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContextItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="truncate font-medium">{value}</p>
        </div>
    );
}
