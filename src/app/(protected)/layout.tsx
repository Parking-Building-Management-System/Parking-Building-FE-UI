'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/use-auth-store';

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const user = useAuthStore((state) => state.user);

    return (
        <div className="bg-muted min-h-svh">
            <header className="bg-background sticky top-0 z-40 border-b">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <Link href="/" className="font-bold">
                        SmartPark
                    </Link>

                    <nav className="flex items-center gap-2">
                        <Button variant="ghost" asChild>
                            <Link href="/admin">Admin</Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/manager">Manager</Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/staff">Staff</Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/driver">Driver</Link>
                        </Button>
                    </nav>

                    <div className="text-muted-foreground text-sm">
                        {user?.fullName || user?.username || 'Guest'}
                    </div>
                </div>
            </header>

            <main>{children}</main>
        </div>
    );
}
