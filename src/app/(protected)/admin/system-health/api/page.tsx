import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function ApiHealthPage() {
    return <MockModulePage {...mockModulePages['/admin/system-health/api']} />;
}
