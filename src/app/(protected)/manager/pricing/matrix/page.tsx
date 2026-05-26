import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function PricingMatrixPage() {
    return <MockModulePage {...mockModulePages['/manager/pricing/matrix']} />;
}
