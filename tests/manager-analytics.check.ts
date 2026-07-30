import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import apiClient from '../src/lib/api/axios-config';
import {
    buildAnalyticsParams,
    validatePeriod,
} from '../src/features/manager/analytics-dashboard';
import { normalizeManagerAnalyticsParams } from '../src/service/manager/analytics-api';

const normalized = normalizeManagerAnalyticsParams({
    parkingId: 'parking-1',
    periodType: 'MONTH',
    year: 2026,
    month: 7,
    comparison: 'SAME_PERIOD_LAST_YEAR',
});
assert.deepEqual(normalized, {
    parkingId: 'parking-1',
    periodType: 'MONTH',
    comparison: 'SAME_PERIOD_LAST_YEAR',
    year: 2026,
    month: 7,
});
assert.equal(
    apiClient.getUri({
        url: '/manager/analytics/overview',
        params: normalized,
    }),
    'http://localhost:8080/manager/analytics/overview?parkingId=parking-1&periodType=MONTH&comparison=SAME_PERIOD_LAST_YEAR&year=2026&month=7',
);

const baseFilters = {
    parkingId: 'parking-1',
    periodType: 'MONTH' as const,
    selectedDate: '2026-07-30',
    selectedMonth: '2026-07',
    selectedQuarter: '3',
    selectedYear: '2026',
    customFrom: '2026-07-01',
    customTo: '2026-07-30',
    vehicleTypeId: 'ALL_VEHICLE_TYPES',
};
assert.deepEqual(buildAnalyticsParams(baseFilters), {
    parkingId: 'parking-1',
    periodType: 'MONTH',
    comparison: 'SAME_PERIOD_LAST_YEAR',
    vehicleTypeId: undefined,
    year: 2026,
    month: 7,
});
assert.deepEqual(
    buildAnalyticsParams({
        ...baseFilters,
        periodType: 'CUSTOM',
        vehicleTypeId: 'car-id',
    }),
    {
        parkingId: 'parking-1',
        periodType: 'CUSTOM',
        comparison: 'SAME_PERIOD_LAST_YEAR',
        vehicleTypeId: 'car-id',
        from: '2026-07-01',
        to: '2026-07-30',
    },
);
assert.equal(
    validatePeriod({
        ...baseFilters,
        periodType: 'YEAR',
        selectedYear: '1969',
    }),
    'Year must be from 1970 to 2200.',
);
assert.equal(
    validatePeriod({
        ...baseFilters,
        periodType: 'CUSTOM',
        customFrom: '2026-08-01',
        customTo: '2026-07-01',
    }),
    'Custom start date must not be after the end date.',
);

const dashboardSource = readFileSync(
    new URL('../src/features/manager/analytics-dashboard.tsx', import.meta.url),
    'utf8',
);
const navigationSource = readFileSync(
    new URL('../src/config/navigation.ts', import.meta.url),
    'utf8',
);
const routeSource = readFileSync(
    new URL(
        '../src/app/(protected)/manager/analytics/page.tsx',
        import.meta.url,
    ),
    'utf8',
);

assert.match(navigationSource, /title: 'Analytics Dashboard'/);
assert.match(navigationSource, /href: '\/manager\/analytics'/);
assert.match(routeSource, /ManagerAnalyticsDashboard/);
assert.match(dashboardSource, /getManagerAnalyticsOverviewApi/);
assert.match(dashboardSource, /SAME_PERIOD_LAST_YEAR/);
assert.match(dashboardSource, /Asia\/Ho_Chi_Minh/);
assert.match(dashboardSource, /type="month"/);
assert.match(dashboardSource, /Custom periods may include at most 366 days/);
assert.match(dashboardSource, /formatVnd/);
assert.match(dashboardSource, /Hourly session-overlap approximation/);
assert.match(dashboardSource, /averageOccupancyRate/);
assert.match(dashboardSource, /Historical snapshot not available/);
assert.match(dashboardSource, /No traffic was recorded in this period/);
assert.match(dashboardSource, /analyticsQuery\.isPlaceholderData/);
assert.match(dashboardSource, /title="Adjust the report period"/);
assert.match(dashboardSource, /Percentage change not available/);
assert.match(dashboardSource, /accessibilityLayer/);
assert.doesNotMatch(
    dashboardSource,
    /mockData|Math\.random|placeholder analytics/i,
);

console.log('Manager analytics dashboard checks passed');
