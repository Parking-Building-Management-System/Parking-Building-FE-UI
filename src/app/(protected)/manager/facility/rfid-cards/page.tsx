import { MockModulePage } from '@/components/mock-module-page';
import { mockModulePages } from '@/config/mock-pages';

export default function RfidCardsPage() {
    return (
        <MockModulePage {...mockModulePages['/manager/facility/rfid-cards']} />
    );
}
