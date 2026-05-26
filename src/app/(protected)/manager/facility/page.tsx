import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function FacilitySetupPage() {
    return <MockModulePage {...mockModulePages['/manager/facility']} />;
}
