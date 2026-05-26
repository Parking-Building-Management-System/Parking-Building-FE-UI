import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function RedFlagActionsPage() {
    return (
        <MockModulePage {...mockModulePages['/manager/incidents/red-flags']} />
    );
}
