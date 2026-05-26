import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function ManagerSubscriptionsPage() {
    return (
        <MockModulePage
            {...mockModulePages['/manager/pricing/subscriptions']}
        />
    );
}
