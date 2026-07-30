'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
    ArrowDown,
    ArrowUp,
    CarFront,
    CircleDollarSign,
    Gauge,
    LogIn,
    LogOut,
    Minus,
    RefreshCw,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    getManagerAnalyticsOverviewApi,
    managerAnalyticsQueryKeys,
} from '@/service/manager/analytics-api';
import {
    analyticsPeriodTypeValues,
    type AnalyticsDecimalComparison,
    type AnalyticsDirection,
    type AnalyticsPeriodType,
    type ManagerAnalyticsOverview,
    type ManagerAnalyticsParams,
} from '@/service/manager/analytics-type';
import {
    listGlobalVehicleTypesApi,
    listParkingsApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';

const ALL_VEHICLE_TYPES = 'ALL_VEHICLE_TYPES';
const COMPARISON = 'SAME_PERIOD_LAST_YEAR' as const;
const ANALYTICS_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const currentLocalDate = getLocalDateParts();
const defaultDate = toDateInput(currentLocalDate);
const defaultMonth = `${currentLocalDate.year}-${String(currentLocalDate.month).padStart(2, '0')}`;
const defaultQuarter = String(Math.floor((currentLocalDate.month - 1) / 3) + 1);

export function ManagerAnalyticsDashboard() {
    const [parkingId, setParkingId] = useState('');
    const [periodType, setPeriodType] =
        useState<AnalyticsPeriodType>('MONTH');
    const [selectedDate, setSelectedDate] = useState(defaultDate);
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
    const [selectedQuarter, setSelectedQuarter] = useState(defaultQuarter);
    const [selectedYear, setSelectedYear] = useState(
        String(currentLocalDate.year),
    );
    const [customFrom, setCustomFrom] = useState(
        `${defaultMonth}-01`,
    );
    const [customTo, setCustomTo] = useState(defaultDate);
    const [vehicleTypeId, setVehicleTypeId] =
        useState(ALL_VEHICLE_TYPES);

    const parkingsQuery = useQuery({
        queryKey: managerFacilityQueryKeys.parkings,
        queryFn: listParkingsApi,
    });
    const vehicleTypesQuery = useQuery({
        queryKey: managerFacilityQueryKeys.vehicleTypes,
        queryFn: listGlobalVehicleTypesApi,
    });
    const parkings = parkingsQuery.data ?? [];
    const vehicleTypes = vehicleTypesQuery.data ?? [];
    const selectedParkingId = parkingId || parkings[0]?.id || '';
    const periodError = validatePeriod({
        periodType,
        selectedDate,
        selectedMonth,
        selectedQuarter,
        selectedYear,
        customFrom,
        customTo,
    });

    const params = useMemo<ManagerAnalyticsParams | null>(() => {
        if (!selectedParkingId || periodError) {
            return null;
        }
        return buildAnalyticsParams({
            parkingId: selectedParkingId,
            periodType,
            selectedDate,
            selectedMonth,
            selectedQuarter,
            selectedYear,
            customFrom,
            customTo,
            vehicleTypeId,
        });
    }, [
        customFrom,
        customTo,
        periodError,
        periodType,
        selectedDate,
        selectedMonth,
        selectedParkingId,
        selectedQuarter,
        selectedYear,
        vehicleTypeId,
    ]);

    const analyticsQuery = useQuery({
        queryKey: params
            ? managerAnalyticsQueryKeys.overview(params)
            : managerAnalyticsQueryKeys.all,
        queryFn: () => getManagerAnalyticsOverviewApi(params!),
        enabled: Boolean(params),
        placeholderData: keepPreviousData,
    });

    const data = analyticsQuery.data;
    const error =
        parkingsQuery.error ??
        vehicleTypesQuery.error ??
        analyticsQuery.error;
    const isError =
        parkingsQuery.isError ||
        vehicleTypesQuery.isError ||
        analyticsQuery.isError;
    const isLoading =
        parkingsQuery.isLoading ||
        vehicleTypesQuery.isLoading ||
        (Boolean(params) && analyticsQuery.isLoading);

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">
                    PARKING_MANAGER
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                    Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
                    Real traffic, revenue, and occupancy reporting in{' '}
                    {ANALYTICS_TIME_ZONE}, with the same calendar period last
                    year as the comparison baseline.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Report filters</CardTitle>
                    <CardDescription>
                        Every KPI and chart uses the same tenant-scoped filters.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <FilterLabel label="Parking">
                            <Select
                                value={selectedParkingId}
                                disabled={parkingsQuery.isLoading}
                                onValueChange={setParkingId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select parking" />
                                </SelectTrigger>
                                <SelectContent>
                                    {parkings.map((parking) => (
                                        <SelectItem
                                            key={parking.id}
                                            value={parking.id}
                                        >
                                            {parking.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterLabel>

                        <FilterLabel label="Period">
                            <Select
                                value={periodType}
                                onValueChange={(value) =>
                                    setPeriodType(
                                        value as AnalyticsPeriodType,
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {analyticsPeriodTypeValues.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {humanize(value)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterLabel>

                        <PeriodFields
                            periodType={periodType}
                            selectedDate={selectedDate}
                            selectedMonth={selectedMonth}
                            selectedQuarter={selectedQuarter}
                            selectedYear={selectedYear}
                            customFrom={customFrom}
                            customTo={customTo}
                            onDateChange={setSelectedDate}
                            onMonthChange={setSelectedMonth}
                            onQuarterChange={setSelectedQuarter}
                            onYearChange={setSelectedYear}
                            onCustomFromChange={setCustomFrom}
                            onCustomToChange={setCustomTo}
                        />

                        <FilterLabel label="Vehicle type">
                            <Select
                                value={vehicleTypeId}
                                disabled={vehicleTypesQuery.isLoading}
                                onValueChange={setVehicleTypeId}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_VEHICLE_TYPES}>
                                        All vehicle types
                                    </SelectItem>
                                    {vehicleTypes.map((vehicleType) => (
                                        <SelectItem
                                            key={vehicleType.id}
                                            value={vehicleType.id}
                                        >
                                            {vehicleType.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterLabel>

                        <div className="flex items-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={
                                    !params || analyticsQuery.isFetching
                                }
                                onClick={() => analyticsQuery.refetch()}
                            >
                                <RefreshCw
                                    data-icon="inline-start"
                                    className={
                                        analyticsQuery.isFetching
                                            ? 'animate-spin'
                                            : undefined
                                    }
                                />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-muted-foreground">
                            Comparison: same period last year
                        </p>
                        {data ? (
                            <p>
                                {data.period.label} vs{' '}
                                {data.comparisonPeriod.label}
                            </p>
                        ) : null}
                    </div>
                    {periodError ? (
                        <p className="text-destructive text-sm" role="alert">
                            {periodError}
                        </p>
                    ) : null}
                </CardContent>
            </Card>

            {isError ? (
                <ErrorPanel
                    message={getErrorMessage(
                        error,
                        'Failed to load Manager analytics.',
                    )}
                    onRetry={() => {
                        parkingsQuery.refetch();
                        vehicleTypesQuery.refetch();
                        if (params) {
                            analyticsQuery.refetch();
                        }
                    }}
                />
            ) : !selectedParkingId && !parkingsQuery.isLoading ? (
                <EmptyPanel
                    title="No parking is available"
                    message="Create a parking before opening operational analytics."
                />
            ) : periodError ? (
                <EmptyPanel
                    title="Adjust the report period"
                    message={periodError}
                />
            ) : isLoading || !data || analyticsQuery.isPlaceholderData ? (
                <AnalyticsSkeleton />
            ) : (
                <AnalyticsContent data={data} />
            )}
        </div>
    );
}

function AnalyticsContent({
    data,
}: {
    data: ManagerAnalyticsOverview;
}) {
    const hasTraffic = data.trafficTrend.some(
        (point) => point.entries > 0 || point.exits > 0,
    );
    const revenueData = [
        { label: 'PayOS', value: data.revenue.currentBreakdown.payos },
        {
            label: 'Parking Cash',
            value: data.revenue.currentBreakdown.parkingCash,
        },
        {
            label: 'Surcharge',
            value: data.revenue.currentBreakdown.surchargeCash,
        },
        {
            label: 'Penalty',
            value: data.revenue.currentBreakdown.penaltyCash,
        },
        {
            label: 'Lost Card',
            value: data.revenue.currentBreakdown.lostCardFine,
        },
    ];

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <KpiCard
                    title="Vehicle Entries"
                    icon={<LogIn />}
                    value={data.entries.current.toLocaleString('vi-VN')}
                    metric={data.entries}
                    comparisonLabel={data.comparisonPeriod.label}
                    changeFormatter={(value) =>
                        formatSignedNumber(value)
                    }
                />
                <KpiCard
                    title="Vehicle Exits"
                    icon={<LogOut />}
                    value={data.exits.current.toLocaleString('vi-VN')}
                    metric={data.exits}
                    comparisonLabel={data.comparisonPeriod.label}
                    changeFormatter={(value) =>
                        formatSignedNumber(value)
                    }
                />
                <KpiCard
                    title="Total Revenue"
                    icon={<CircleDollarSign />}
                    value={formatVnd(data.revenue.metric.current ?? 0)}
                    metric={data.revenue.metric}
                    comparisonLabel={data.comparisonPeriod.label}
                    changeFormatter={(value) => formatSignedVnd(value)}
                />
                <KpiCard
                    title="Current Occupancy"
                    icon={<Gauge />}
                    value={formatPercent(
                        data.currentOccupancy.occupancyRate,
                    )}
                    comparisonLabel="Snapshot comparison unavailable"
                    helper={`${data.currentOccupancy.occupiedSlots.toLocaleString()} occupied / ${data.currentOccupancy.totalUsableSlots.toLocaleString()} usable`}
                />
                <KpiCard
                    title="Average Occupancy"
                    icon={<CarFront />}
                    value={formatPercent(
                        data.averageOccupancy.averageOccupancyRate.current,
                    )}
                    metric={data.averageOccupancy.averageOccupancyRate}
                    comparisonLabel={data.comparisonPeriod.label}
                    changeFormatter={(value) =>
                        `${value > 0 ? '+' : ''}${value.toFixed(2)} points`
                    }
                    helper="Hourly session-overlap approximation"
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
                <ChartCard
                    title="Traffic trend"
                    description={`${data.period.label} · entries and exits in ${data.period.timeZone}`}
                >
                    {!hasTraffic ? (
                        <ChartEmpty message="No traffic was recorded in this period." />
                    ) : (
                        <>
                            <p className="sr-only">
                                {`Traffic totals: ${data.entries.current.toLocaleString()} entries and ${data.exits.current.toLocaleString()} exits.`}
                            </p>
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart
                                    accessibilityLayer
                                    data={data.trafficTrend}
                                    margin={{
                                        top: 12,
                                        right: 16,
                                        left: 0,
                                        bottom: 8,
                                    }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="var(--border)"
                                        strokeDasharray="4 4"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        minTickGap={24}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="entries"
                                        name="Entries"
                                        stroke="var(--chart-5)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="exits"
                                        name="Exits"
                                        stroke="var(--chart-2)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </ChartCard>

                <ChartCard
                    title="Revenue breakdown"
                    description="Canonical paid intents and cash ledger only"
                >
                    {revenueData.every((item) => item.value === 0) ? (
                        <ChartEmpty message="No revenue was collected in this period." />
                    ) : (
                        <>
                            <p className="sr-only">
                                {`Revenue totals: PayOS ${formatVnd(data.revenue.currentBreakdown.payos)}, parking cash ${formatVnd(data.revenue.currentBreakdown.parkingCash)}, surcharge ${formatVnd(data.revenue.currentBreakdown.surchargeCash)}, penalty ${formatVnd(data.revenue.currentBreakdown.penaltyCash)}, and lost card ${formatVnd(data.revenue.currentBreakdown.lostCardFine)}.`}
                            </p>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart
                                    accessibilityLayer
                                    data={revenueData}
                                    layout="vertical"
                                    margin={{
                                        top: 8,
                                        right: 16,
                                        left: 16,
                                        bottom: 8,
                                    }}
                                >
                                    <CartesianGrid
                                        horizontal={false}
                                        stroke="var(--border)"
                                        strokeDasharray="4 4"
                                    />
                                    <XAxis
                                        type="number"
                                        tickFormatter={formatCompactNumber}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="label"
                                        width={92}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value) =>
                                            formatVnd(Number(value))
                                        }
                                    />
                                    <Bar
                                        dataKey="value"
                                        name="Revenue"
                                        fill="var(--chart-3)"
                                        radius={[0, 6, 6, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </ChartCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Occupancy by vehicle type</CardTitle>
                        <CardDescription>
                            Exact current slot state. Maintenance and locked
                            slots are excluded.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {data.byVehicleType.length === 0 ? (
                            <ChartEmpty message="No vehicle-type capacity is available." />
                        ) : (
                            data.byVehicleType.map((item) => (
                                <div
                                    key={item.vehicleTypeId}
                                    className="space-y-2"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                {item.name}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {item.currentOccupancy.occupiedSlots.toLocaleString()}{' '}
                                                occupied ·{' '}
                                                {item.currentOccupancy.availableSlots.toLocaleString()}{' '}
                                                available ·{' '}
                                                {item.currentOccupancy.reservedSlots.toLocaleString()}{' '}
                                                reserved
                                            </p>
                                        </div>
                                        <span className="font-semibold">
                                            {formatPercent(
                                                item.currentOccupancy
                                                    .occupancyRate,
                                            )}
                                        </span>
                                    </div>
                                    <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                                        <div
                                            className="bg-primary h-full rounded-full transition-[width]"
                                            style={{
                                                width: `${Math.min(
                                                    item.currentOccupancy
                                                        .occupancyRate ?? 0,
                                                    100,
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        Average:{' '}
                                        {formatPercent(
                                            item.averageOccupancy
                                                .averageOccupancyRate.current,
                                        )}{' '}
                                        (session-overlap approximation)
                                    </p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Peak operating hours</CardTitle>
                        <CardDescription>
                            Top local hours per vehicle type, ranked by combined
                            entry and exit activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.peakHours.length === 0 ? (
                            <ChartEmpty message="No peak hours are available for this period." />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vehicle type</TableHead>
                                        <TableHead>Hour</TableHead>
                                        <TableHead className="text-right">
                                            Entries
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Exits
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.peakHours.map((item, index) => (
                                        <TableRow
                                            key={`${item.vehicleTypeId}-${item.hour}-${index}`}
                                        >
                                            <TableCell>
                                                {item.vehicleTypeName}
                                            </TableCell>
                                            <TableCell className="font-mono">
                                                {item.label}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.entryCount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.exitCount.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Method notes</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground grid gap-3 text-sm md:grid-cols-2">
                    <p>{data.currentOccupancy.note}</p>
                    <p>{data.averageOccupancy.note}</p>
                </CardContent>
            </Card>
        </>
    );
}

function KpiCard({
    title,
    icon,
    value,
    metric,
    comparisonLabel,
    helper,
    changeFormatter = formatSignedNumber,
}: {
    title: string;
    icon: ReactNode;
    value: string;
    metric?: AnalyticsDecimalComparison;
    comparisonLabel: string;
    helper?: string;
    changeFormatter?: (value: number) => string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                    <CardTitle className="text-sm">{title}</CardTitle>
                    <CardDescription className="mt-1">
                        {comparisonLabel}
                    </CardDescription>
                </div>
                <span className="bg-muted flex size-9 items-center justify-center rounded-lg border [&_svg]:size-4">
                    {icon}
                </span>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
                {metric ? (
                    <MetricChange
                        metric={metric}
                        changeFormatter={changeFormatter}
                    />
                ) : (
                    <p className="text-muted-foreground text-xs">
                        Historical snapshot not available
                    </p>
                )}
                {helper ? (
                    <p className="text-muted-foreground text-xs">{helper}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}

function MetricChange({
    metric,
    changeFormatter,
}: {
    metric: AnalyticsDecimalComparison;
    changeFormatter: (value: number) => string;
}) {
    if (
        metric.direction === 'NOT_AVAILABLE' ||
        metric.changePercent === null ||
        metric.change === null
    ) {
        return (
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <DirectionIndicator direction={metric.direction} />
                {metric.change === null
                    ? 'Change not available'
                    : `${changeFormatter(metric.change)} · Percentage change not available`}
            </p>
        );
    }
    return (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <DirectionIndicator direction={metric.direction} />
            {changeFormatter(metric.change)} ·{' '}
            {metric.changePercent > 0 ? '+' : ''}
            {metric.changePercent.toFixed(2)}%
        </p>
    );
}

function DirectionIndicator({
    direction,
}: {
    direction: AnalyticsDirection;
}) {
    if (direction === 'UP') {
        return <ArrowUp className="size-3.5" />;
    }
    if (direction === 'DOWN') {
        return <ArrowDown className="size-3.5" />;
    }
    return <Minus className="size-3.5" />;
}

function PeriodFields({
    periodType,
    selectedDate,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    customFrom,
    customTo,
    onDateChange,
    onMonthChange,
    onQuarterChange,
    onYearChange,
    onCustomFromChange,
    onCustomToChange,
}: {
    periodType: AnalyticsPeriodType;
    selectedDate: string;
    selectedMonth: string;
    selectedQuarter: string;
    selectedYear: string;
    customFrom: string;
    customTo: string;
    onDateChange: (value: string) => void;
    onMonthChange: (value: string) => void;
    onQuarterChange: (value: string) => void;
    onYearChange: (value: string) => void;
    onCustomFromChange: (value: string) => void;
    onCustomToChange: (value: string) => void;
}) {
    if (periodType === 'DAY' || periodType === 'WEEK') {
        return (
            <FilterLabel
                label={periodType === 'DAY' ? 'Date' : 'Week containing'}
            >
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => onDateChange(event.target.value)}
                />
            </FilterLabel>
        );
    }
    if (periodType === 'MONTH') {
        return (
            <FilterLabel label="Month">
                <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => onMonthChange(event.target.value)}
                />
            </FilterLabel>
        );
    }
    if (periodType === 'QUARTER') {
        return (
            <>
                <FilterLabel label="Quarter">
                    <Select
                        value={selectedQuarter}
                        onValueChange={onQuarterChange}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4].map((quarter) => (
                                <SelectItem
                                    key={quarter}
                                    value={String(quarter)}
                                >
                                    Q{quarter}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterLabel>
                <FilterLabel label="Year">
                    <Input
                        type="number"
                        min={1970}
                        max={2200}
                        value={selectedYear}
                        onChange={(event) =>
                            onYearChange(event.target.value)
                        }
                    />
                </FilterLabel>
            </>
        );
    }
    if (periodType === 'YEAR') {
        return (
            <FilterLabel label="Year">
                <Input
                    type="number"
                    min={1970}
                    max={2200}
                    value={selectedYear}
                    onChange={(event) => onYearChange(event.target.value)}
                />
            </FilterLabel>
        );
    }
    return (
        <>
            <FilterLabel label="From">
                <Input
                    type="date"
                    value={customFrom}
                    onChange={(event) =>
                        onCustomFromChange(event.target.value)
                    }
                />
            </FilterLabel>
            <FilterLabel label="To">
                <Input
                    type="date"
                    value={customTo}
                    onChange={(event) => onCustomToChange(event.target.value)}
                />
            </FilterLabel>
        </>
    );
}

function FilterLabel({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="space-y-2 text-sm font-medium">
            <span>{label}</span>
            {children}
        </label>
    );
}

function ChartCard({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function ChartEmpty({ message }: { message: string }) {
    return (
        <div className="text-muted-foreground flex h-72 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm">
            {message}
        </div>
    );
}

function EmptyPanel({
    title,
    message,
}: {
    title: string;
    message: string;
}) {
    return (
        <Card>
            <CardContent className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
                <p className="font-medium">{title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{message}</p>
            </CardContent>
        </Card>
    );
}

function ErrorPanel({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <Card>
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
                <div>
                    <p className="font-medium">Analytics could not be loaded</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {message}
                    </p>
                </div>
                <Button variant="outline" onClick={onRetry}>
                    <RefreshCw data-icon="inline-start" />
                    Retry
                </Button>
            </CardContent>
        </Card>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <Skeleton className="h-5 w-28" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
                <Skeleton className="h-96 w-full rounded-xl" />
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        </div>
    );
}

interface PeriodState {
    periodType: AnalyticsPeriodType;
    selectedDate: string;
    selectedMonth: string;
    selectedQuarter: string;
    selectedYear: string;
    customFrom: string;
    customTo: string;
}

interface AnalyticsFilterState extends PeriodState {
    parkingId: string;
    vehicleTypeId: string;
}

export function buildAnalyticsParams(
    state: AnalyticsFilterState,
): ManagerAnalyticsParams {
    const base: ManagerAnalyticsParams = {
        parkingId: state.parkingId,
        periodType: state.periodType,
        comparison: COMPARISON,
        vehicleTypeId:
            state.vehicleTypeId === ALL_VEHICLE_TYPES
                ? undefined
                : state.vehicleTypeId,
    };
    if (state.periodType === 'DAY' || state.periodType === 'WEEK') {
        return { ...base, date: state.selectedDate };
    }
    if (state.periodType === 'MONTH') {
        const [year, month] = state.selectedMonth.split('-').map(Number);
        return { ...base, year, month };
    }
    if (state.periodType === 'QUARTER') {
        return {
            ...base,
            year: Number(state.selectedYear),
            quarter: Number(state.selectedQuarter),
        };
    }
    if (state.periodType === 'YEAR') {
        return { ...base, year: Number(state.selectedYear) };
    }
    return {
        ...base,
        from: state.customFrom,
        to: state.customTo,
    };
}

export function validatePeriod(state: PeriodState) {
    if (
        (state.periodType === 'DAY' || state.periodType === 'WEEK') &&
        !state.selectedDate
    ) {
        return 'Select a valid date.';
    }
    if (state.periodType === 'MONTH' && !state.selectedMonth) {
        return 'Select a valid month.';
    }
    if (state.periodType === 'QUARTER' || state.periodType === 'YEAR') {
        const year = Number(state.selectedYear);
        if (!Number.isInteger(year) || year < 1970 || year > 2200) {
            return 'Year must be from 1970 to 2200.';
        }
    }
    if (state.periodType === 'CUSTOM') {
        if (!state.customFrom || !state.customTo) {
            return 'Select both custom dates.';
        }
        if (state.customFrom > state.customTo) {
            return 'Custom start date must not be after the end date.';
        }
        const durationDays =
            (Date.parse(`${state.customTo}T00:00:00Z`) -
                Date.parse(`${state.customFrom}T00:00:00Z`)) /
                86_400_000 +
            1;
        if (durationDays > 366) {
            return 'Custom periods may include at most 366 days.';
        }
    }
    return null;
}

function formatVnd(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercent(value: number | null) {
    return value === null ? 'N/A' : `${value.toFixed(2)}%`;
}

function formatSignedNumber(value: number) {
    return `${value > 0 ? '+' : ''}${value.toLocaleString('vi-VN')}`;
}

function formatSignedVnd(value: number) {
    return `${value > 0 ? '+' : ''}${formatVnd(value)}`;
}

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

function humanize(value: string) {
    return value
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/^\w/, (letter) => letter.toUpperCase());
}

function getLocalDateParts() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: ANALYTICS_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value);
    return {
        year: getPart('year'),
        month: getPart('month'),
        day: getPart('day'),
    };
}

function toDateInput({
    year,
    month,
    day,
}: {
    year: number;
    month: number;
    day: number;
}) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
