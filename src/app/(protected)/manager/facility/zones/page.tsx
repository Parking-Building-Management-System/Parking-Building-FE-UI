import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function FacilityZonesPage() {
    return <MockModulePage {...mockModulePages['/manager/facility/zones']} />;
}
