import type {
    FloorResponse,
    ParkingResponse,
    ZoneResponse,
} from '@/service/manager/facility-type';
import type {
    CreateFireExtinguisherRequest,
    FireExtinguisher,
    FireExtinguisherFormValues,
} from '@/service/manager/fire-safety-type';

export function getDefaultExtinguisherForm(
    extinguisher?: FireExtinguisher,
    fallbackParkingId = '',
): FireExtinguisherFormValues {
    return {
        parkingId: extinguisher?.parkingId ?? fallbackParkingId,
        floorId: extinguisher?.floorId ?? '',
        zoneId: extinguisher?.zoneId ?? '',
        code: extinguisher?.code ?? '',
        type: extinguisher?.type ?? 'CO2',
        locationDescription: extinguisher?.locationDescription ?? '',
        xCoordinate:
            typeof extinguisher?.xCoordinate === 'number'
                ? extinguisher.xCoordinate
                : '',
        yCoordinate:
            typeof extinguisher?.yCoordinate === 'number'
                ? extinguisher.yCoordinate
                : '',
        manufactureDate: extinguisher?.manufactureDate ?? '',
        expiryDate: extinguisher?.expiryDate ?? '',
        nextInspectionAt: extinguisher?.nextInspectionAt ?? '',
        status: extinguisher?.status ?? 'ACTIVE',
        note: extinguisher?.note ?? '',
    };
}

export function initializeCreateParking(
    values: FireExtinguisherFormValues,
    parkings: Pick<ParkingResponse, 'id'>[],
): FireExtinguisherFormValues {
    const parkingId = parkings.some(
        (parking) => parking.id === values.parkingId,
    )
        ? values.parkingId
        : (parkings[0]?.id ?? '');

    if (parkingId === values.parkingId) {
        return values;
    }

    return {
        ...values,
        parkingId,
        floorId: '',
        zoneId: '',
    };
}

export function initializeCreateFloor(
    values: FireExtinguisherFormValues,
    floors: Pick<FloorResponse, 'id' | 'parkingId'>[],
): FireExtinguisherFormValues {
    const validFloors = floors.filter(
        (floor) => floor.parkingId === values.parkingId,
    );
    const floorId = validFloors.some((floor) => floor.id === values.floorId)
        ? values.floorId
        : (validFloors[0]?.id ?? '');

    if (floorId === values.floorId) {
        return values;
    }

    return {
        ...values,
        floorId,
        zoneId: '',
    };
}

export function selectExtinguisherParking(
    values: FireExtinguisherFormValues,
    parkingId: string,
): FireExtinguisherFormValues {
    return {
        ...values,
        parkingId,
        floorId: '',
        zoneId: '',
    };
}

export function selectExtinguisherFloor(
    values: FireExtinguisherFormValues,
    floorId: string,
): FireExtinguisherFormValues {
    return {
        ...values,
        floorId,
        zoneId: '',
    };
}

export function validateExtinguisherLocation(
    values: Pick<
        FireExtinguisherFormValues,
        'parkingId' | 'floorId' | 'zoneId'
    >,
    parkings: Pick<ParkingResponse, 'id'>[],
    floors: Pick<FloorResponse, 'id' | 'parkingId'>[],
    zones: Pick<ZoneResponse, 'id' | 'parkingId' | 'floorId'>[],
): string | null {
    if (!parkings.some((parking) => parking.id === values.parkingId)) {
        return 'Select a valid parking.';
    }

    if (
        !floors.some(
            (floor) =>
                floor.id === values.floorId &&
                floor.parkingId === values.parkingId,
        )
    ) {
        return 'Select a floor that belongs to the selected parking.';
    }

    if (
        values.zoneId &&
        !zones.some(
            (zone) =>
                zone.id === values.zoneId &&
                zone.parkingId === values.parkingId &&
                zone.floorId === values.floorId,
        )
    ) {
        return 'Select a zone that belongs to the selected floor.';
    }

    return null;
}

export function toExtinguisherRequest(
    values: FireExtinguisherFormValues,
): CreateFireExtinguisherRequest {
    return {
        parkingId: values.parkingId,
        floorId: values.floorId,
        zoneId: values.zoneId || null,
        code: values.code.trim().toUpperCase(),
        type: values.type,
        locationDescription: values.locationDescription.trim(),
        xCoordinate:
            typeof values.xCoordinate === 'number'
                ? values.xCoordinate
                : undefined,
        yCoordinate:
            typeof values.yCoordinate === 'number'
                ? values.yCoordinate
                : undefined,
        manufactureDate: values.manufactureDate || undefined,
        expiryDate: values.expiryDate || undefined,
        nextInspectionAt: values.nextInspectionAt || undefined,
        status: values.status,
        note: values.note?.trim() || undefined,
    };
}
