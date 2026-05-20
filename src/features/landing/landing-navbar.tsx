'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { href: '#platform', label: 'Platform' },
    { href: '#features', label: 'Features' },
    { href: '#operations', label: 'Operations' },
] as const;

export function LandingNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 12);

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
            <div
                className={cn(
                    'mx-auto flex h-14 max-w-6xl items-center justify-between rounded-xl border px-3 transition-all duration-300 sm:px-4',
                    isScrolled
                        ? 'border-border bg-background/80 shadow-foreground/5 shadow-lg backdrop-blur-xl'
                        : 'bg-background/20 border-transparent backdrop-blur-sm',
                )}
            >
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-semibold tracking-normal"
                    aria-label="SmartPark home"
                >
                    <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
                        SP
                    </span>
                    <span>SmartPark</span>
                </Link>

                <nav className="hidden items-center gap-1 md:flex">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <Button asChild size="sm" className="group">
                    <Link href="/auth/login">
                        Access Workspace
                        <ArrowRight
                            className="transition-transform group-hover:translate-x-0.5"
                            data-icon="inline-end"
                        />
                    </Link>
                </Button>
            </div>
        </header>
    );
}
