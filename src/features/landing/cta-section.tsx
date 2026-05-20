import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Reveal } from './reveal';

export function CTASection() {
    return (
        <section id="platform" className="px-4 py-20 sm:px-6 lg:py-28">
            <Reveal>
                <div className="border-border bg-card/80 mx-auto max-w-6xl rounded-xl border p-6 text-center sm:p-10 lg:p-14">
                    <p className="text-muted-foreground text-sm font-medium">
                        Enterprise parking SaaS
                    </p>
                    <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-normal text-balance sm:text-5xl">
                        Launch a cleaner operating model for every building,
                        tenant, and shift.
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-5 max-w-2xl leading-7">
                        Access the ERP workspace and continue from a secure,
                        role-aware SmartPark control center.
                    </p>
                    <div className="mt-8">
                        <Button asChild size="lg" className="group">
                            <Link href="/auth/login">
                                Access Workspace
                                <ArrowRight
                                    className="transition-transform group-hover:translate-x-0.5"
                                    data-icon="inline-end"
                                />
                            </Link>
                        </Button>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}
