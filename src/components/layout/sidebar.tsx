'use client';

import { createElement, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    ChevronLeft,
    ChevronRight,
    LogOut,
    ParkingCircle,
    User,
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
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    getNavigationItemsForRoles,
    type NavigationChildItem,
    type NavigationItem,
} from '@/config/navigation';
import { getDefaultRouteByRoles } from '@/lib/auth/role-routing';
import {
    findActiveNavigationHref,
    isNavigationGroupActive,
    normalizeNavigationPath,
} from '@/lib/navigation/route-matching';
import { cn } from '@/lib/utils';
import {
    getPendingViolationReportCountApi,
    staffQueryKeys,
} from '@/service/staff';
import {
    listManagerDeviceApprovalsApi,
    managerKioskDeviceQueryKeys,
} from '@/service/manager/kiosk-device-api';
import { logoutApi } from '@/service/user/api';
import { useAuthStore } from '@/stores/use-auth-store';
import { useSidebarStore } from '@/stores/use-sidebar-store';

const itemContainsCurrentRoute = (
    pathname: string,
    item: NavigationItem,
    activeLeafHref: string | null,
) => {
    if (item.children?.length) {
        return isNavigationGroupActive({
            pathname,
            groupPath: item.groupPath,
            childHrefs: item.children.map((child) => child.href),
            activeLeafHref,
        });
    }

    return normalizeNavigationPath(item.href) === activeLeafHref;
};

export function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const isCollapsed = useSidebarStore((state) => state.isCollapsed);
    const toggle = useSidebarStore((state) => state.toggle);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const roles = user?.roles ?? [];
    const groups = getNavigationItemsForRoles(roles);
    const leafHrefs = groups.flatMap((group) =>
        group.items.flatMap((item) =>
            item.children?.length
                ? item.children.map((child) => child.href)
                : [item.href],
        ),
    );
    const activeLeafHref = findActiveNavigationHref(pathname, leafHrefs);
    const homeHref = getDefaultRouteByRoles(roles);
    const roleLabel = roles.join(', ') || 'No role';
    const accordionDefaultValue = groups.flatMap((group) =>
        group.items
            .filter(
                (item) =>
                    item.children?.length &&
                    itemContainsCurrentRoute(
                        pathname,
                        item,
                        activeLeafHref,
                    ),
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
    const pendingViolationReportsQuery = useQuery({
        queryKey: staffQueryKeys.pendingViolationReportCount,
        queryFn: getPendingViolationReportCountApi,
        enabled:
            !isCheckingAuth &&
            roles.includes('STAFF') &&
            Boolean(user?.workContext),
        refetchInterval: 30_000,
        refetchOnWindowFocus: false,
    });
    const pendingViolationReports =
        pendingViolationReportsQuery.data?.pendingCount ?? 0;

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

    const firstLetter =
        user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U';

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
                                        activeLeafHref={activeLeafHref}
                                        pendingViolationReports={
                                            pendingViolationReports
                                        }
                                    />
                                ))
                            ) : (
                                <Accordion
                                    key={
                                        accordionDefaultValue.join('|') ||
                                        'no-active-group'
                                    }
                                    type="multiple"
                                    defaultValue={accordionDefaultValue}
                                    className="space-y-1"
                                >
                                    {group.items.map((item) => (
                                        <NavItem
                                            key={item.href}
                                            item={item}
                                            pathname={pathname}
                                            activeLeafHref={activeLeafHref}
                                            pendingDeviceApprovals={
                                                pendingDeviceApprovals
                                            }
                                            pendingDeviceApprovalsLoading={
                                                deviceApprovalsQuery.isLoading
                                            }
                                            pendingViolationReports={
                                                pendingViolationReports
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
                                'hover:bg-muted/60 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors focus:outline-none',
                                isCollapsed && 'justify-center px-0',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex min-w-0 flex-1 items-center gap-3',
                                    isCollapsed && 'justify-center',
                                )}
                            >
                                <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                    {firstLetter.toUpperCase()}
                                </div>

                                {!isCollapsed && (
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {user?.fullName ||
                                                user?.username ||
                                                'User'}
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
                        align={isCollapsed ? 'center' : 'start'}
                        className="bg-background w-56 space-y-2 rounded-xl border p-2 shadow-md"
                    >
                        <div className="text-muted-foreground flex items-center justify-between px-2 py-1.5 text-sm">
                            <span>Theme</span>
                            <ThemeToggle />
                        </div>

                        <DropdownMenuSeparator />

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-muted-foreground data-[state=open]:bg-muted/50 data-[state=open]:text-foreground cursor-pointer gap-3 rounded-lg px-2 py-2 text-sm font-normal">
                                <User className="size-4" />
                                <span>Profile</span>
                            </DropdownMenuSubTrigger>

                            <DropdownMenuSubContent className="bg-background animate-in fade-in-50 w-64 space-y-2.5 rounded-xl border p-3 text-sm shadow-lg duration-100">
                                <div>
                                    <span className="text-muted-foreground block text-[11px] font-medium tracking-wider uppercase">
                                        User
                                    </span>
                                    <span className="text-foreground mt-0.5 block font-semibold">
                                        {user?.fullName ||
                                            user?.username ||
                                            'User'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-muted-foreground block text-[11px] font-medium tracking-wider uppercase">
                                        Roles
                                    </span>
                                    <span className="mt-1 block text-xs font-bold tracking-wide text-teal-600 dark:text-teal-400">
                                        {user?.roles?.join(', ') || roleLabel}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-muted-foreground block text-[11px] font-medium tracking-wider uppercase">
                                        Status
                                    </span>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <span className="relative flex size-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                        </span>
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                            Online
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        <Button
                            type="button"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground w-full justify-start"
                            disabled={isLoggingOut}
                            onClick={(e) => {
                                e.preventDefault();
                                handleLogout();
                            }}
                            title="Logout"
                        >
                            <LogOut className="mr-2 size-4" />
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
    activeLeafHref,
    pendingViolationReports,
}: {
    item: NavigationItem;
    pathname: string;
    activeLeafHref: string | null;
    pendingViolationReports: number;
}) {
    const isActive = itemContainsCurrentRoute(
        pathname,
        item,
        activeLeafHref,
    );
    const pendingCount =
        item.href === '/staff/violation-reports'
            ? pendingViolationReports
            : 0;

    return (
        <Button
            asChild
            variant={isActive ? 'secondary' : 'ghost'}
            className="relative w-full justify-center px-0"
            title={item.title}
        >
            <Link href={item.href}>
                {createElement(item.icon, {
                    className: 'size-4',
                })}
                <span className="sr-only">{item.title}</span>
                <PendingCountBadge count={pendingCount} collapsed />
            </Link>
        </Button>
    );
}

function NavItem({
    item,
    pathname,
    activeLeafHref,
    pendingDeviceApprovals,
    pendingDeviceApprovalsLoading,
    pendingViolationReports,
}: {
    item: NavigationItem;
    pathname: string;
    activeLeafHref: string | null;
    pendingDeviceApprovals: number;
    pendingDeviceApprovalsLoading: boolean;
    pendingViolationReports: number;
}) {
    const router = useRouter();
    const isActive =
        normalizeNavigationPath(item.href) === activeLeafHref;
    const isExpanded = itemContainsCurrentRoute(
        pathname,
        item,
        activeLeafHref,
    );

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
                    <PendingCountBadge
                        count={
                            item.href === '/staff/violation-reports'
                                ? pendingViolationReports
                                : 0
                        }
                    />
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
                onClick={() => {
                    if (item.navigateOnTrigger) {
                        router.push(item.href);
                    }
                }}
            >
                <span className="flex min-w-0 items-center gap-1.5">
                    {createElement(item.icon, {
                        className: 'size-4 shrink-0',
                    })}
                    <span className="truncate">{item.title}</span>
                </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pt-1 pb-1 pl-5">
                {item.children.map((child) => (
                    <ChildNavLink
                        key={child.href}
                        child={child}
                        activeLeafHref={activeLeafHref}
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

function PendingCountBadge({
    count,
    collapsed = false,
}: {
    count: number;
    collapsed?: boolean;
}) {
    if (count <= 0) {
        return null;
    }

    return (
        <span
            className={cn(
                'bg-primary text-primary-foreground inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] leading-none',
                collapsed ? 'absolute top-0.5 right-0.5' : 'ml-auto',
            )}
            aria-label={`${count} violation reports pending review`}
        >
            {count > 99 ? '99+' : count}
        </span>
    );
}

function ChildNavLink({
    child,
    activeLeafHref,
    pendingCount,
    pendingLoading,
}: {
    child: NavigationChildItem;
    activeLeafHref: string | null;
    pendingCount: number;
    pendingLoading: boolean;
}) {
    const isActive =
        normalizeNavigationPath(child.href) === activeLeafHref;

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

    return items.filter((item) => item.status === 'PENDING').length;
}
