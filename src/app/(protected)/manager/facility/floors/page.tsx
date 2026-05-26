import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function FacilityFloorsPage() {
    return <MockModulePage {...mockModulePages['/manager/facility/floors']} />;
}
