import { RoleWelcomeCard } from '@/components/role-welcome-card';

export default function ManagerPage() {
    return (
        <RoleWelcomeCard
            role="PARKING_MANAGER"
            title="Parking Manager Dashboard"
            description="Monitor parking operations, manage buildings, parking slots, staff, and reports."
        />
    );
}
