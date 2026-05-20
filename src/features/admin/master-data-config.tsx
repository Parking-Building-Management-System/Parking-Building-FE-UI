'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    adminQueryKeys,
    createVehicleType,
    deleteVehicleType,
    getRoles,
    getVehicleTypes,
    updateVehicleType,
} from '@/service/admin/api';
import type { VehicleTypeItem } from '@/service/admin/type';
import { getErrorMessage } from './error-message';

const vehicleTypeSchema = z.object({
    name: z
        .string()
        .min(1, 'Vehicle type name is required.')
        .max(100, 'Vehicle type name must be 100 characters or fewer.'),
    code: z
        .string()
        .min(1, 'Vehicle type code is required.')
        .max(50, 'Vehicle type code must be 50 characters or fewer.'),
    active: z.boolean(),
});

type VehicleTypeFormValues = z.infer<typeof vehicleTypeSchema>;

interface VehicleDialogState {
    open: boolean;
    vehicle?: VehicleTypeItem;
}

export function MasterDataConfig() {
    const queryClient = useQueryClient();
    const [vehicleDialog, setVehicleDialog] = useState<VehicleDialogState>({
        open: false,
    });

    const vehicleTypesQuery = useQuery({
        queryKey: adminQueryKeys.vehicleTypes,
        queryFn: getVehicleTypes,
    });

    const rolesQuery = useQuery({
        queryKey: adminQueryKeys.roles,
        queryFn: getRoles,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteVehicleType,
        onSuccess: () => {
            toast.success('Vehicle type deleted.');
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.vehicleTypes,
            });
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to delete vehicle type.'),
            );
        },
    });

    useEffect(() => {
        if (vehicleTypesQuery.isError) {
            toast.error(
                getErrorMessage(
                    vehicleTypesQuery.error,
                    'Failed to load vehicle types.',
                ),
            );
        }
    }, [vehicleTypesQuery.error, vehicleTypesQuery.isError]);

    useEffect(() => {
        if (rolesQuery.isError) {
            toast.error(
                getErrorMessage(rolesQuery.error, 'Failed to load roles.'),
            );
        }
    }, [rolesQuery.error, rolesQuery.isError]);

    const openCreateDialog = () => {
        setVehicleDialog({ open: true });
    };

    const openEditDialog = (vehicle: VehicleTypeItem) => {
        setVehicleDialog({ open: true, vehicle });
    };

    const closeVehicleDialog = () => {
        setVehicleDialog({ open: false });
    };

    const vehicleTypes = vehicleTypesQuery.data ?? [];
    const roles = rolesQuery.data ?? [];

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">
                    SYSTEM_ADMIN
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                    Master Data Config
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                    Configure global vehicle types and role definitions used
                    across tenant workspaces.
                </p>
            </div>

            <Tabs defaultValue="vehicle-types">
                <TabsList>
                    <TabsTrigger value="vehicle-types">
                        Vehicle Types
                    </TabsTrigger>
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                </TabsList>

                <TabsContent value="vehicle-types">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <CardTitle>Vehicle Types</CardTitle>
                            <Button size="sm" onClick={openCreateDialog}>
                                <Plus data-icon="inline-start" />
                                Add
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicleTypesQuery.isLoading && (
                                        <VehicleTypeTableSkeleton />
                                    )}

                                    {!vehicleTypesQuery.isLoading &&
                                        vehicleTypes.map((type) => (
                                            <TableRow key={type.id}>
                                                <TableCell className="font-medium">
                                                    {type.name}
                                                </TableCell>
                                                <TableCell>
                                                    {type.code}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="bg-muted inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                                                        {type.active
                                                            ? 'ACTIVE'
                                                            : 'INACTIVE'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    type,
                                                                )
                                                            }
                                                        >
                                                            <Pencil data-icon="inline-start" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={
                                                                deleteMutation.isPending &&
                                                                deleteMutation.variables ===
                                                                    type.id
                                                            }
                                                            onClick={() =>
                                                                deleteMutation.mutate(
                                                                    type.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 data-icon="inline-start" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                    {!vehicleTypesQuery.isLoading &&
                                        vehicleTypes.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-muted-foreground h-24 text-center"
                                                >
                                                    No vehicle types found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Roles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rolesQuery.isLoading && (
                                        <RoleTableSkeleton />
                                    )}

                                    {!rolesQuery.isLoading &&
                                        roles.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium">
                                                    {role.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-lg whitespace-normal">
                                                    {role.desc}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                    {!rolesQuery.isLoading &&
                                        roles.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={2}
                                                    className="text-muted-foreground h-24 text-center"
                                                >
                                                    No roles found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <VehicleTypeDialog
                key={vehicleDialog.vehicle?.id ?? 'create'}
                open={vehicleDialog.open}
                vehicle={vehicleDialog.vehicle}
                onOpenChange={(open) => {
                    if (!open) {
                        closeVehicleDialog();
                        return;
                    }

                    setVehicleDialog((current) => ({ ...current, open }));
                }}
            />
        </div>
    );
}

function VehicleTypeTableSkeleton() {
    return (
        <>
            {Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell>
                        <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="flex justify-end">
                        <Skeleton className="h-8 w-32" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

function RoleTableSkeleton() {
    return (
        <>
            {Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell>
                        <Skeleton className="h-5 w-36" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-full" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

function VehicleTypeDialog({
    open,
    vehicle,
    onOpenChange,
}: {
    open: boolean;
    vehicle?: VehicleTypeItem;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const form = useForm<VehicleTypeFormValues>({
        resolver: zodResolver(vehicleTypeSchema),
        defaultValues: {
            name: vehicle?.name ?? '',
            code: vehicle?.code ?? '',
            active: vehicle?.active ?? true,
        },
    });

    const createMutation = useMutation({
        mutationFn: createVehicleType,
        onSuccess: () => {
            toast.success('Vehicle type created.');
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.vehicleTypes,
            });
            form.reset();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to create vehicle type.'),
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: VehicleTypeFormValues;
        }) => updateVehicleType(id, data),
        onSuccess: () => {
            toast.success('Vehicle type updated.');
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.vehicleTypes,
            });
            form.reset();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to update vehicle type.'),
            );
        },
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    const onSubmit = (values: VehicleTypeFormValues) => {
        if (vehicle) {
            updateMutation.mutate({ id: vehicle.id, data: values });
            return;
        }

        createMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {vehicle ? 'Edit vehicle type' : 'Add vehicle type'}
                    </DialogTitle>
                    <DialogDescription>
                        Maintain the global vehicle type catalog for SmartPark.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Motorcycle"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="MOTORCYCLE"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <FormLabel>Active</FormLabel>
                                        <p className="text-muted-foreground text-sm">
                                            Enable this vehicle type for tenant
                                            workspaces.
                                        </p>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            disabled={isPending}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full sm:w-auto"
                            >
                                {isPending
                                    ? 'Saving...'
                                    : vehicle
                                      ? 'Save Changes'
                                      : 'Create Vehicle Type'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
