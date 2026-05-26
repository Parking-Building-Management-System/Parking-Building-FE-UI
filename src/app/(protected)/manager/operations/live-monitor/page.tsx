import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function ManagerLiveMonitorPage() {
    return (
        <MockModulePage
            {...mockModulePages['/manager/operations/live-monitor']}
        />
    );
}
