'use client';

import { createElement } from 'react';
import type { ComponentType } from 'react';
import { Building2, CarFront, ShieldCheck, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Role } from '@/service/user/type';
import { useAuthStore } from '@/stores/use-auth-store';

interface RoleWelcomeCardProps {
    role: Role;
    title: string;
    description: string;
}

type IconComponent = ComponentType<{
    className?: string;
}>;

const ROLE_ICONS: Record<Role, IconComponent> = {
    SYSTEM_ADMIN: ShieldCheck,
    PARKING_MANAGER: Building2,
    STAFF: UserRound,
    PARKING_USER: CarFront,
};

export function RoleWelcomeCard({
    role,
    title,
    description,
}: RoleWelcomeCardProps) {
    const user = useAuthStore((state) => state.user);
    const Icon = ROLE_ICONS[role];

    return (
        <main className="bg-muted flex min-h-svh items-center justify-center p-6">
            <Card className="w-full max-w-xl shadow-sm">
                <CardHeader className="items-center text-center">
                    <div className="bg-primary/10 text-primary mb-3 flex size-14 items-center justify-center rounded-full">
                        {createElement(Icon, {
                            className: 'size-7',
                        })}
                    </div>

                    <CardTitle className="text-3xl font-bold">
                        {title}
                    </CardTitle>

                    <p className="text-muted-foreground max-w-md text-sm">
                        {description}
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-background rounded-xl border p-4">
                        <p className="text-muted-foreground text-sm">
                            Welcome back,
                        </p>

                        <h2 className="mt-1 text-xl font-semibold">
                            {user?.fullName ||
                                user?.username ||
                                'SmartPark User'}
                        </h2>

                        <div className="mt-4 grid gap-3 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Username
                                </span>
                                <span className="font-medium">
                                    {user?.username || '-'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Phone
                                </span>
                                <span className="font-medium">
                                    {user?.phone || '-'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Active role
                                </span>
                                <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold">
                                    {role}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-dashed p-4 text-center">
                        <p className="text-muted-foreground text-sm">
                            This is a temporary dashboard page. The real module
                            for this role will be implemented here later.
                        </p>
                    </div>

                    <Button className="w-full">Explore Dashboard</Button>
                </CardContent>
            </Card>
        </main>
    );
}
