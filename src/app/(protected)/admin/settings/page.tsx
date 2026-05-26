import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function AdminSettingsPage() {
    return <MockModulePage {...mockModulePages['/admin/settings']} />;
}
