import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function ZoneViolationsPage() {
    return (
        <MockModulePage
            {...mockModulePages['/manager/incidents/zone-violations']}
        />
    );
}
