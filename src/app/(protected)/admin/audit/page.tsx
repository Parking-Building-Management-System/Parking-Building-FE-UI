import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function AuditSecurityPage() {
    return <MockModulePage {...mockModulePages['/admin/audit']} />;
}
