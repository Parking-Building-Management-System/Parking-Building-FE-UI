import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function DeviceApprovalsPage() {
    return (
        <MockModulePage
            {...mockModulePages['/manager/staff-devices/device-approvals']}
        />
    );
}
