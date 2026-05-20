'use client';

import type { ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    return (
        <div className="bg-muted/40 flex min-h-svh">
            <Sidebar />
            <main className="min-w-0 flex-1">{children}</main>
        </div>
    );
}
