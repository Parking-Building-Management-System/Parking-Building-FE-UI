'use client';

import { AuthBootstrap } from '@/components/auth/auth-bootstrap';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <QueryProvider>
                <AuthBootstrap />
                {children}
            </QueryProvider>
        </ThemeProvider>
    );
}
