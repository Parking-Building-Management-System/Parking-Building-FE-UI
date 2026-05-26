import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function KillSwitchPage() {
    return (
        <MockModulePage
            {...mockModulePages['/manager/staff-devices/kill-switch']}
        />
    );
}
