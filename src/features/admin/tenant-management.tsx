'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    adminQueryKeys,
    getTenants,
    provisionTenant,
    toggleTenantStatus,
} from '@/service/admin/api';
import { getErrorMessage } from './error-message';

const TENANT_PAGE = 0;
const TENANT_PAGE_SIZE = 10;

const provisionTenantSchema = z.object({
    companyName: z
        .string()
        .min(1, 'Company name is required.')
        .max(255, 'Company name must be 255 characters or fewer.'),
    managerEmail: z
        .string()
        .min(1, 'Manager email is required.')
        .email('Manager email must be valid.')
        .max(255, 'Manager email must be 255 characters or fewer.'),
    initialPassword: z
        .string()
        .min(8, 'Initial password must be at least 8 characters.')
        .max(72, 'Initial password must be 72 characters or fewer.'),
});

type ProvisionTenantFormValues = z.infer<typeof provisionTenantSchema>;

export function TenantManagement() {
    const queryClient = useQueryClient();
    const { data, error, isError, isLoading } = useQuery({
        queryKey: adminQueryKeys.tenantList(TENANT_PAGE, TENANT_PAGE_SIZE),
        queryFn: () => getTenants(TENANT_PAGE, TENANT_PAGE_SIZE),
        placeholderData: keepPreviousData,
    });

    const toggleMutation = useMutation({
        mutationFn: toggleTenantStatus,
        onSuccess: () => {
            toast.success('Tenant status updated.');
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.tenants });
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update tenant status.'),
            );
        },
    });

    useEffect(() => {
        if (isError) {
            toast.error(getErrorMessage(error, 'Failed to load tenants.'));
        }
    }, [error, isError]);

    const tenants = data?.content ?? [];

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">
                        SYSTEM_ADMIN
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                        Tenant Management
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        Manage SaaS tenants, onboarding state, and manager
                        access.
                    </p>
                </div>

                <CreateTenantDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tenants</CardTitle>
                    {data && (
                        <p className="text-muted-foreground text-sm">
                            Showing {tenants.length} of {data.totalElements}{' '}
                            tenants
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Join Date</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Manager Email</TableHead>
                                <TableHead className="text-right">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TenantTableSkeleton />}

                            {!isLoading &&
                                tenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell className="font-medium">
                                            {tenant.name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="bg-muted inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                                                {tenant.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {tenant.createdAt}
                                        </TableCell>
                                        <TableCell>{tenant.slug}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {tenant.emailContact}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="text-muted-foreground text-xs">
                                                    {tenant.status === 'ACTIVE'
                                                        ? 'Active'
                                                        : 'Suspended'}
                                                </span>
                                                <Switch
                                                    checked={
                                                        tenant.status ===
                                                        'ACTIVE'
                                                    }
                                                    disabled={
                                                        toggleMutation.isPending &&
                                                        toggleMutation.variables ===
                                                            tenant.id
                                                    }
                                                    onCheckedChange={() =>
                                                        toggleMutation.mutate(
                                                            tenant.id,
                                                        )
                                                    }
                                                    aria-label={`Toggle ${tenant.name} status`}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {!isLoading && tenants.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-muted-foreground h-24 text-center"
                                    >
                                        No tenants found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function CreateTenantDialog() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const form = useForm<ProvisionTenantFormValues>({
        resolver: zodResolver(provisionTenantSchema),
        defaultValues: {
            companyName: '',
            managerEmail: '',
            initialPassword: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: provisionTenant,
        onSuccess: () => {
            toast.success('Tenant created successfully.');
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.tenants });
            form.reset();
            setOpen(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to create tenant.'));
        },
    });

    const onSubmit = (values: ProvisionTenantFormValues) => {
        createMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus data-icon="inline-start" />
                    Create Tenant
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create tenant</DialogTitle>
                    <DialogDescription>
                        Provision a tenant and initial manager workspace.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Metro Parking Group"
                                            disabled={createMutation.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="managerEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manager Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="manager@tenant.local"
                                            disabled={createMutation.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="initialPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Initial Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Temporary password"
                                            disabled={createMutation.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full sm:w-auto"
                            >
                                {createMutation.isPending
                                    ? 'Creating...'
                                    : 'Create Workspace'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function TenantTableSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell>
                        <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-36" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell className="flex justify-end">
                        <Skeleton className="h-5 w-16" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}
