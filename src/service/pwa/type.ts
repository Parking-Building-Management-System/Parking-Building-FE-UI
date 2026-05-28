export type PwaCoordinateMode = 'PERCENT';

export interface PwaActiveSessionResponse {
    sessionId?: string;
    plateNumber?: string | null;
    licensePlate?: string | null;
    cardCode?: string | null;
    parkingName?: string | null;
    floorName?: string | null;
    zoneName?: string | null;
    slotCode?: string | null;
    xCoordinate?: number | null;
    yCoordinate?: number | null;
    coordinateMode?: PwaCoordinateMode | string | null;
    mapImageUrl?: string | null;
    mapDisplayUrl?: string | null;
    mapUrlExpiresInSeconds?: number | null;
    status?: string | null;
    guideText?: string | null;
    checkInTime?: string | null;
    entryTime?: string | null;
    checkInAt?: string | null;
}
