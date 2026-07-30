import assert from 'node:assert/strict';

import {
    findActiveNavigationHref,
    isNavigationGroupActive,
    isSegmentSafeRouteMatch,
    normalizeNavigationPath,
} from '../src/lib/navigation/route-matching';

const staffRoutes = [
    '/manager/staff-devices/staff',
    '/manager/staff-devices/kiosks',
    '/manager/staff-devices/device-approvals',
    '/manager/staff-devices/password-reset-requests',
];

assert.equal(
    findActiveNavigationHref('/manager/staff-devices/staff', staffRoutes),
    '/manager/staff-devices/staff',
    'the first child should be active',
);
assert.equal(
    findActiveNavigationHref('/manager/staff-devices/kiosks', staffRoutes),
    '/manager/staff-devices/kiosks',
    'the second child should be active',
);
assert.equal(
    findActiveNavigationHref(
        '/manager/staff-devices/staff/employee-1',
        staffRoutes,
    ),
    '/manager/staff-devices/staff',
    'a child detail route should activate its longest parent leaf',
);
assert.equal(
    findActiveNavigationHref(
        '/manager/staff-devices/staff/employee-1/edit',
        staffRoutes,
    ),
    '/manager/staff-devices/staff',
    'a nested edit route should activate its longest parent leaf',
);
assert.equal(
    findActiveNavigationHref(
        '/manager/staff-devices/device-approvals/?status=PENDING#queue',
        staffRoutes,
    ),
    '/manager/staff-devices/device-approvals',
    'trailing slashes, query strings, and hashes should not change active state',
);
assert.equal(
    findActiveNavigationHref('/manager/staff-devices', staffRoutes),
    null,
    'the group root is handled separately and must not activate a child',
);
assert.equal(
    isNavigationGroupActive({
        pathname: '/manager/staff-devices',
        groupPath: '/manager/staff-devices',
        childHrefs: staffRoutes,
        activeLeafHref: null,
    }),
    true,
    'the group root should expand its parent without activating a child',
);
assert.equal(
    isNavigationGroupActive({
        pathname: '/manager/staff-devices/kiosks/terminal-1',
        groupPath: '/manager/staff-devices',
        childHrefs: staffRoutes,
        activeLeafHref: '/manager/staff-devices/kiosks',
    }),
    true,
    'a child detail route should expand its parent group',
);
assert.equal(
    findActiveNavigationHref('/manager/staffing', staffRoutes),
    null,
    'a similarly prefixed unrelated route must not activate a child',
);
assert.equal(
    findActiveNavigationHref('/staff/exit/receipt', [
        '/staff',
        '/staff/exit',
    ]),
    '/staff/exit',
    'the longest segment-safe leaf should win over a broad parent route',
);
assert.equal(
    normalizeNavigationPath('/manager/pricing/config/?tab=rules#hourly'),
    '/manager/pricing/config',
);
assert.equal(
    isSegmentSafeRouteMatch(
        '/manager/staff/accounts/123',
        '/manager/staff/accounts',
    ),
    true,
);
assert.equal(
    isSegmentSafeRouteMatch('/manager/staffing', '/manager/staff'),
    false,
);

console.log('navigation route matching matrix passed');
