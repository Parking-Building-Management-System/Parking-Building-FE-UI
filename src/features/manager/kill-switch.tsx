'use client';

import Link from 'next/link';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export function KillSwitch() {
    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">
                    PARKING_MANAGER
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                    Kill Switch
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                    Emergency controls for staff device/session access.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="size-5" />
                        API list source pending
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                        The backend revoke endpoint exists, but this UI does not
                        yet have a complete manager-scoped source of approved
                        devices or active staff sessions to list safely.
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                        <InfoBlock
                            title="Purpose"
                            text="Revoke device or session access when a staff member leaves shift or a device is compromised."
                        />
                        <InfoBlock
                            title="Available backend action"
                            text="POST /manager/devices/{id}/revoke can suspend a known device id."
                        />
                        <InfoBlock
                            title="Current safe path"
                            text="Use Device Approvals for requests that expose device ids, or suspend a staff account from Staff Accounts."
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link href="/manager/staff-devices/device-approvals">
                                <ShieldCheck data-icon="inline-start" />
                                Open Device Approvals
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/manager/staff-devices/staff">
                                Manage Staff Status
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="font-medium">{title}</p>
            <p className="text-muted-foreground mt-1 text-xs">{text}</p>
        </div>
    );
}
