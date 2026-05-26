import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function IncidentsViolationsPage() {
    return <MockModulePage {...mockModulePages['/manager/incidents']} />;
}
