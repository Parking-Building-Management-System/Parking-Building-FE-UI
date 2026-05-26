import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function IncidentLogPage() {
    return <MockModulePage {...mockModulePages['/manager/incidents/logs']} />;
}
