import { RoleWelcomeCard } from '@/components/role-welcome-card';

export default function ParkingUserPage() {
    return (
        <RoleWelcomeCard
            role="PARKING_USER"
            title="Parking User Dashboard"
            description="View your parking activities, bookings, vehicles, payments, and account information."
        />
    );
}
