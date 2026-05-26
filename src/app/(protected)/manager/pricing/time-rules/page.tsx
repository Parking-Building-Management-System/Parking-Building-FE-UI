import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function TimeRulesPage() {
    return (
        <MockModulePage {...mockModulePages['/manager/pricing/time-rules']} />
    );
}
