import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function StaffLiveMonitorPage() {
    return <MockModulePage {...mockModulePages['/staff/live-monitor']} />;
}
