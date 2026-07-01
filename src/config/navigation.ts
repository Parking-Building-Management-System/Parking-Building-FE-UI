import type { ComponentType } from 'react';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Building2,
    CarFront,
    ClipboardList,
    CreditCard,
    Database,
    DoorOpen,
    Gauge,
    LayoutDashboard,
    Monitor,
    Receipt,
    Settings,
    ShieldCheck,
    ShieldAlert,
    Siren,
    UsersRound,
} from 'lucide-react';

import type { Role } from '@/service/user/type';

export type NavigationGroupRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface NavigationItem {
    title: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    roles: Role[];
    showOverviewChild?: boolean;
    children?: NavigationChildItem[];
}

export interface NavigationChildItem {
    title: string;
    href: string;
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
                title: 'Dashboard',
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
                showOverviewChild: false,
                children: [
                    {
                        title: 'Vehicle Types',
                        href: '/admin/master-data/vehicle-types',
                    },
                    {
                        title: 'Roles & Permissions',
                        href: '/admin/master-data/roles-permissions',
                    },
                ],
            },
            {
                title: 'System Health',
                href: '/admin/system-health',
                icon: Activity,
                roles: ['SYSTEM_ADMIN'],
                showOverviewChild: false,
                children: [
                    {
                        title: 'API Health',
                        href: '/admin/system-health/api',
                    },
                    {
                        title: 'API Traffic',
                        href: '/admin/system-health/traffic',
                    },
                ],
            },
            {
                title: 'Audit & Security',
                href: '/admin/audit',
                icon: ShieldCheck,
                roles: ['SYSTEM_ADMIN'],
                showOverviewChild: false,
                children: [
                    {
                        title: 'Audit Logs',
                        href: '/admin/audit/logs',
                    },
                    {
                        title: 'Force Logout Sessions',
                        href: '/admin/audit/sessions',
                    },
                ],
            },
        ],
    },
    {
        role: 'MANAGER',
        title: 'Parking Manager',
        items: [
            {
                title: 'Dashboard',
                href: '/manager',
                icon: Gauge,
                roles: ['PARKING_MANAGER'],
            },
            {
                title: 'Facility Setup',
                href: '/manager/facility',
                icon: CarFront,
                roles: ['PARKING_MANAGER'],
                children: [
                    {
                        title: 'Parkings',
                        href: '/manager/facility/parkings',
                    },
                    {
                        title: 'Floors',
                        href: '/manager/facility/floors',
                    },
                    {
                        title: 'Zones',
                        href: '/manager/facility/zones',
                    },
                    {
                        title: 'Slots',
                        href: '/manager/facility/slots',
                    },
                    {
                        title: 'Maps / Floor Plans',
                        href: '/manager/facility/maps',
                    },
                    {
                        title: 'Slot Import / Export',
                        href: '/manager/facility/slots/import',
                    },
                    {
                        title: 'RFID Cards',
                        href: '/manager/facility/rfid-cards',
                    },
                ],
            },
            {
                title: 'Staff & Devices',
                href: '/manager/staff-devices',
                icon: UsersRound,
                roles: ['PARKING_MANAGER'],
                children: [
                    {
                        title: 'Staff Accounts',
                        href: '/manager/staff-devices/staff',
                    },
                    {
                        title: 'Kiosks / Gates',
                        href: '/manager/staff-devices/kiosks',
                    },
                    {
                        title: 'Device Approvals',
                        href: '/manager/staff-devices/device-approvals',
                    },
                    {
                        title: 'Kill Switch',
                        href: '/manager/staff-devices/kill-switch',
                    },
                ],
            },
            {
                title: 'Operations',
                href: '/manager/operations',
                icon: Monitor,
                roles: ['PARKING_MANAGER'],
                children: [
                    {
                        title: 'Live Monitor',
                        href: '/manager/operations/live-monitor',
                    },
                    {
                        title: 'Active Sessions',
                        href: '/manager/operations/sessions',
                    },
                    {
                        title: 'Entry / Exit Logs',
                        href: '/manager/operations/logs',
                    },
                    {
                        title: 'Exceptions',
                        href: '/manager/operations/exceptions',
                    },
                ],
            },
            {
                title: 'Pricing & Billing',
                href: '/manager/pricing',
                icon: CreditCard,
                roles: ['PARKING_MANAGER'],
                children: [
                    {
                        title: 'Overview',
                        href: '/manager/pricing',
                    },
                    {
                        title: 'Pricing Config',
                        href: '/manager/pricing/config',
                    },
                    {
                        title: 'Penalty Rules',
                        href: '/manager/pricing/penalty-rules',
                    },
                ],
            },
            {
                title: 'Safety & Compliance',
                href: '/manager/safety',
                icon: ShieldAlert,
                roles: ['PARKING_MANAGER'],
                children: [
                    {
                        title: 'Fire Extinguishers',
                        href: '/manager/safety/fire-extinguishers',
                    },
                    {
                        title: 'Fire Safety Map',
                        href: '/manager/safety/fire-map',
                    },
                    {
                        title: 'Inspection Logs',
                        href: '/manager/safety/inspections',
                    },
                ],
            },
            {
                title: 'Incidents & Violations',
                href: '/manager/incidents',
                icon: AlertTriangle,
                roles: ['PARKING_MANAGER'],
                children: [
                    {
                        title: 'Incident Log',
                        href: '/manager/incidents/logs',
                    },
                    {
                        title: 'Zone Violations',
                        href: '/manager/incidents/zone-violations',
                    },
                    {
                        title: 'Red Flag Actions',
                        href: '/manager/incidents/red-flags',
                    },
                ],
            },
            {
                title: 'Analytics',
                href: '/manager/analytics',
                icon: BarChart3,
                roles: ['PARKING_MANAGER'],
                children: [
                    {
                        title: 'Revenue',
                        href: '/manager/analytics/revenue',
                    },
                    {
                        title: 'Occupancy',
                        href: '/manager/analytics/occupancy',
                    },
                    {
                        title: 'Traffic Heatmap',
                        href: '/manager/analytics/traffic-heatmap',
                    },
                ],
            },
            {
                title: 'Settings',
                href: '/manager/settings',
                icon: Settings,
                roles: ['PARKING_MANAGER'],
            },
        ],
    },
    {
        role: 'STAFF',
        title: 'Staff Operations',
        items: [
            {
                title: 'Entry Gate',
                href: '/staff',
                icon: DoorOpen,
                roles: ['STAFF'],
            },
            {
                title: 'Exit Cashier',
                href: '/staff/exit',
                icon: Receipt,
                roles: ['STAFF'],
            },
            {
                title: 'Lost Card',
                href: '/staff/lost-card',
                icon: CreditCard,
                roles: ['STAFF'],
            },
            {
                title: 'Fire Inspection',
                href: '/staff/fire-inspection',
                icon: ShieldAlert,
                roles: ['STAFF'],
            },
            {
                title: 'Live Monitor',
                href: '/staff/live-monitor',
                icon: Monitor,
                roles: ['STAFF'],
            },
            {
                title: 'Exceptions',
                href: '/staff/exceptions',
                icon: Siren,
                roles: ['STAFF'],
            },
            {
                title: 'Shift Handover',
                href: '/staff/shift-handover',
                icon: ClipboardList,
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
