import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function AnalyticsPage() {
    return <MockModulePage {...mockModulePages['/manager/analytics']} />;
}
