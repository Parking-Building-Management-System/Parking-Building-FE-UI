import { ParkingTopology } from '@/features/manager/parking-topology';

export default async function ParkingTopologyPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return <ParkingTopology parkingId={id} />;
}
