import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { normalizeRfidCardListParams } from '../src/service/manager/facility-api';

assert.deepEqual(
    normalizeRfidCardListParams({
        search: '   ',
        page: 0,
        size: 25,
    }),
    { page: 0, size: 25 },
    'blank search and status parameters should be omitted',
);
assert.deepEqual(
    normalizeRfidCardListParams({
        search: '  vdaa  ',
        status: 'ACTIVE',
        page: 2,
        size: 50,
    }),
    {
        search: 'vdaa',
        status: 'ACTIVE',
        page: 2,
        size: 50,
    },
    'search should be trimmed while filters and pagination are preserved',
);

const source = readFileSync(
    new URL(
        '../src/features/manager/rfid-card-management.tsx',
        import.meta.url,
    ),
    'utf8',
);

assert.match(source, /const RFID_SEARCH_DEBOUNCE_MS = 350/);
assert.match(source, /window\.setTimeout\(/, 'search should be debounced');
assert.match(source, /placeholder="Search by card code"/);
assert.match(source, /const PAGE_SIZE_OPTIONS = \[25, 50, 100\]/);
assert.ok(
    (source.match(/setPage\(0\)/g) ?? []).length >= 3,
    'search, status, and page-size changes should reset pagination',
);
assert.doesNotMatch(
    source,
    /<TableHead>Created<\/TableHead>/,
    'the API does not return createdAt, so Created must not be rendered',
);
assert.match(source, /No cards match these filters\./);
assert.match(source, /No RFID cards exist yet\./);
assert.match(source, /RFID cards could not be loaded/);
assert.match(source, /<DialogTitle>Generate RFID cards<\/DialogTitle>/);
assert.match(
    source,
    /queryKey: managerFacilityQueryKeys\.rfidCards/,
    'generation and status changes should refresh the list',
);
assert.match(
    source,
    /window\.confirm\(/,
    'status transitions should require confirmation',
);

console.log('RFID management checks passed');
