import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const apiSource = readFileSync(
    new URL('../src/service/manager/staff-api.ts', import.meta.url),
    'utf8',
);
const pageSource = readFileSync(
    new URL('../src/features/manager/staff-accounts.tsx', import.meta.url),
    'utf8',
);

assert.match(
    apiSource,
    /apiClient\.delete<ApiResponse<void>>\([\s\S]*`\$\{MANAGER_ENDPOINT\}\/staff\/\$\{id\}`/,
    'Staff deletion must call the tenant-scoped Manager Staff endpoint',
);
assert.match(pageSource, /Delete Staff account/);
assert.match(pageSource, /normalizedConfirmation === 'DELETE'/);
assert.match(pageSource, /normalizedConfirmation === staff\?\.username/);
assert.match(pageSource, /Every active session will be revoked/);
assert.match(pageSource, /Kiosk assignments and device access will be disabled/);
assert.match(pageSource, /Cash, inspection, violation, and audit history will remain/);
assert.match(pageSource, /managerStaffQueryKeys\.staff/);
assert.match(pageSource, /managerKioskDeviceQueryKeys\.kiosks/);
assert.match(pageSource, /managerKioskDeviceQueryKeys\.deviceApprovals/);
assert.match(pageSource, /managerPasswordResetQueryKeys\.all/);

console.log('Staff account deletion UI checks passed');
