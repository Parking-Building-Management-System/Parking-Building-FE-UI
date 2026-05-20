'use client';

import { createElement } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, ParkingCircle } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { getNavigationItemsForRoles } from '@/config/navigation';
import { cn } from '@/lib/utils';
import type { Role } from '@/service/user/type';
import { useAuthStore } from '@/stores/use-auth-store';
import { useSidebarStore } from '@/stores/use-sidebar-store';

const MOCKED_SYSTEM_ADMIN_ROLES: Role[] = ['SYSTEM_ADMIN'];

export function Sidebar() {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const isCollapsed = useSidebarStore((state) => state.isCollapsed);
    const toggle = useSidebarStore((state) => state.toggle);
    const roles = user?.roles?.length ? user.roles : MOCKED_SYSTEM_ADMIN_ROLES;
    const groups = getNavigationItemsForRoles(roles);

    return (
        <aside
            className={cn(
                'bg-background sticky top-0 flex h-svh shrink-0 flex-col border-r transition-[width] duration-300 ease-out',
                isCollapsed ? 'w-16' : 'w-72',
            )}
        >
            <div className="flex h-16 items-center gap-3 border-b px-3">
                <Link
                    href="/admin"
                    className="flex min-w-0 flex-1 items-center gap-3"
                    aria-label="SmartPark admin dashboard"
                >
                    <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <ParkingCircle className="size-5" />
                    </span>
                    <span
                        className={cn(
                            'min-w-0 text-sm font-semibold whitespace-nowrap transition-opacity duration-200',
                            isCollapsed
                                ? 'pointer-events-none opacity-0'
                                : 'opacity-100',
                        )}
                    >
                        SmartPark Admin
                    </span>
                </Link>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggle}
                    aria-label={
                        isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                    }
                >
                    {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                </Button>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
                {groups.map((group) => (
                    <div key={group.role} className="space-y-2">
                        <p
                            className={cn(
                                'text-muted-foreground px-2 text-xs font-medium whitespace-nowrap uppercase transition-opacity duration-200',
                                isCollapsed ? 'opacity-0' : 'opacity-100',
                            )}
                        >
                            {group.title}
                        </p>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== '/admin' &&
                                        pathname.startsWith(`${item.href}/`));

                                return (
                                    <Button
                                        key={item.href}
                                        asChild
                                        variant={
                                            isActive ? 'secondary' : 'ghost'
                                        }
                                        className={cn(
                                            'w-full justify-start',
                                            isCollapsed &&
                                                'justify-center px-0',
                                        )}
                                        title={item.title}
                                    >
                                        <Link href={item.href}>
                                            {createElement(item.icon, {
                                                className: 'size-4',
                                            })}
                                            <span
                                                className={cn(
                                                    'truncate transition-opacity duration-200',
                                                    isCollapsed
                                                        ? 'sr-only'
                                                        : 'opacity-100',
                                                )}
                                            >
                                                {item.title}
                                            </span>
                                        </Link>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="border-t p-3">
                <div
                    className={cn(
                        'flex items-center gap-3',
                        isCollapsed && 'justify-center',
                    )}
                >
                    <ThemeToggle />
                    <div
                        className={cn(
                            'min-w-0 transition-opacity duration-200',
                            isCollapsed ? 'hidden' : 'block',
                        )}
                    >
                        <p className="truncate text-sm font-medium">
                            {user?.fullName || 'System Admin'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                            SYSTEM_ADMIN
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
