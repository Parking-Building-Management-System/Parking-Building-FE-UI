import Link from 'next/link';
import {
    ArrowRight,
    Building2,
    Camera,
    Fingerprint,
    RadioTower,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Reveal } from './reveal';

const METRICS = [
    { label: 'Tenant-aware operations', value: 'Multi-site' },
    { label: 'Trusted device access', value: 'Zero setup' },
    { label: 'Staff-assisted entry', value: 'Webcam + QR' },
] as const;

export function HeroSection() {
    return (
        <section className="relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 sm:pt-40 lg:pb-28">
            <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_top,var(--muted),transparent_46%)]" />
            <div className="bg-border absolute inset-x-0 top-0 -z-10 mx-auto h-px max-w-6xl" />

            <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                    <Reveal>
                        <div className="border-border bg-card/70 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
                            <RadioTower className="size-3.5" />
                            Hardware-free IOT for modern parking operators
                        </div>
                    </Reveal>

                    <Reveal delay="short">
                        <h1 className="mt-8 max-w-4xl text-5xl leading-[0.95] font-semibold tracking-normal text-balance sm:text-6xl lg:text-7xl">
                            Next-Gen Parking Management for Enterprises
                        </h1>
                    </Reveal>

                    <Reveal delay="medium">
                        <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-7 text-pretty sm:text-lg">
                            SmartPark unifies tenants, staff workflows, trusted
                            devices, webcam-assisted plate capture, QR payments,
                            and shift controls without requiring dedicated gate
                            hardware.
                        </p>
                    </Reveal>

                    <Reveal delay="long">
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="group">
                                <Link href="/auth/login">
                                    Login to ERP
                                    <ArrowRight
                                        className="transition-transform group-hover:translate-x-0.5"
                                        data-icon="inline-end"
                                    />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="#features">Explore Platform</Link>
                            </Button>
                        </div>
                    </Reveal>

                    <Reveal delay="long">
                        <dl className="mt-12 grid gap-4 sm:grid-cols-3">
                            {METRICS.map((metric) => (
                                <div
                                    key={metric.label}
                                    className="border-border border-t pt-4"
                                >
                                    <dt className="text-muted-foreground text-xs">
                                        {metric.label}
                                    </dt>
                                    <dd className="mt-1 text-sm font-semibold">
                                        {metric.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>
                </div>

                <Reveal delay="medium">
                    <div
                        className="border-border bg-card/80 shadow-foreground/10 relative rounded-xl border p-3 shadow-2xl backdrop-blur"
                        aria-label="SmartPark operations console preview"
                    >
                        <div className="border-border bg-background rounded-lg border">
                            <div className="border-border flex items-center justify-between border-b px-4 py-3">
                                <div>
                                    <p className="text-xs font-medium">
                                        SmartPark Command
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        Live tenant operations
                                    </p>
                                </div>
                                <div className="bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-xs font-medium">
                                    Online
                                </div>
                            </div>

                            <div className="grid gap-3 p-4 sm:grid-cols-2">
                                <PreviewPanel
                                    icon={<Building2 className="size-4" />}
                                    label="Tenant isolation"
                                    value="8 buildings"
                                />
                                <PreviewPanel
                                    icon={<Camera className="size-4" />}
                                    label="Plate capture"
                                    value="Webcam ready"
                                />
                                <div className="border-border bg-muted/40 rounded-lg border p-4 sm:col-span-2">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">
                                                Parking Slot Matrix
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Floor B2 occupancy
                                            </p>
                                        </div>
                                        <Fingerprint className="text-muted-foreground size-4" />
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {Array.from({ length: 24 }).map(
                                            (_, index) => (
                                                <div
                                                    key={index}
                                                    className={
                                                        index % 5 === 0
                                                            ? 'bg-primary h-7 rounded-md'
                                                            : index % 3 === 0
                                                              ? 'bg-secondary h-7 rounded-md'
                                                              : 'border-border bg-card h-7 rounded-md border'
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function PreviewPanel({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="border-border bg-muted/40 rounded-lg border p-4">
            <div className="text-muted-foreground mb-4">{icon}</div>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
    );
}
