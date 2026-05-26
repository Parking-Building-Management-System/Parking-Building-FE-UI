import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function TrafficHeatmapPage() {
    return (
        <MockModulePage
            {...mockModulePages['/manager/analytics/traffic-heatmap']}
        />
    );
}
