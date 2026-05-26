import type { Role } from '@/service/user/type';

export const ROLE_DEFAULT_ROUTES: Record<Role, string> = {
    SYSTEM_ADMIN: '/admin',
    PARKING_MANAGER: '/manager',
    STAFF: '/staff',
    PARKING_USER: '/driver',
};

const PROTECTED_ROUTE_ROLES: Array<{
    prefix: string;
    roles: Role[];
}> = [
    {
        prefix: '/admin',
        roles: ['SYSTEM_ADMIN'],
    },
    {
        prefix: '/manager',
        roles: ['PARKING_MANAGER'],
    },
    {
        prefix: '/staff',
        roles: ['STAFF'],
    },
    {
        prefix: '/driver',
        roles: ['PARKING_USER'],
    },
];

export const getDefaultRouteByRoles = (roles: Role[]) => {
    if (roles.includes('SYSTEM_ADMIN')) {
        return ROLE_DEFAULT_ROUTES.SYSTEM_ADMIN;
    }

    if (roles.includes('PARKING_MANAGER')) {
        return ROLE_DEFAULT_ROUTES.PARKING_MANAGER;
    }

    if (roles.includes('STAFF')) {
        return ROLE_DEFAULT_ROUTES.STAFF;
    }

    if (roles.includes('PARKING_USER')) {
        return ROLE_DEFAULT_ROUTES.PARKING_USER;
    }

    return '/auth/login';
};

export const getRequiredRolesForPath = (pathname: string) => {
    const routeRule = PROTECTED_ROUTE_ROLES.find(
        (rule) =>
            pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
    );

    return routeRule?.roles ?? [];
};

export const hasAnyRole = (userRoles: Role[], allowedRoles: Role[]) => {
    if (allowedRoles.length === 0) {
        return true;
    }

    return allowedRoles.some((role) => userRoles.includes(role));
};

export const canAccessPath = (pathname: string, userRoles: Role[]) => {
    return hasAnyRole(userRoles, getRequiredRolesForPath(pathname));
};
