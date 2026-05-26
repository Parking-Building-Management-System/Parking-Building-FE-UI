import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function SlotImportExportPage() {
    return (
        <MockModulePage
            {...mockModulePages['/manager/facility/slots/import']}
        />
    );
}
