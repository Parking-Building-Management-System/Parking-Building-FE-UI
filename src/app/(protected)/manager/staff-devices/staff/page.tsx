import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function StaffAccountsPage() {
    return (
        <MockModulePage {...mockModulePages['/manager/staff-devices/staff']} />
    );
}
