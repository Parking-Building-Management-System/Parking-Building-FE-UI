import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function StaffExceptionsPage() {
    return <MockModulePage {...mockModulePages['/staff/exceptions']} />;
}
