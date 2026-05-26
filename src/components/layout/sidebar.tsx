'use client';

import { createElement, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, LogOut, ParkingCircle } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    getNavigationItemsForRoles,
    type NavigationChildItem,
    type NavigationItem,
} from '@/config/navigation';
import { getDefaultRouteByRoles } from '@/lib/auth/role-routing';
import { cn } from '@/lib/utils';
import { logoutApi } from '@/service/user/api';
import { useAuthStore } from '@/stores/use-auth-store';
import { useSidebarStore } from '@/stores/use-sidebar-store';

const isRouteActive = (pathname: string, href: string) => {
    return (
        pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))
    );
};

const itemHasActiveRoute = (pathname: string, item: NavigationItem) => {
    return (
        isRouteActive(pathname, item.href) ||
        item.children?.some((child) => isRouteActive(pathname, child.href)) ===
            true
    );
};

export function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const isCollapsed = useSidebarStore((state) => state.isCollapsed);
    const toggle = useSidebarStore((state) => state.toggle);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const roles = user?.roles ?? [];
    const groups = getNavigationItemsForRoles(roles);
    const homeHref = getDefaultRouteByRoles(roles);
    const roleLabel = roles.join(', ') || 'No role';
    const accordionDefaultValue = groups.flatMap((group) =>
        group.items
            .filter((item) => item.children?.length)
            .map((item) => item.href),
    );

    if (groups.length === 0) {
        return null;
    }

    const handleLogout = async () => {
        if (isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);

        try {
            await logoutApi();
            toast.success('Logged out successfully.');
        } catch {
            toast.info('Session cleared locally.');
        } finally {
            clearAuth();
            setIsLoggingOut(false);
            router.replace('/auth/login');
        }
    };

    return (
        <aside
            className={cn(
                'bg-background sticky top-0 flex h-svh shrink-0 flex-col border-r transition-[width] duration-300 ease-out',
                isCollapsed ? 'w-16' : 'w-72',
            )}
        >
            <div className="flex h-16 items-center gap-3 border-b px-3">
                <Link
                    href={homeHref}
                    className="flex min-w-0 flex-1 items-center gap-3"
                    aria-label="SmartPark dashboard"
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
                        SmartPark
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
                            {isCollapsed ? (
                                group.items.map((item) => (
                                    <CollapsedNavItem
                                        key={item.href}
                                        item={item}
                                        pathname={pathname}
                                    />
                                ))
                            ) : (
                                <Accordion
                                    type="multiple"
                                    defaultValue={accordionDefaultValue}
                                    className="space-y-1"
                                >
                                    {group.items.map((item) => (
                                        <NavItem
                                            key={item.href}
                                            item={item}
                                            pathname={pathname}
                                        />
                                    ))}
                                </Accordion>
                            )}
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
                            {user?.fullName || user?.username || 'User'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                            {roleLabel}
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                        'mt-3 w-full justify-start',
                        isCollapsed && 'justify-center px-0',
                    )}
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    title="Logout"
                >
                    <LogOut data-icon="inline-start" />
                    <span
                        className={cn(
                            'truncate',
                            isCollapsed ? 'sr-only' : 'inline',
                        )}
                    >
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </span>
                </Button>
            </div>
        </aside>
    );
}

function CollapsedNavItem({
    item,
    pathname,
}: {
    item: NavigationItem;
    pathname: string;
}) {
    const isActive = itemHasActiveRoute(pathname, item);

    return (
        <Button
            asChild
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-center px-0"
            title={item.title}
        >
            <Link href={item.href}>
                {createElement(item.icon, {
                    className: 'size-4',
                })}
                <span className="sr-only">{item.title}</span>
            </Link>
        </Button>
    );
}

function NavItem({
    item,
    pathname,
}: {
    item: NavigationItem;
    pathname: string;
}) {
    const isActive = itemHasActiveRoute(pathname, item);

    if (!item.children?.length) {
        return (
            <Button
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                title={item.title}
            >
                <Link href={item.href}>
                    {createElement(item.icon, {
                        className: 'size-4',
                    })}
                    <span className="truncate">{item.title}</span>
                </Link>
            </Button>
        );
    }

    return (
        <AccordionItem value={item.href} className="border-b-0">
            <AccordionTrigger
                className={cn(
                    'h-8 rounded-lg px-2.5 py-0 text-sm hover:no-underline',
                    isActive && 'bg-secondary text-secondary-foreground',
                )}
            >
                <span className="flex min-w-0 items-center gap-1.5">
                    {createElement(item.icon, {
                        className: 'size-4 shrink-0',
                    })}
                    <span className="truncate">{item.title}</span>
                </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pt-1 pb-1 pl-5">
                <ChildNavLink
                    child={{ title: 'Overview', href: item.href }}
                    pathname={pathname}
                />
                {item.children.map((child) => (
                    <ChildNavLink
                        key={child.href}
                        child={child}
                        pathname={pathname}
                    />
                ))}
            </AccordionContent>
        </AccordionItem>
    );
}

function ChildNavLink({
    child,
    pathname,
}: {
    child: NavigationChildItem;
    pathname: string;
}) {
    const isActive = pathname === child.href;

    return (
        <Button
            asChild
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-full justify-start px-2 text-xs"
            title={child.title}
        >
            <Link href={child.href}>
                <span className="truncate">{child.title}</span>
            </Link>
        </Button>
    );
}
