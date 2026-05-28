'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
    Copy,
    DoorOpen,
    ExternalLink,
    IdCard,
    ImageIcon,
    ParkingCircle,
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
import { ApiError } from '@/lib/api/axios-config';
import {
    checkInParkingSessionApi,
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
            return 'Không tìm thấy thẻ. Kiểm tra lại mã thẻ.';
        }

        if (
            normalizedMessage.includes('already in use') ||
            normalizedMessage.includes('đang được sử dụng')
        ) {
            return 'Thẻ đang được sử dụng cho lượt gửi xe khác.';
        }

        if (
            normalizedMessage.includes('no available slot') ||
            normalizedMessage.includes('hết chỗ') ||
            normalizedMessage.includes('không còn chỗ')
        ) {
            return 'Không còn slot trống phù hợp.';
        }

        if (
            error.code === 4002 ||
            normalizedMessage.includes('kiosk_context_required')
        ) {
            return 'Thiếu ngữ cảnh kiosk. Đăng nhập lại từ thiết bị kiosk đã được duyệt.';
        }

        if (
            normalizedMessage.includes('device_not_trust') ||
            normalizedMessage.includes('device_not_trusted') ||
            normalizedMessage.includes('thiết bị chưa được cấp quyền')
        ) {
            return 'Thiết bị staff chưa được quản lý duyệt.';
        }

        if (normalizedMessage.includes('staff_not_assigned_to_kiosk')) {
            return 'Staff chưa được gán vào kiosk này.';
        }

        if (normalizedMessage.includes('kiosk_inactive')) {
            return 'Kiosk đang không hoạt động.';
        }

        if (error.status === 401) {
            return 'Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.';
        }

        if (error.status === 403) {
            return 'Bạn không có quyền tạo lượt vào hoặc thiết bị chưa được cấp quyền.';
        }

        return message || 'Không thể tạo lượt vào.';
    }

    if (error instanceof Error) {
        return error.message || 'Không thể tạo lượt vào.';
    }

    return 'Không thể tạo lượt vào.';
};

const formatEntryTime = (entryTime: string) => {
    const parsed = new Date(entryTime);

    if (Number.isNaN(parsed.getTime())) {
        return entryTime;
    }

    return parsed.toLocaleString('vi-VN');
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
    const workContext = useAuthStore((state) => state.user?.workContext);
    const [checkInResult, setCheckInResult] =
        useState<StaffCheckInResponse | null>(null);
    const form = useForm<StaffCheckInFormValues>({
        resolver: zodResolver(staffCheckInFormSchema),
        defaultValues: {
            plateNumber: '',
            cardCode: '',
            entryImageUrl: '',
        },
    });

    const checkInMutation = useMutation({
        mutationFn: checkInParkingSessionApi,
        onSuccess: (result) => {
            setCheckInResult(result);
            toast.success('Đã giữ chỗ và mở rào giả lập.');
            form.reset({
                plateNumber: '',
                cardCode: '',
                entryImageUrl: '',
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
                label: 'Biển số',
                value: checkInResult.plateNumber,
            },
            {
                label: 'Mã thẻ',
                value: checkInResult.cardCode,
            },
            {
                label: 'Slot được giữ',
                value: checkInResult.assignedSlotCode,
            },
            {
                label: 'Khu vực',
                value: checkInResult.zoneName,
            },
            {
                label: 'Bãi xe',
                value: checkInResult.parkingName ?? checkInResult.parkingId,
            },
            {
                label: 'Giờ vào',
                value: formatEntryTime(checkInResult.entryTime),
            },
            {
                label: 'Trạng thái',
                value: checkInResult.status,
            },
        ];
    }, [checkInResult]);

    const pwaPath = useMemo(
        () => (checkInResult ? buildPwaPath(checkInResult) : ''),
        [checkInResult],
    );
    const publicPwaUrl = useMemo(() => buildPublicUrl(pwaPath), [pwaPath]);

    const onCopyPwaLink = async () => {
        if (!publicPwaUrl) {
            toast.error('Backend chưa trả qrToken hoặc pwaAccessPath.');
            return;
        }

        try {
            await navigator.clipboard.writeText(publicPwaUrl);
            toast.success('Đã copy link PWA.');
        } catch {
            toast.error('Không thể copy link. Hãy copy thủ công từ ô link.');
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
                    Tạo lượt gửi xe bằng biển số và mã thẻ, sau đó giữ slot và
                    mở rào giả lập từ hệ thống staff.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Tạo lượt vào</CardTitle>
                        <CardDescription>
                            Endpoint sử dụng: POST
                            /staff/parking-sessions/check-in
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
                                Chưa có workContext từ /auth/me. Request sẽ giữ
                                DEV fallback hiện tại và không gửi tenantId.
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
                                                    Biển số xe
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="51A-12345"
                                                        autoComplete="off"
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
                                                <FormLabel>Mã thẻ</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="CARD-001"
                                                        autoComplete="off"
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
                                </div>

                                <FormField
                                    control={form.control}
                                    name="entryImageUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Ảnh lúc vào (URL, optional)
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
                                                Upload ảnh thật/camera chưa
                                                triển khai trong MVP này.
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
                                        ? 'Đang tạo lượt...'
                                        : 'Tạo lượt & Mở rào'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kết quả check-in</CardTitle>
                            <CardDescription>
                                Thông tin giữ chỗ trả về từ backend.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {checkInResult ? (
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm font-medium text-green-700 dark:text-green-300">
                                        Đã giữ chỗ và mở rào giả lập
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

                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">
                                                    Đưa khách quét mã này
                                                </h3>
                                                <p className="text-muted-foreground text-sm">
                                                    Link mở trang hướng dẫn gửi
                                                    xe công khai của thẻ vừa
                                                    check-in.
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
                                                    <div className="rounded-md border bg-background px-3 py-2 text-xs break-all">
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
                                                <div className="text-muted-foreground rounded-md border border-dashed bg-background p-4 text-sm">
                                                    Backend chưa trả qrToken hoặc
                                                    pwaAccessPath nên chưa thể
                                                    tạo link PWA. Không dùng mã
                                                    thẻ làm public token.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted-foreground flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center text-sm">
                                    <ParkingCircle className="size-10" />
                                    <p>
                                        Chưa có lượt vào. Nhập biển số và mã thẻ
                                        để tạo phiên gửi xe.
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
                                        Backend kiểm tra thẻ tồn tại và chưa
                                        được sử dụng.
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
                                        MVP chỉ gửi URL ảnh nếu staff nhập.
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
