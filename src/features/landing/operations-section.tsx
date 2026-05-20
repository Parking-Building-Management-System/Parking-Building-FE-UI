import { ArrowDownRight, BadgeCheck, Layers3 } from 'lucide-react';

import { Reveal } from './reveal';

const WORKFLOW_ITEMS = [
    'Tenant-aware ERP workspace',
    'Staff entry validation',
    'Webcam plate capture',
    'QR and RFID assisted payments',
    'Blind drop reconciliation',
] as const;

export function OperationsSection() {
    return (
        <section id="operations" className="px-4 py-20 sm:px-6 lg:py-28">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <Reveal>
                    <div>
                        <p className="text-muted-foreground text-sm font-medium">
                            Operationally precise
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-5xl">
                            A control plane for daily parking execution.
                        </h2>
                        <p className="text-muted-foreground mt-5 max-w-xl leading-7">
                            SmartPark is designed around real site workflows:
                            staff actions, trusted devices, tenant isolation,
                            and manager review instead of fragile hardware
                            assumptions.
                        </p>
                    </div>
                </Reveal>

                <Reveal delay="short">
                    <div className="border-border bg-card/80 rounded-xl border p-4">
                        <div className="border-border bg-background rounded-lg border p-4">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">
                                        Shift Handover Flow
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        Staff to manager reconciliation
                                    </p>
                                </div>
                                <Layers3 className="text-muted-foreground size-5" />
                            </div>

                            <div className="space-y-3">
                                {WORKFLOW_ITEMS.map((item, index) => (
                                    <div
                                        key={item}
                                        className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border p-3"
                                    >
                                        <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium">
                                            {item}
                                        </span>
                                        {index === WORKFLOW_ITEMS.length - 1 ? (
                                            <BadgeCheck className="text-muted-foreground ml-auto size-4" />
                                        ) : (
                                            <ArrowDownRight className="text-muted-foreground ml-auto size-4" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
