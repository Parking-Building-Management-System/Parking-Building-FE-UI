import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function OperationsPage() {
    return <MockModulePage {...mockModulePages['/manager/operations']} />;
}
