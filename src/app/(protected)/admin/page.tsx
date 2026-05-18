import { RoleWelcomeCard } from '@/components/role-welcome-card';

export default function AdminPage() {
    return (
        <RoleWelcomeCard
            role="SYSTEM_ADMIN"
            title="System Admin Dashboard"
            description="Manage tenants, users, roles, permissions, and global SmartPark system settings."
        />
    );
}
