'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
    AlertTriangle,
    CarFront,
    CreditCard,
    IdCard,
    Import,
    Monitor,
    ParkingCircle,
    Plus,
    RadioTower,
    UsersRound,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockOccupancyTrend = [
    { hour: '06:00', occupied: 142 },
    { hour: '08:00', occupied: 286 },
    { hour: '10:00', occupied: 351 },
    { hour: '12:00', occupied: 397 },
    { hour: '14:00', occupied: 372 },
    { hour: '16:00', occupied: 428 },
    { hour: '18:00', occupied: 461 },
    { hour: '20:00', occupied: 319 },
];

const mockRevenueSplit = [
    { method: 'Cash', value: 38, color: 'var(--muted-foreground)' },
    { method: 'QR', value: 62, color: 'var(--primary)' },
];

const mockVehicleDistribution = [
    { type: 'Motorbike', count: 312 },
    { type: 'Car', count: 126 },
    { type: 'EV', count: 38 },
    { type: 'Truck', count: 11 },
];

const mockHeatmap = [
    ['Low', 'Medium', 'High', 'High', 'Medium'],
    ['Medium', 'High', 'Peak', 'Peak', 'High'],
    ['Low', 'Medium', 'High', 'Medium', 'Low'],
];

const mockActiveParkings = [
    { name: 'Tower A Basement', occupancy: '91%', sessions: 188 },
    { name: 'Mall East Wing', occupancy: '76%', sessions: 143 },
    { name: 'Office Surface Lot', occupancy: '58%', sessions: 72 },
];

const mockRecentSessions = [
    { plate: '51F-824.12', site: 'Tower A', state: 'Parked 42m' },
    { plate: '30H-118.90', site: 'Mall East', state: 'Exited 6m ago' },
    { plate: '59K-772.01', site: 'Office Lot', state: 'Parked 1h 12m' },
];

const mockRedFlags = [
    'Manual gate override at Tower A exit lane',
    'Unpaid exit attempt blocked at Mall East',
    'Camera mismatch on plate 51G-902.44',
];

const mockDeviceQueue = [
    { device: 'Kiosk B2 - Entry 03', requester: 'Nguyen Van An' },
    { device: 'Handheld Patrol 07', requester: 'Tran Thu Ha' },
    { device: 'Exit Barrier C1', requester: 'Le Minh Quan' },
];

const heatmapTone: Record<string, string> = {
    Low: 'bg-muted text-muted-foreground',
    Medium: 'bg-primary/10 text-primary',
    High: 'bg-primary/25 text-primary',
    Peak: 'bg-destructive/15 text-destructive',
};

export function ManagerDashboard() {
    const stats = [
        { title: 'Total Parkings', value: '8', icon: ParkingCircle },
        { title: 'Total Slots', value: '1,240', icon: CarFront },
        { title: 'Occupied Slots', value: '842', icon: Monitor },
        { title: 'Occupancy Rate', value: '67.9%', icon: RadioTower },
        { title: 'Active Sessions', value: '487', icon: UsersRound },
        { title: 'Today Revenue', value: '38.4M VND', icon: CreditCard },
        { title: 'Pending Incidents', value: '12', icon: AlertTriangle },
        { title: 'Devices Pending Approval', value: '5', icon: IdCard },
    ];

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        PARKING_MANAGER
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Parking Manager Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
                        Operations view for occupancy, revenue, active sessions,
                        incidents, and device approval pressure.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                        <Link href="/manager/facility/parkings">
                            <Plus data-icon="inline-start" />
                            Create Parking
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/manager/facility/slots/import">
                            <Import data-icon="inline-start" />
                            Import Slots
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/manager/facility/rfid-cards">
                            Generate RFID Cards
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/manager/staff-devices/kiosks">
                            Manage Kiosks
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/manager/operations/live-monitor">
                            View Live Monitor
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-sm">
                                    {stat.title}
                                </CardTitle>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Mock data / API pending
                                </p>
                            </div>
                            <div className="bg-muted flex size-9 items-center justify-center rounded-lg border">
                                <stat.icon className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold">
                                {stat.value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartCard title="Occupancy Trend By Hour">
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={mockOccupancyTrend}>
                            <CartesianGrid
                                stroke="var(--border)"
                                vertical={false}
                                strokeDasharray="4 4"
                            />
                            <XAxis dataKey="hour" tickLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area
                                dataKey="occupied"
                                stroke="var(--primary)"
                                fill="var(--primary)"
                                fillOpacity={0.18}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Revenue Split: Cash vs QR">
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={mockRevenueSplit}
                                dataKey="value"
                                nameKey="method"
                                innerRadius={56}
                                outerRadius={92}
                                paddingAngle={4}
                            >
                                {mockRevenueSplit.map((entry) => (
                                    <Cell
                                        key={entry.method}
                                        fill={entry.color}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Vehicle Type Distribution">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={mockVehicleDistribution}>
                            <CartesianGrid
                                stroke="var(--border)"
                                vertical={false}
                                strokeDasharray="4 4"
                            />
                            <XAxis dataKey="type" tickLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar
                                dataKey="count"
                                fill="var(--primary)"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Peak Hour Heatmap">
                    <div className="grid gap-2">
                        {mockHeatmap.map((row, rowIndex) => (
                            <div
                                key={rowIndex}
                                className="grid grid-cols-5 gap-2"
                            >
                                {row.map((value, columnIndex) => (
                                    <div
                                        key={`${rowIndex}-${columnIndex}`}
                                        className={`flex h-16 items-center justify-center rounded-lg border text-xs font-medium ${heatmapTone[value]}`}
                                    >
                                        {value}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
                <SnapshotCard title="Active Parkings List">
                    {mockActiveParkings.map((parking) => (
                        <div
                            key={parking.name}
                            className="rounded-lg border p-3"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-medium">{parking.name}</p>
                                <span className="text-xs">
                                    {parking.occupancy}
                                </span>
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {parking.sessions} active sessions
                            </p>
                        </div>
                    ))}
                </SnapshotCard>

                <SnapshotCard title="Recent Sessions">
                    {mockRecentSessions.map((session) => (
                        <div
                            key={session.plate}
                            className="rounded-lg border p-3"
                        >
                            <p className="font-medium">{session.plate}</p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {session.site} - {session.state}
                            </p>
                        </div>
                    ))}
                </SnapshotCard>

                <SnapshotCard title="Recent Red-Flag Actions">
                    {mockRedFlags.map((flag) => (
                        <div
                            key={flag}
                            className="flex gap-2 rounded-lg border p-3"
                        >
                            <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
                            <p className="text-sm">{flag}</p>
                        </div>
                    ))}
                </SnapshotCard>

                <SnapshotCard title="Device Approval Queue">
                    {mockDeviceQueue.map((item) => (
                        <div
                            key={item.device}
                            className="rounded-lg border p-3"
                        >
                            <p className="font-medium">{item.device}</p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Requested by {item.requester}
                            </p>
                        </div>
                    ))}
                </SnapshotCard>
            </div>
        </div>
    );
}

function ChartCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <p className="text-muted-foreground text-xs">
                    Mock data / API pending
                </p>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function SnapshotCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <p className="text-muted-foreground text-xs">
                    Mock data / API pending
                </p>
            </CardHeader>
            <CardContent className="space-y-3">{children}</CardContent>
        </Card>
    );
}
