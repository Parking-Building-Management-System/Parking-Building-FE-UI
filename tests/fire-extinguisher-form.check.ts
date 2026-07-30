import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
    getDefaultExtinguisherForm,
    initializeCreateFloor,
    initializeCreateParking,
    selectExtinguisherFloor,
    selectExtinguisherParking,
    toExtinguisherRequest,
    validateExtinguisherLocation,
} from '../src/service/manager/fire-extinguisher-form';
import type { FireExtinguisher } from '../src/service/manager/fire-safety-type';

const parkings = [{ id: 'parking-1' }, { id: 'parking-2' }];
const floors = [
    { id: 'floor-1', parkingId: 'parking-1' },
    { id: 'floor-2', parkingId: 'parking-1' },
    { id: 'floor-3', parkingId: 'parking-2' },
];
const zones = [
    { id: 'zone-1', parkingId: 'parking-1', floorId: 'floor-1' },
    { id: 'zone-2', parkingId: 'parking-1', floorId: 'floor-2' },
    { id: 'zone-3', parkingId: 'parking-2', floorId: 'floor-3' },
];

let createForm = initializeCreateParking(getDefaultExtinguisherForm(), []);
assert.equal(
    createForm.parkingId,
    '',
    'opening before parking data arrives should remain safely unselected',
);
createForm = initializeCreateParking(createForm, parkings);
assert.equal(
    createForm.parkingId,
    'parking-1',
    'create mode should put the visible default parking in form state',
);
createForm = initializeCreateFloor(createForm, floors);
assert.deepEqual(
    {
        parkingId: createForm.parkingId,
        floorId: createForm.floorId,
        zoneId: createForm.zoneId,
    },
    {
        parkingId: 'parking-1',
        floorId: 'floor-1',
        zoneId: '',
    },
    'create mode should put the first valid floor in state and default to no zone',
);

createForm = { ...createForm, zoneId: 'zone-1' };
createForm = selectExtinguisherParking(createForm, 'parking-2');
assert.deepEqual(
    {
        parkingId: createForm.parkingId,
        floorId: createForm.floorId,
        zoneId: createForm.zoneId,
    },
    { parkingId: 'parking-2', floorId: '', zoneId: '' },
    'changing parking should clear stale floor and zone state',
);
createForm = initializeCreateFloor(createForm, floors);
assert.equal(
    createForm.floorId,
    'floor-3',
    'the first floor belonging to the new parking should be selected',
);

createForm = { ...createForm, zoneId: 'zone-3' };
createForm = selectExtinguisherFloor(createForm, 'floor-3');
assert.equal(createForm.zoneId, '', 'changing floor should clear the zone');
assert.equal(
    validateExtinguisherLocation(createForm, parkings, floors, zones),
    null,
);
assert.equal(
    validateExtinguisherLocation(
        { ...createForm, floorId: 'floor-1' },
        parkings,
        floors,
        zones,
    ),
    'Select a floor that belongs to the selected parking.',
);
assert.equal(
    validateExtinguisherLocation(
        { ...createForm, zoneId: 'zone-1' },
        parkings,
        floors,
        zones,
    ),
    'Select a zone that belongs to the selected floor.',
);

const request = toExtinguisherRequest({
    ...initializeCreateFloor(
        initializeCreateParking(getDefaultExtinguisherForm(), parkings),
        floors,
    ),
    code: '  b1-001 ',
    locationDescription: '  Lobby ',
});
assert.deepEqual(
    {
        parkingId: request.parkingId,
        floorId: request.floorId,
        zoneId: request.zoneId,
        code: request.code,
        locationDescription: request.locationDescription,
    },
    {
        parkingId: 'parking-1',
        floorId: 'floor-1',
        zoneId: null,
        code: 'B1-001',
        locationDescription: 'Lobby',
    },
    'the first untouched submission should carry the visible parking/floor and an explicit null zone',
);

const existing = {
    id: 'extinguisher-1',
    parkingId: 'parking-1',
    floorId: 'floor-2',
    zoneId: 'zone-2',
    code: 'B2-001',
    type: 'CO2',
    status: 'ACTIVE',
    locationDescription: 'Basement 2',
} satisfies FireExtinguisher;
const editForm = getDefaultExtinguisherForm(existing, 'parking-2');
assert.deepEqual(
    {
        parkingId: editForm.parkingId,
        floorId: editForm.floorId,
        zoneId: editForm.zoneId,
    },
    {
        parkingId: 'parking-1',
        floorId: 'floor-2',
        zoneId: 'zone-2',
    },
    'edit mode defaults must preserve the existing location',
);
assert.notStrictEqual(
    getDefaultExtinguisherForm(),
    createForm,
    'reopening create mode should receive fresh form state',
);

const componentSource = readFileSync(
    new URL('../src/features/manager/fire-safety.tsx', import.meta.url),
    'utf8',
);
assert.doesNotMatch(
    componentSource,
    /value=\{form\.floorId \|\| floors\[0\]\?\.id/,
    'the Select must not display a floor that is absent from form state',
);
assert.match(componentSource, /initializeCreateParking\(current, parkings\)/);
assert.match(componentSource, /initializeCreateFloor\(current, floors\)/);
assert.match(componentSource, /if \(!dialog\.open \|\| isEdit\)/);
assert.match(componentSource, /floorsQuery\.isLoading/);
assert.match(componentSource, /zonesQuery\.isLoading/);
assert.match(componentSource, /Location options could not be loaded/);

console.log('Fire extinguisher form checks passed');
