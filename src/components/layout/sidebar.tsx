'use client';

import { createElement, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, 
         ChevronRight, 
         LogOut, 
         ParkingCircle,
       } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    getNavigationItemsForRoles,
    type NavigationChildItem,
    type NavigationItem,
} from '@/config/navigation';
import { getDefaultRouteByRoles } from '@/lib/auth/role-routing';
import { cn } from '@/lib/utils';
import {
    listManagerDeviceApprovalsApi,
    managerKioskDeviceQueryKeys,
} from '@/service/manager/kiosk-device-api';
import { logoutApi } from '@/service/user/api';
import { useAuthStore } from '@/stores/use-auth-store';
import { useSidebarStore } from '@/stores/use-sidebar-store';

const isLeafActive = (pathname: string, href: string) => pathname === href;

const isGroupExpanded = (pathname: string, href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
};

const itemContainsCurrentRoute = (pathname: string, item: NavigationItem) => {
    if (item.children?.length) {
        return isGroupExpanded(pathname, item.href);
    }

    return isLeafActive(pathname, item.href);
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
            .filter(
                (item) =>
                    item.children?.length &&
                    itemContainsCurrentRoute(pathname, item),
            )
            .map((item) => item.href),
    );
    const deviceApprovalsQuery = useQuery({
        queryKey: managerKioskDeviceQueryKeys.deviceApprovals,
        queryFn: listManagerDeviceApprovalsApi,
        enabled: roles.includes('PARKING_MANAGER'),
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
    const pendingDeviceApprovals = getPendingApprovalCount(
        deviceApprovalsQuery.data,
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

    const firstLetter = user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U';

    return (
        <aside
            className={cn(
                'bg-background sticky top-0 flex h-svh shrink-0 flex-col border-r transition-[width] duration-300 ease-out',
                isCollapsed ? 'w-16' : 'w-72',
            )}
        >
            <div className="flex h-16 shrink-0 items-center gap-3 border-b px-3">
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

            <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4">
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
                                            pendingDeviceApprovals={
                                                pendingDeviceApprovals
                                            }
                                            pendingDeviceApprovalsLoading={
                                                deviceApprovalsQuery.isLoading
                                            }
                                        />
                                    ))}
                                </Accordion>
                            )}
                        </div>
                    </div>
                ))}
            </nav>
            
<div className="shrink-0 border-t p-3">
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button
                type="button"
                className={cn(
                    'flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-muted/60 transition-colors focus:outline-none',
                    isCollapsed && 'justify-center px-0'
                )}
            >
                
                <div
                    className={cn(
                        'flex flex-1 items-center gap-3 min-w-0',
                        isCollapsed && 'justify-center',
                    )}
                >
                    
                    <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-sm">
                        {firstLetter.toUpperCase()}
                    </div>
                    
                    {!isCollapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {user?.fullName || user?.username || 'User'}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                                {roleLabel}
                            </p>
                        </div>
                    )}
                </div>
            </button>
        </DropdownMenuTrigger>

        
        <DropdownMenuContent 
            side="top" 
            align={isCollapsed ? "center" : "start"} 
            className="w-56 p-2 rounded-xl border bg-background shadow-md space-y-2"
        >
            <div className="flex items-center justify-between px-2 py-1.5 text-sm text-muted-foreground">
                <span>Theme</span>
                <ThemeToggle />
            </div>

            <DropdownMenuSeparator />

            <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                disabled={isLoggingOut}
                onClick={(e) => {
                    e.preventDefault(); 
                    handleLogout();
                }}
                title="Logout"
            >
                <LogOut className="size-4 mr-2" />
                <span className="truncate">
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
            </Button>
        </DropdownMenuContent>
    </DropdownMenu>
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
    const isActive = itemContainsCurrentRoute(pathname, item);

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
    pendingDeviceApprovals,
    pendingDeviceApprovalsLoading,
}: {
    item: NavigationItem;
    pathname: string;
    pendingDeviceApprovals: number;
    pendingDeviceApprovalsLoading: boolean;
}) {
    const isActive = isLeafActive(pathname, item.href);
    const isExpanded = itemContainsCurrentRoute(pathname, item);

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
                    isExpanded && 'text-foreground',
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
                {item.showOverviewChild !== false && (
                    <ChildNavLink
                        child={{ title: 'Overview', href: item.href }}
                        pathname={pathname}
                        pendingCount={0}
                        pendingLoading={false}
                    />
                )}
                {item.children.map((child) => (
                    <ChildNavLink
                        key={child.href}
                        child={child}
                        pathname={pathname}
                        pendingCount={
                            child.href ===
                            '/manager/staff-devices/device-approvals'
                                ? pendingDeviceApprovals
                                : 0
                        }
                        pendingLoading={
                            child.href ===
                                '/manager/staff-devices/device-approvals' &&
                            pendingDeviceApprovalsLoading
                        }
                    />
                ))}
            </AccordionContent>
        </AccordionItem>
    );
}

function ChildNavLink({
    child,
    pathname,
    pendingCount,
    pendingLoading,
}: {
    child: NavigationChildItem;
    pathname: string;
    pendingCount: number;
    pendingLoading: boolean;
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
                {pendingLoading ? (
                    <span className="bg-muted-foreground/40 ml-auto size-1.5 shrink-0 rounded-full" />
                ) : pendingCount > 0 ? (
                    <span className="bg-primary text-primary-foreground ml-auto inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] leading-none">
                        {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                ) : null}
            </Link>
        </Button>
    );
}

function getPendingApprovalCount(
    items?: { status: string }[] & { totalElements?: number },
) {
    if (!items) {
        return 0;
    }

    if (typeof items.totalElements === 'number') {
        return items.totalElements;
    }

    return items.filter((item) => item.status === 'PENDING').length;
}
