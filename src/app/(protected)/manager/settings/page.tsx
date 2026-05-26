import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function ManagerSettingsPage() {
    return <MockModulePage {...mockModulePages['/manager/settings']} />;
}
