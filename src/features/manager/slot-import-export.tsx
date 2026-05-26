'use client';

import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/features/admin/error-message';
import {
    exportSlotsApi,
    importSlotsApi,
    managerFacilityQueryKeys,
} from '@/service/manager/facility-api';
import { FacilityHeader } from './floor-management';

export function SlotImportExport() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const importMutation = useMutation({
        mutationFn: importSlotsApi,
        onSuccess: (result) => {
            toast.success(
                `${result.insertedCount.toLocaleString()} slots imported.`,
            );
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.slots,
            });
            queryClient.invalidateQueries({
                queryKey: managerFacilityQueryKeys.parkings,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to import slots.'));
        },
    });

    const exportMutation = useMutation({
        mutationFn: exportSlotsApi,
        onSuccess: (file) => {
            downloadExportFile(file.blob, file.filename);
            toast.success('Slots exported.');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to export slots.'));
        },
    });

    return (
        <div className="space-y-6 p-6">
            <FacilityHeader
                title="Slot Import / Export"
                description="Import and export Excel workbooks through the tenant-scoped manager slot API."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Excel Import</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Backend expects multipart form field `file`. Required
                        headers: parkingCode, floorCode, zoneCode, slotCode.
                        Optional headers: slotNumber, status.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = '';

                            if (file) {
                                importMutation.mutate(file);
                            }
                        }}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importMutation.isPending}
                    >
                        <Upload data-icon="inline-start" />
                        {importMutation.isPending
                            ? 'Importing...'
                            : 'Choose Excel File'}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Excel Export</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Export is tenant-scoped by the backend. No tenant id is
                        sent from the frontend.
                    </p>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        onClick={() => exportMutation.mutate()}
                        disabled={exportMutation.isPending}
                    >
                        <Download data-icon="inline-start" />
                        {exportMutation.isPending
                            ? 'Exporting...'
                            : 'Export Slots'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function downloadExportFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
