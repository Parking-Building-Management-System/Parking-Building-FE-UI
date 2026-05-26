import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function RevenueAnalyticsPage() {
    return (
        <MockModulePage {...mockModulePages['/manager/analytics/revenue']} />
    );
}
