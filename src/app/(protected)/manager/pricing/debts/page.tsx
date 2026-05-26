import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function DebtRemindersPage() {
    return <MockModulePage {...mockModulePages['/manager/pricing/debts']} />;
}
