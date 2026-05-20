'use client';

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import type { AdminTrafficPoint } from '@/service/admin/type';

interface SystemTrafficChartProps {
    data: AdminTrafficPoint[];
}

interface TrafficTooltipProps {
    active?: boolean;
    payload?: {
        dataKey?: string | number;
        name?: string | number;
        value?: string | number;
    }[];
    label?: string;
}

export function SystemTrafficChart({ data }: SystemTrafficChartProps) {
    const chartData = data.map((item) => ({
        ...item,
        label: new Date(item.bucketStart).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        }),
    }));

    return (
        <div className="w-full min-w-0">
            <ResponsiveContainer width="100%" height={320} minWidth={0}>
                <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
                    <CartesianGrid
                        stroke="var(--border)"
                        vertical={false}
                        strokeDasharray="4 4"
                    />
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                    />
                    <Tooltip content={<TrafficTooltip />} cursor={false} />
                    <Bar
                        dataKey="requestCount"
                        name="Requests"
                        fill="var(--primary)"
                        radius={[6, 6, 0, 0]}
                    />
                    <Bar
                        dataKey="errorCount"
                        name="Errors"
                        fill="var(--muted-foreground)"
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function TrafficTooltip({ active, payload, label }: TrafficTooltipProps) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="bg-popover text-popover-foreground rounded-lg border p-3 text-sm shadow-md">
            <p className="mb-2 font-medium">{label}</p>
            <div className="space-y-1">
                {payload.map((item) => (
                    <div
                        key={item.dataKey}
                        className="flex items-center justify-between gap-6"
                    >
                        <span className="text-muted-foreground">
                            {item.name}
                        </span>
                        <span className="font-medium">
                            {Number(item.value).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
