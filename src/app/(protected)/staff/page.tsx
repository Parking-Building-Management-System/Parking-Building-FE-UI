import { RoleWelcomeCard } from '@/components/role-welcome-card';

export default function StaffPage() {
    return (
        <RoleWelcomeCard
            role="STAFF"
            title="Staff Dashboard"
            description="Handle daily parking tasks, support users, verify tickets, and manage on-site operations."
        />
    );
}
