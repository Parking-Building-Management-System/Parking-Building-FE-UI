import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function AdminAuditLogsPage() {
    return <MockModulePage {...mockModulePages['/admin/audit/logs']} />;
}
