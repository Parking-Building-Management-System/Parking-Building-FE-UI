'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    getVehicleTypes,
    updateVehicleType,
} from '@/service/admin/api';
import {
    getPermissionTreeApi,
    getRolePermissionsApi,
    getSystemAdminRolesApi,
    replaceRolePermissionsApi,
    systemAdminQueryKeys,
} from '@/service/admin/system-admin-api';
import type {
    PermissionScopeNode,
    SystemAdminRoleItem,
} from '@/service/admin/system-admin-type';
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

type MasterDataTab = 'vehicle-types' | 'roles-permissions';

export function MasterDataConfig({
    initialTab = 'vehicle-types',
}: {
    initialTab?: MasterDataTab;
}) {
    const queryClient = useQueryClient();
    const [vehicleDialog, setVehicleDialog] = useState<VehicleDialogState>({
        open: false,
    });
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<
        string[] | null
    >(null);

    const vehicleTypesQuery = useQuery({
        queryKey: adminQueryKeys.vehicleTypes,
        queryFn: getVehicleTypes,
    });

    const rolesQuery = useQuery({
        queryKey: systemAdminQueryKeys.roles,
        queryFn: getSystemAdminRolesApi,
    });

    const permissionTreeQuery = useQuery({
        queryKey: systemAdminQueryKeys.permissionTree,
        queryFn: getPermissionTreeApi,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteVehicleType,
        onMutate: async (id) => {
            await queryClient.cancelQueries({
                queryKey: adminQueryKeys.vehicleTypes,
            });

            const previousVehicleTypes =
                queryClient.getQueryData<VehicleTypeItem[]>(
                    adminQueryKeys.vehicleTypes,
                );

            queryClient.setQueryData<VehicleTypeItem[]>(
                adminQueryKeys.vehicleTypes,
                (current) => current?.filter((type) => type.id !== id) ?? [],
            );

            return { previousVehicleTypes };
        },
        onSuccess: async () => {
            toast.success('Vehicle type deleted.');
            await queryClient.invalidateQueries({
                queryKey: adminQueryKeys.vehicleTypes,
            });
        },
        onError: (error, _id, context) => {
            if (context?.previousVehicleTypes) {
                queryClient.setQueryData(
                    adminQueryKeys.vehicleTypes,
                    context.previousVehicleTypes,
                );
            }

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

    useEffect(() => {
        if (permissionTreeQuery.isError) {
            toast.error(
                getErrorMessage(
                    permissionTreeQuery.error,
                    'Failed to load permission tree.',
                ),
            );
        }
    }, [permissionTreeQuery.error, permissionTreeQuery.isError]);

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
    const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
    const effectiveRoleId = selectedRoleId || roles[0]?.id || '';
    const rolePermissionsQuery = useQuery({
        queryKey: systemAdminQueryKeys.rolePermissions(effectiveRoleId),
        queryFn: () => getRolePermissionsApi(effectiveRoleId),
        enabled: effectiveRoleId.length > 0,
    });
    const backendSelectedPermissionIds = useMemo(
        () =>
            rolePermissionsQuery.data
                ? getSelectedPermissionIds(rolePermissionsQuery.data)
                : [],
        [rolePermissionsQuery.data],
    );
    const effectiveSelectedPermissionIds =
        selectedPermissionIds ?? backendSelectedPermissionIds;
    const saveRolePermissionsMutation = useMutation({
        mutationFn: () =>
            replaceRolePermissionsApi(effectiveRoleId, {
                permissionIds: effectiveSelectedPermissionIds,
            }),
        onSuccess: async () => {
            toast.success('Role permissions saved.');
            setSelectedPermissionIds(null);
            await queryClient.invalidateQueries({
                queryKey:
                    systemAdminQueryKeys.rolePermissions(effectiveRoleId),
            });
        },
        onError: (error) => {
            toast.error(
                getErrorMessage(error, 'Failed to save role permissions.'),
            );
        },
    });
    const selectedRole = useMemo(
        () => roles.find((role) => role.id === effectiveRoleId),
        [roles, effectiveRoleId],
    );
    const visiblePermissionTree =
        rolePermissionsQuery.data ?? permissionTreeQuery.data ?? [];

    useEffect(() => {
        if (rolePermissionsQuery.isError) {
            toast.error(
                getErrorMessage(
                    rolePermissionsQuery.error,
                    'Failed to load role permissions.',
                ),
            );
        }
    }, [rolePermissionsQuery.error, rolePermissionsQuery.isError]);

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
                    Configure global vehicle types, roles, and permission
                    definitions used across tenant workspaces.
                </p>
            </div>

            <Tabs defaultValue={initialTab}>
                <TabsList>
                    <TabsTrigger value="vehicle-types">
                        Vehicle Types
                    </TabsTrigger>
                    <TabsTrigger value="roles-permissions">
                        Roles & Permissions
                    </TabsTrigger>
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
                                            Actions
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

                <TabsContent value="roles-permissions">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="text-muted-foreground size-4" />
                                    <CardTitle>Roles</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <RoleList
                                    isLoading={rolesQuery.isLoading}
                                    roles={roles}
                                    selectedRoleId={effectiveRoleId}
                                    onSelectRole={(roleId) => {
                                        setSelectedRoleId(roleId);
                                        setSelectedPermissionIds(null);
                                    }}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle>Permission Tree</CardTitle>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {selectedRole
                                            ? `Assignments for ${selectedRole.name}`
                                            : 'Select a role to edit assignments.'}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={
                                        !effectiveRoleId ||
                                        rolePermissionsQuery.isLoading ||
                                        saveRolePermissionsMutation.isPending
                                    }
                                    onClick={() =>
                                        saveRolePermissionsMutation.mutate()
                                    }
                                >
                                    {saveRolePermissionsMutation.isPending
                                        ? 'Saving...'
                                        : 'Save Permissions'}
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <PermissionTree
                                    disabled={
                                        !selectedRoleId ||
                                        rolePermissionsQuery.isLoading ||
                                        saveRolePermissionsMutation.isPending
                                    }
                                    isLoading={
                                        permissionTreeQuery.isLoading ||
                                        rolePermissionsQuery.isLoading
                                    }
                                    selectedPermissionIds={
                                        effectiveSelectedPermissionIds
                                    }
                                    tree={visiblePermissionTree}
                                    onTogglePermission={(permissionId) => {
                                        setSelectedPermissionIds((current) =>
                                            (current ??
                                                effectiveSelectedPermissionIds
                                            ).includes(permissionId)
                                                ? (current ??
                                                      effectiveSelectedPermissionIds
                                                  ).filter(
                                                      (id) =>
                                                          id !== permissionId,
                                                  )
                                                : [
                                                      ...(current ??
                                                          effectiveSelectedPermissionIds),
                                                      permissionId,
                                                  ],
                                        );
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>
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

function RoleList({
    isLoading,
    onSelectRole,
    roles,
    selectedRoleId,
}: {
    isLoading: boolean;
    onSelectRole: (roleId: string) => void;
    roles: SystemAdminRoleItem[];
    selectedRoleId: string;
}) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full" />
                ))}
            </div>
        );
    }

    if (roles.length === 0) {
        return (
            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                No roles found.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {roles.map((role) => (
                <button
                    key={role.id}
                    type="button"
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedRoleId === role.id
                            ? 'border-primary bg-primary/10'
                            : 'hover:bg-muted/60'
                    }`}
                    onClick={() => onSelectRole(role.id)}
                >
                    <p className="font-medium">{role.name}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {role.description || role.desc || 'No description.'}
                    </p>
                </button>
            ))}
        </div>
    );
}

function PermissionTree({
    disabled,
    isLoading,
    onTogglePermission,
    selectedPermissionIds,
    tree,
}: {
    disabled: boolean;
    isLoading: boolean;
    onTogglePermission: (permissionId: string) => void;
    selectedPermissionIds: string[];
    tree: PermissionScopeNode[];
}) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    if (tree.length === 0) {
        return (
            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                No permissions found.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {tree.map((scopeNode) => (
                <div key={scopeNode.scope} className="rounded-lg border">
                    <div className="border-b bg-muted/40 px-3 py-2 text-sm font-semibold">
                        {scopeNode.scope}
                    </div>
                    <div className="space-y-4 p-3">
                        {scopeNode.modules.map((moduleNode) => (
                            <div key={`${scopeNode.scope}-${moduleNode.module}`}>
                                <p className="text-sm font-medium">
                                    {moduleNode.module}
                                </p>
                                <div className="mt-2 space-y-3">
                                    {moduleNode.resources.map((resourceNode) => (
                                        <div
                                            key={`${moduleNode.module}-${resourceNode.resource}`}
                                            className="rounded-md border p-3"
                                        >
                                            <p className="text-muted-foreground text-xs font-medium">
                                                {resourceNode.resource}
                                            </p>
                                            <div className="mt-3 space-y-3">
                                                {resourceNode.labels.map(
                                                    (labelNode) => (
                                                        <div
                                                            key={`${resourceNode.resource}-${labelNode.label}`}
                                                            className="space-y-2"
                                                        >
                                                            <p className="text-sm font-medium">
                                                                {
                                                                    labelNode.label
                                                                }
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {labelNode.actions.map(
                                                                    (
                                                                        action,
                                                                    ) => (
                                                                        <label
                                                                            key={
                                                                                action.id
                                                                            }
                                                                            className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                                                                        >
                                                                            <Checkbox
                                                                                checked={selectedPermissionIds.includes(
                                                                                    action.id,
                                                                                )}
                                                                                disabled={
                                                                                    disabled
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    onTogglePermission(
                                                                                        action.id,
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span>
                                                                                {
                                                                                    action.action
                                                                                }
                                                                            </span>
                                                                        </label>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function getSelectedPermissionIds(tree: PermissionScopeNode[]) {
    return tree.flatMap((scopeNode) =>
        scopeNode.modules.flatMap((moduleNode) =>
            moduleNode.resources.flatMap((resourceNode) =>
                resourceNode.labels.flatMap((labelNode) =>
                    labelNode.actions
                        .filter((action) => action.selected)
                        .map((action) => action.id),
                ),
            ),
        ),
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
