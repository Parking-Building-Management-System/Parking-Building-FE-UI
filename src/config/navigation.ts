import type { ComponentType } from 'react';
import {
    Building2,
    CarFront,
    Database,
    Gauge,
    LayoutDashboard,
    ParkingCircle,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';

import type { Role } from '@/service/user/type';

export type NavigationGroupRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface NavigationItem {
    title: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    roles: Role[];
}

export interface NavigationGroup {
    role: NavigationGroupRole;
    title: string;
    items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
    {
        role: 'ADMIN',
        title: 'System Admin',
        items: [
            {
                title: 'Global Dashboard',
                href: '/admin',
                icon: LayoutDashboard,
                roles: ['SYSTEM_ADMIN'],
            },
            {
                title: 'Tenant Management',
                href: '/admin/tenants',
                icon: Building2,
                roles: ['SYSTEM_ADMIN'],
            },
            {
                title: 'Master Data',
                href: '/admin/master-data',
                icon: Database,
                roles: ['SYSTEM_ADMIN'],
            },
        ],
    },
    {
        role: 'MANAGER',
        title: 'Parking Manager',
        items: [
            {
                title: 'Manager Dashboard',
                href: '/manager',
                icon: Gauge,
                roles: ['PARKING_MANAGER'],
            },
            {
                title: 'Parking Operations',
                href: '/manager/parkings',
                icon: CarFront,
                roles: ['PARKING_MANAGER'],
            },
            {
                title: 'Slot Management',
                href: '/manager/slots',
                icon: ParkingCircle,
                roles: ['PARKING_MANAGER'],
            },
        ],
    },
    {
        role: 'STAFF',
        title: 'Staff',
        items: [
            {
                title: 'Staff Dashboard',
                href: '/staff',
                icon: UsersRound,
                roles: ['STAFF'],
            },
            {
                title: 'Device Check',
                href: '/staff/devices',
                icon: ShieldCheck,
                roles: ['STAFF'],
            },
        ],
    },
];

export const getNavigationItemsForRoles = (roles: Role[]) => {
    return navigationGroups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
                item.roles.some((role) => roles.includes(role)),
            ),
        }))
        .filter((group) => group.items.length > 0);
};
