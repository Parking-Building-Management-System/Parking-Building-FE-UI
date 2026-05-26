import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function ForceLogoutSessionsPage() {
    return <MockModulePage {...mockModulePages['/admin/audit/sessions']} />;
}
