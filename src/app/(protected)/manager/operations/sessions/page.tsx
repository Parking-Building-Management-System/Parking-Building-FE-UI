import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function ActiveSessionsPage() {
    return (
        <MockModulePage {...mockModulePages['/manager/operations/sessions']} />
    );
}
