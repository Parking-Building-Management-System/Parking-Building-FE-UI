import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function OccupancyAnalyticsPage() {
    return (
        <MockModulePage {...mockModulePages['/manager/analytics/occupancy']} />
    );
}
