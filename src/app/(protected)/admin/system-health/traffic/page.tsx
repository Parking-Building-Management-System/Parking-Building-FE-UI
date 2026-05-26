import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function TrafficUsagePage() {
    return (
        <MockModulePage {...mockModulePages['/admin/system-health/traffic']} />
    );
}
