'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
    Check,
    Copy,
    DoorOpen,
    ExternalLink,
    IdCard,
    ImageIcon,
    ParkingCircle,
    RefreshCw,
    Search,
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
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
    getStaffVehicleTypes,
    listAvailableRfidCardsApi,
    presignParkingSessionPhotoUploadApi,
    staffQueryKeys,
    staffCheckInFormSchema,
    type StaffCheckInFormValues,
    type StaffCheckInResponse,
    uploadParkingSessionPhotoFile,
} from '@/service/staff';
import { useAuthStore } from '@/stores/use-auth-store';

const ACCEPTED_ENTRY_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ENTRY_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const CARD_SEARCH_DEBOUNCE_MS = 325;
const RFID_CARD_LISTBOX_ID = 'staff-rfid-card-listbox';

type EntryPhotoKind = 'entryOverview' | 'licensePlate';

type EntryPhotoState = {
    file: File | null;
    previewUrl: string;
    status: 'idle' | 'uploading' | 'uploaded' | 'error';
    error: string;
};

const createEmptyEntryPhoto = (): EntryPhotoState => ({
    file: null,
    previewUrl: '',
    status: 'idle',
    error: '',
});

const useDebouncedValue = <T,>(value: T, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => window.clearTimeout(timeout);
    }, [delay, value]);

    return debouncedValue;
};

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
            normalizedMessage.includes(
                'no available slot for selected vehicle type',
            )
        ) {
            return 'No available slot for selected vehicle type.';
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
    parkingId?: string,
    photos?: {
        entryImageUrl: string;
        licensePlateImageUrl: string;
    },
) => {
    return {
        plateNumber: values.plateNumber.trim().toUpperCase(),
        cardCode: values.cardCode.trim().toUpperCase(),
        vehicleTypeId: values.vehicleTypeId,
        parkingId,
        entryImageUrl: photos?.entryImageUrl ?? '',
        licensePlateImageUrl: photos?.licensePlateImageUrl ?? '',
    };
};

const getVehicleTypeLabel = (vehicleType: {
    code?: string | null;
    name?: string | null;
    displayName?: string | null;
    label?: string | null;
}) => {
    return (
        vehicleType.displayName ||
        vehicleType.label ||
        vehicleType.name ||
        vehicleType.code ||
        ''
    );
};

const formatFileSize = (size: number) => {
    if (size < 1024 * 1024) {
        return `${Math.max(1, Math.round(size / 1024)).toLocaleString()} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const validateEntryPhotoFile = (file: File) => {
    if (!ACCEPTED_ENTRY_PHOTO_TYPES.includes(file.type)) {
        return 'Upload a JPG, PNG, or WebP photo.';
    }

    if (file.size > MAX_ENTRY_PHOTO_SIZE_BYTES) {
        return 'Entry photo must be 5 MB or smaller.';
    }

    return '';
};

const getPhotoUploadErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.message || 'Photo upload failed. Try another photo.';
    }

    if (error instanceof Error) {
        return error.message || 'Photo upload failed. Try another photo.';
    }

    return 'Photo upload failed. Try another photo.';
};

export function StaffEntryCheckIn() {
    const queryClient = useQueryClient();
    const workContext = useAuthStore((state) => state.user?.workContext);
    const [checkInResult, setCheckInResult] =
        useState<StaffCheckInResponse | null>(null);
    const [cardSearch, setCardSearch] = useState('');
    const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);
    const [highlightedCardIndex, setHighlightedCardIndex] = useState(-1);
    const [entryOverviewPhoto, setEntryOverviewPhoto] =
        useState<EntryPhotoState>(() => createEmptyEntryPhoto());
    const [licensePlatePhoto, setLicensePlatePhoto] =
        useState<EntryPhotoState>(() => createEmptyEntryPhoto());
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
    const debouncedCardSearch = useDebouncedValue(
        cardSearch.trim(),
        CARD_SEARCH_DEBOUNCE_MS,
    );
    const form = useForm<StaffCheckInFormValues>({
        resolver: zodResolver(staffCheckInFormSchema),
        defaultValues: {
            plateNumber: '',
            vehicleTypeId: '',
            cardCode: '',
        },
    });
    const [plateNumber = '', vehicleTypeId = '', cardCode = ''] = useWatch({
        control: form.control,
        name: ['plateNumber', 'vehicleTypeId', 'cardCode'],
    });

    const vehicleTypesQuery = useQuery({
        queryKey: staffQueryKeys.vehicleTypes,
        queryFn: getStaffVehicleTypes,
    });
    const availableCardsQuery = useQuery({
        queryKey: staffQueryKeys.availableRfidCards(debouncedCardSearch),
        queryFn: () => listAvailableRfidCardsApi(debouncedCardSearch, 50),
    });

    const checkInMutation = useMutation({
        mutationFn: checkInParkingSessionApi,
        onSuccess: async (result) => {
            const selectedVehicleTypeId = form.getValues('vehicleTypeId');
            setCheckInResult(result);
            toast.success('Slot assigned. Entry gate can open.');
            form.reset({
                plateNumber: '',
                vehicleTypeId: selectedVehicleTypeId,
                cardCode: '',
            });
            setCardSearch('');
            setIsCardPickerOpen(false);
            setHighlightedCardIndex(-1);
            resetPhotoInputs();
            await queryClient.invalidateQueries({
                queryKey: ['staff-available-rfid-cards'],
            });
        },
        onError: (error) => {
            toast.error(getStaffCheckInErrorMessage(error));
        },
    });

    const activeVehicleTypes = useMemo(() => {
        return (vehicleTypesQuery.data ?? []).filter(
            (vehicleType) => vehicleType.active !== false,
        );
    }, [vehicleTypesQuery.data]);

    useEffect(() => {
        if (form.getValues('vehicleTypeId') || activeVehicleTypes.length === 0) {
            return;
        }

        const defaultVehicleType =
            activeVehicleTypes.find(
                (vehicleType) => vehicleType.code.toUpperCase() === 'CAR',
            ) ?? activeVehicleTypes[0];

        form.setValue('vehicleTypeId', defaultVehicleType.id, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: true,
        });
    }, [activeVehicleTypes, form]);

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
            ...(checkInResult.vehicleTypeName || checkInResult.vehicleTypeCode
                ? [
                      {
                          label: 'Vehicle type',
                          value:
                              checkInResult.vehicleTypeName ??
                              checkInResult.vehicleTypeCode ??
                              '',
                      },
                  ]
                : []),
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
    const selectedAvailableCard = availableCards.find(
        (card) => card.code === cardCode,
    );
    const isBusy = isUploadingPhotos || checkInMutation.isPending;
    const isSubmitDisabled =
        isBusy ||
        !plateNumber.trim() ||
        !selectedAvailableCard ||
        availableCardsQuery.isFetching ||
        availableCardsQuery.isError ||
        !vehicleTypeId ||
        !entryOverviewPhoto.file ||
        !licensePlatePhoto.file ||
        vehicleTypesQuery.isLoading;

    const selectAvailableCard = (code: string) => {
        form.setValue('cardCode', code, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
        setCardSearch(code);
        setIsCardPickerOpen(false);
        setHighlightedCardIndex(-1);
    };

    const refreshAvailableCards = async () => {
        setHighlightedCardIndex(-1);
        setIsCardPickerOpen(true);
        const result = await availableCardsQuery.refetch();
        const selectedCode = form.getValues('cardCode');

        if (
            result.isSuccess &&
            selectedCode &&
            !result.data?.some((card) => card.code === selectedCode)
        ) {
            form.setValue('cardCode', '', {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
        }
    };

    useEffect(() => {
        return () => {
            if (entryOverviewPhoto.previewUrl) {
                URL.revokeObjectURL(entryOverviewPhoto.previewUrl);
            }
        };
    }, [entryOverviewPhoto.previewUrl]);

    useEffect(() => {
        return () => {
            if (licensePlatePhoto.previewUrl) {
                URL.revokeObjectURL(licensePlatePhoto.previewUrl);
            }
        };
    }, [licensePlatePhoto.previewUrl]);

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

    const updatePhotoState = (
        kind: EntryPhotoKind,
        patch: Partial<EntryPhotoState>,
    ) => {
        const updater = (previous: EntryPhotoState) => ({
            ...previous,
            ...patch,
        });

        if (kind === 'entryOverview') {
            setEntryOverviewPhoto(updater);
        } else {
            setLicensePlatePhoto(updater);
        }
    };

    const resetPhotoInputs = () => {
        setEntryOverviewPhoto((previous) => {
            if (previous.previewUrl) {
                URL.revokeObjectURL(previous.previewUrl);
            }

            return createEmptyEntryPhoto();
        });
        setLicensePlatePhoto((previous) => {
            if (previous.previewUrl) {
                URL.revokeObjectURL(previous.previewUrl);
            }

            return createEmptyEntryPhoto();
        });
    };

    const onPhotoFileChange = (kind: EntryPhotoKind, file: File | null) => {
        const setPhoto =
            kind === 'entryOverview'
                ? setEntryOverviewPhoto
                : setLicensePlatePhoto;

        setPhoto((previous) => {
            if (previous.previewUrl) {
                URL.revokeObjectURL(previous.previewUrl);
            }

            if (!file) {
                return createEmptyEntryPhoto();
            }

            const validationError = validateEntryPhotoFile(file);

            return {
                file,
                previewUrl: URL.createObjectURL(file),
                status: validationError ? 'error' : 'idle',
                error: validationError,
            };
        });
    };

    const uploadEntryPhoto = async (
        kind: EntryPhotoKind,
        file: File,
        photoType: 'ENTRY_OVERVIEW' | 'LICENSE_PLATE',
    ) => {
        updatePhotoState(kind, { status: 'uploading', error: '' });

        const presign = await presignParkingSessionPhotoUploadApi({
            fileName: file.name,
            contentType: file.type,
            photoType,
        });
        await uploadParkingSessionPhotoFile(file, presign);
        updatePhotoState(kind, { status: 'uploaded', error: '' });

        return presign.objectKey;
    };

    const onSubmit = async (values: StaffCheckInFormValues) => {
        const entryFile = entryOverviewPhoto.file;
        const plateFile = licensePlatePhoto.file;
        const entryPhotoError = entryFile
            ? validateEntryPhotoFile(entryFile)
            : 'Driver / vehicle entry photo is required.';
        const platePhotoError = plateFile
            ? validateEntryPhotoFile(plateFile)
            : 'License plate photo is required.';

        if (entryPhotoError || platePhotoError) {
            if (entryPhotoError) {
                updatePhotoState('entryOverview', {
                    status: 'error',
                    error: entryPhotoError,
                });
            }
            if (platePhotoError) {
                updatePhotoState('licensePlate', {
                    status: 'error',
                    error: platePhotoError,
                });
            }
            toast.error('Select both entry verification photos before check-in.');
            return;
        }

        if (!entryFile || !plateFile) {
            return;
        }

        setCheckInResult(null);
        setIsUploadingPhotos(true);

        let uploadedPhotos: {
            entryImageUrl: string;
            licensePlateImageUrl: string;
        };

        try {
            const [entryImageUrl, licensePlateImageUrl] = await Promise.all([
                uploadEntryPhoto(
                    'entryOverview',
                    entryFile,
                    'ENTRY_OVERVIEW',
                ),
                uploadEntryPhoto(
                    'licensePlate',
                    plateFile,
                    'LICENSE_PLATE',
                ),
            ]);
            uploadedPhotos = { entryImageUrl, licensePlateImageUrl };
        } catch (error) {
            toast.error(getPhotoUploadErrorMessage(error));
            setIsUploadingPhotos(false);
            return;
        }

        setIsUploadingPhotos(false);

        try {
            await checkInMutation.mutateAsync(
                buildCheckInRequest(
                    values,
                    workContext?.parkingId,
                    uploadedPhotos,
                ),
            );
        } catch {
            // The mutation onError handler owns check-in specific messaging.
        } finally {
            setIsUploadingPhotos(false);
        }
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
                                                        disabled={isBusy}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="vehicleTypeId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Vehicle type
                                                </FormLabel>
                                                <Select
                                                    value={field.value}
                                                    disabled={
                                                        isBusy ||
                                                        vehicleTypesQuery.isLoading ||
                                                        activeVehicleTypes.length ===
                                                            0
                                                    }
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select vehicle type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {activeVehicleTypes.map(
                                                            (vehicleType) => {
                                                                const label =
                                                                    getVehicleTypeLabel(
                                                                        vehicleType,
                                                                    );

                                                                return (
                                                                    <SelectItem
                                                                        key={
                                                                            vehicleType.id
                                                                        }
                                                                        value={
                                                                            vehicleType.id
                                                                        }
                                                                    >
                                                                        {label}
                                                                        {vehicleType.code &&
                                                                        vehicleType.code !==
                                                                            label
                                                                            ? ` (${vehicleType.code})`
                                                                            : ''}
                                                                    </SelectItem>
                                                                );
                                                            },
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {vehicleTypesQuery.isError ? (
                                                    <p className="text-destructive text-xs">
                                                        Could not load vehicle
                                                        types.
                                                    </p>
                                                ) : !vehicleTypesQuery.isLoading &&
                                                  activeVehicleTypes.length ===
                                                      0 ? (
                                                    <p className="text-muted-foreground text-xs">
                                                        No vehicle types are
                                                        available.
                                                    </p>
                                                ) : null}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="cardCode"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel>RFID card</FormLabel>
                                                <div className="space-y-2">
                                                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                                        <div
                                                            className="relative"
                                                            onBlur={(event) => {
                                                                if (
                                                                    !event.currentTarget.contains(
                                                                        event.relatedTarget,
                                                                    )
                                                                ) {
                                                                    setIsCardPickerOpen(
                                                                        false,
                                                                    );
                                                                    setHighlightedCardIndex(
                                                                        -1,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                                            <Input
                                                                className="pl-9"
                                                                placeholder="Search available cards"
                                                                autoComplete="off"
                                                                role="combobox"
                                                                aria-autocomplete="list"
                                                                aria-controls={
                                                                    RFID_CARD_LISTBOX_ID
                                                                }
                                                                aria-expanded={
                                                                    isCardPickerOpen
                                                                }
                                                                aria-activedescendant={
                                                                    highlightedCardIndex >=
                                                                    0
                                                                        ? `rfid-card-option-${availableCards[highlightedCardIndex]?.id}`
                                                                        : undefined
                                                                }
                                                                aria-invalid={
                                                                    fieldState.invalid
                                                                }
                                                                disabled={
                                                                    isBusy
                                                                }
                                                                value={
                                                                    cardSearch
                                                                }
                                                                name={
                                                                    field.name
                                                                }
                                                                ref={field.ref}
                                                                onFocus={() =>
                                                                    setIsCardPickerOpen(
                                                                        true,
                                                                    )
                                                                }
                                                                onBlur={
                                                                    field.onBlur
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    const value =
                                                                        event
                                                                            .target
                                                                            .value;
                                                                    setCardSearch(
                                                                        value,
                                                                    );
                                                                    setIsCardPickerOpen(
                                                                        true,
                                                                    );
                                                                    setHighlightedCardIndex(
                                                                        -1,
                                                                    );
                                                                    if (
                                                                        field.value &&
                                                                        value
                                                                            .trim()
                                                                            .toUpperCase() !==
                                                                            field.value.toUpperCase()
                                                                    ) {
                                                                        field.onChange(
                                                                            '',
                                                                        );
                                                                    }
                                                                }}
                                                                onKeyDown={(
                                                                    event,
                                                                ) => {
                                                                    if (
                                                                        event.key ===
                                                                        'ArrowDown'
                                                                    ) {
                                                                        event.preventDefault();
                                                                        setIsCardPickerOpen(
                                                                            true,
                                                                        );
                                                                        setHighlightedCardIndex(
                                                                            (
                                                                                current,
                                                                            ) =>
                                                                                availableCards.length ===
                                                                                0
                                                                                    ? -1
                                                                                    : (current +
                                                                                          1) %
                                                                                      availableCards.length,
                                                                        );
                                                                        return;
                                                                    }

                                                                    if (
                                                                        event.key ===
                                                                        'ArrowUp'
                                                                    ) {
                                                                        event.preventDefault();
                                                                        setIsCardPickerOpen(
                                                                            true,
                                                                        );
                                                                        setHighlightedCardIndex(
                                                                            (
                                                                                current,
                                                                            ) =>
                                                                                availableCards.length ===
                                                                                0
                                                                                    ? -1
                                                                                    : current <=
                                                                                        0
                                                                                      ? availableCards.length -
                                                                                        1
                                                                                      : current -
                                                                                        1,
                                                                        );
                                                                        return;
                                                                    }

                                                                    if (
                                                                        event.key ===
                                                                            'Enter' &&
                                                                        isCardPickerOpen &&
                                                                        highlightedCardIndex >=
                                                                            0
                                                                    ) {
                                                                        event.preventDefault();
                                                                        const card =
                                                                            availableCards[
                                                                                highlightedCardIndex
                                                                            ];
                                                                        if (
                                                                            card
                                                                        ) {
                                                                            selectAvailableCard(
                                                                                card.code,
                                                                            );
                                                                        }
                                                                        return;
                                                                    }

                                                                    if (
                                                                        event.key ===
                                                                        'Escape'
                                                                    ) {
                                                                        event.preventDefault();
                                                                        setIsCardPickerOpen(
                                                                            false,
                                                                        );
                                                                        setHighlightedCardIndex(
                                                                            -1,
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            {isCardPickerOpen ? (
                                                                <div
                                                                    id={
                                                                        RFID_CARD_LISTBOX_ID
                                                                    }
                                                                    role="listbox"
                                                                    aria-label="Available RFID cards"
                                                                    className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border p-1 shadow-md"
                                                                >
                                                                    {availableCardsQuery.isFetching ? (
                                                                        <div className="text-muted-foreground flex items-center gap-2 px-2 py-3 text-sm">
                                                                            <RefreshCw className="size-4 animate-spin" />
                                                                            Loading
                                                                            available
                                                                            cards...
                                                                        </div>
                                                                    ) : availableCardsQuery.isError ? (
                                                                        <div className="space-y-2 px-2 py-3">
                                                                            <p className="text-destructive text-sm">
                                                                                Could
                                                                                not
                                                                                load
                                                                                available
                                                                                cards.
                                                                            </p>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={
                                                                                    refreshAvailableCards
                                                                                }
                                                                            >
                                                                                Retry
                                                                            </Button>
                                                                        </div>
                                                                    ) : availableCards.length ===
                                                                      0 ? (
                                                                        <p className="text-muted-foreground px-2 py-3 text-sm">
                                                                            No
                                                                            available
                                                                            cards
                                                                            found
                                                                        </p>
                                                                    ) : (
                                                                        availableCards.map(
                                                                            (
                                                                                card,
                                                                                index,
                                                                            ) => (
                                                                                <button
                                                                                    id={`rfid-card-option-${card.id}`}
                                                                                    key={
                                                                                        card.id
                                                                                    }
                                                                                    type="button"
                                                                                    role="option"
                                                                                    aria-selected={
                                                                                        card.code ===
                                                                                        field.value
                                                                                    }
                                                                                    tabIndex={
                                                                                        -1
                                                                                    }
                                                                                    className="data-[highlighted=true]:bg-accent data-[highlighted=true]:text-accent-foreground flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none"
                                                                                    data-highlighted={
                                                                                        index ===
                                                                                        highlightedCardIndex
                                                                                    }
                                                                                    onMouseDown={(
                                                                                        event,
                                                                                    ) =>
                                                                                        event.preventDefault()
                                                                                    }
                                                                                    onMouseEnter={() =>
                                                                                        setHighlightedCardIndex(
                                                                                            index,
                                                                                        )
                                                                                    }
                                                                                    onClick={() =>
                                                                                        selectAvailableCard(
                                                                                            card.code,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <span className="min-w-0 flex-1 truncate">
                                                                                        {card.label ||
                                                                                            card.code}
                                                                                    </span>
                                                                                    {card.code ===
                                                                                    field.value ? (
                                                                                        <Check className="ml-2 size-4 shrink-0" />
                                                                                    ) : null}
                                                                                </button>
                                                                            ),
                                                                        )
                                                                    )}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            disabled={
                                                                availableCardsQuery.isFetching
                                                            }
                                                            aria-label="Refresh available RFID cards"
                                                            title="Refresh available RFID cards"
                                                            onClick={
                                                                refreshAvailableCards
                                                            }
                                                        >
                                                            <RefreshCw
                                                                className={
                                                                    availableCardsQuery.isFetching
                                                                        ? 'size-4 animate-spin'
                                                                        : 'size-4'
                                                                }
                                                            />
                                                        </Button>
                                                    </div>
                                                    {availableCardsQuery.isError ? (
                                                        <p className="text-destructive text-xs">
                                                            Could not load
                                                            available cards.
                                                        </p>
                                                    ) : availableCardsQuery.isLoading ? (
                                                        <p className="text-muted-foreground text-xs">
                                                            Loading available
                                                            cards...
                                                        </p>
                                                    ) : availableCards.length ===
                                                      0 ? (
                                                        <p className="text-muted-foreground text-xs">
                                                            No available cards
                                                            found
                                                        </p>
                                                    ) : (
                                                        <p className="text-muted-foreground text-xs">
                                                            {availableCards.length.toLocaleString()}{' '}
                                                            available cards
                                                            found.
                                                        </p>
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-3 rounded-lg border p-4">
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Entry verification photos
                                        </h3>
                                        <p className="text-muted-foreground text-xs">
                                            Capture both photos before creating
                                            the entry session.
                                        </p>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <EntryPhotoInput
                                            id="entry-overview-photo"
                                            label="Driver / vehicle entry photo"
                                            photo={entryOverviewPhoto}
                                            disabled={isBusy}
                                            onChange={(file) =>
                                                onPhotoFileChange(
                                                    'entryOverview',
                                                    file,
                                                )
                                            }
                                        />
                                        <EntryPhotoInput
                                            id="license-plate-photo"
                                            label="License plate photo"
                                            photo={licensePlatePhoto}
                                            disabled={isBusy}
                                            onChange={(file) =>
                                                onPhotoFileChange(
                                                    'licensePlate',
                                                    file,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="h-12 w-full text-base"
                                    disabled={isSubmitDisabled}
                                >
                                    <DoorOpen data-icon="inline-start" />
                                    {isUploadingPhotos
                                        ? 'Uploading photos...'
                                        : checkInMutation.isPending
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

                                    {checkInResult.entryImageUrl ||
                                    checkInResult.licensePlateImageUrl ? (
                                        <div className="rounded-lg border p-4">
                                            <h3 className="text-sm font-semibold">
                                                Entry verification photos
                                            </h3>
                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                {checkInResult.entryImageUrl ? (
                                                    <VerificationPhotoLink
                                                        label="Driver / vehicle"
                                                        url={
                                                            checkInResult.entryImageUrl
                                                        }
                                                    />
                                                ) : null}
                                                {checkInResult.licensePlateImageUrl ? (
                                                    <VerificationPhotoLink
                                                        label="License plate"
                                                        url={
                                                            checkInResult.licensePlateImageUrl
                                                        }
                                                    />
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : null}

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
                                    <p className="font-medium">
                                        Entry photos
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        Staff uploads driver overview and plate
                                        photos before creating the session.
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

function EntryPhotoInput({
    disabled,
    id,
    label,
    onChange,
    photo,
}: {
    disabled: boolean;
    id: string;
    label: string;
    onChange: (file: File | null) => void;
    photo: EntryPhotoState;
}) {
    return (
        <div className="space-y-2 rounded-md border p-3">
            <label className="text-sm font-medium" htmlFor={id}>
                {label}
            </label>
            <Input
                id={id}
                type="file"
                accept="image/*"
                capture="environment"
                disabled={disabled}
                onChange={(event) =>
                    onChange(event.target.files?.item(0) ?? null)
                }
            />
            {photo.file ? (
                <div className="flex gap-3">
                    {photo.previewUrl ? (
                        <a
                            className="bg-muted block size-20 shrink-0 overflow-hidden rounded-md border"
                            href={photo.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${label} preview`}
                        >
                            <span
                                className="block size-full bg-cover bg-center"
                                style={{
                                    backgroundImage: `url(${photo.previewUrl})`,
                                }}
                            />
                        </a>
                    ) : null}
                    <div className="min-w-0 text-xs">
                        <p className="font-medium break-all">
                            {photo.file.name}
                        </p>
                        <p className="text-muted-foreground">
                            {formatFileSize(photo.file.size)}
                        </p>
                        {photo.status === 'uploading' ? (
                            <p className="text-muted-foreground mt-1">
                                Uploading...
                            </p>
                        ) : photo.status === 'uploaded' ? (
                            <p className="mt-1 text-emerald-600">Uploaded</p>
                        ) : null}
                    </div>
                </div>
            ) : (
                <p className="text-muted-foreground text-xs">
                    No photo selected.
                </p>
            )}
            {photo.error ? (
                <p className="text-destructive text-xs">{photo.error}</p>
            ) : null}
        </div>
    );
}

function VerificationPhotoLink({
    label,
    url,
}: {
    label: string;
    url: string;
}) {
    return (
        <a
            className="group block rounded-md border p-2"
            href={url}
            target="_blank"
            rel="noreferrer"
        >
            <div
                className="bg-muted aspect-video overflow-hidden rounded border"
                aria-label={`${label} entry verification`}
            >
                <span
                    className="block size-full bg-cover bg-center transition-transform group-hover:scale-105"
                    style={{
                        backgroundImage: `url(${url})`,
                    }}
                />
            </div>
            <p className="mt-2 text-xs font-medium">{label}</p>
        </a>
    );
}
