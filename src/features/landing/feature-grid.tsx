import { createElement } from 'react';
import type { ComponentType } from 'react';
import { Building2, Camera, Fingerprint, HandCoins } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Reveal } from './reveal';

type IconComponent = ComponentType<{ className?: string }>;

const FEATURES: {
    title: string;
    description: string;
    icon: IconComponent;
    className: string;
}[] = [
    {
        title: 'Multi-Tenant Data Isolation',
        description:
            'Keep operators, buildings, users, roles, permissions, and parking data separated by tenant from day one.',
        icon: Building2,
        className: 'lg:col-span-2',
    },
    {
        title: 'Human-Operated IOT',
        description:
            'Use staff webcams and QR workflows to run assisted entry, exit, validation, and payment without gate controllers.',
        icon: Camera,
        className: '',
    },
    {
        title: 'Blind Drop Shift Handover',
        description:
            'Design cash handovers around evidence, reconciliation, manager approval, and clear shift accountability.',
        icon: HandCoins,
        className: '',
    },
    {
        title: 'Device Fingerprinting',
        description:
            'Pair access tokens with trusted browser devices so ERP sessions can be checked against approved workstations.',
        icon: Fingerprint,
        className: 'lg:col-span-2',
    },
];

export function FeatureGrid() {
    return (
        <section id="features" className="px-4 py-20 sm:px-6 lg:py-28">
            <div className="mx-auto max-w-6xl">
                <Reveal>
                    <div className="max-w-3xl">
                        <p className="text-muted-foreground text-sm font-medium">
                            Platform capabilities
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-5xl">
                            Built for parking teams that need speed, control,
                            and tenant-grade boundaries.
                        </h2>
                    </div>
                </Reveal>

                <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((feature, index) => (
                        <Reveal
                            key={feature.title}
                            delay={
                                index === 0
                                    ? 'none'
                                    : index === 1
                                      ? 'short'
                                      : index === 2
                                        ? 'medium'
                                        : 'long'
                            }
                            className={feature.className}
                        >
                            <Card className="border-border bg-card/80 group hover:shadow-foreground/5 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                                <CardHeader>
                                    <div className="bg-muted text-foreground mb-6 flex size-11 items-center justify-center rounded-lg border">
                                        {createElement(feature.icon, {
                                            className:
                                                'size-5 transition-transform duration-300 group-hover:scale-110',
                                        })}
                                    </div>
                                    <CardTitle className="text-xl">
                                        {feature.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-6">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
