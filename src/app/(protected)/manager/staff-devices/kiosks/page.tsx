import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function KiosksGatesPage() {
    return (
        <MockModulePage {...mockModulePages['/manager/staff-devices/kiosks']} />
    );
}
