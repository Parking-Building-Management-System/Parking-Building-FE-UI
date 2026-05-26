import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function StaffDevicesPage() {
    return <MockModulePage {...mockModulePages['/manager/staff-devices']} />;
}
