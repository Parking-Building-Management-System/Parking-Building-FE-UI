import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function ManagerInvoicesPage() {
    return <MockModulePage {...mockModulePages['/manager/pricing/invoices']} />;
}
