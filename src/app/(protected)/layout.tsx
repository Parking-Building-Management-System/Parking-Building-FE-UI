'use client';

import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Sidebar } from '@/components/layout/sidebar';
import { canAccessPath, getDefaultRouteByRoles } from '@/lib/auth/role-routing';
import { useAuthStore } from '@/stores/use-auth-store';

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
    const userRoles = useMemo(() => user?.roles ?? [], [user?.roles]);
    const canAccessCurrentPath = useMemo(
        () => canAccessPath(pathname, userRoles),
        [pathname, userRoles],
    );

    useEffect(() => {
        if (isCheckingAuth) {
            return;
        }

        if (!isAuthenticated) {
            router.replace('/auth/login');
            return;
        }

        if (!canAccessCurrentPath) {
            router.replace(getDefaultRouteByRoles(userRoles));
        }
    }, [
        canAccessCurrentPath,
        isAuthenticated,
        isCheckingAuth,
        router,
        userRoles,
    ]);

    if (isCheckingAuth) {
        return (
            <div className="bg-muted/40 flex min-h-svh items-center justify-center p-6">
                <div className="text-muted-foreground text-sm">
                    Checking session...
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !canAccessCurrentPath) {
        return (
            <div className="bg-muted/40 flex min-h-svh items-center justify-center p-6">
                <div className="text-muted-foreground text-sm">
                    Redirecting...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-muted/40 flex min-h-svh">
            <Sidebar />
            <main className="min-w-0 flex-1">{children}</main>
        </div>
    );
}
