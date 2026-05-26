import type { MockModulePageConfig } from '@/components/mock-module-page';

export const mockModulePages = {
    '/admin/tenants/new': {
        title: 'Create Tenant',
        description:
            'Dedicated tenant creation page for provisioning a SaaS tenant and initial manager access.',
        bullets: [
            'Collect company name and initial manager identity.',
            'Create the tenant workspace from System Admin context.',
            'Show onboarding result and tenant status after provisioning.',
        ],
        plannedApis: ['POST /admin/tenants'],
    },
    '/admin/master-data/vehicle-types': {
        title: 'Vehicle Types',
        description:
            'Focused view for global vehicle type configuration used by tenant facility and pricing modules.',
        bullets: [
            'List vehicle categories available across tenants.',
            'Create or edit vehicle type code, name, and active status.',
            'Keep master data aligned with parking zones and pricing rules.',
        ],
        plannedApis: [
            'GET /admin/master-data/vehicle-types',
            'POST /admin/master-data/vehicle-types',
            'PUT /admin/master-data/vehicle-types/{id}',
            'DELETE /admin/master-data/vehicle-types/{id}',
        ],
    },
    '/admin/master-data/roles': {
        title: 'Roles & Permissions',
        description:
            'Focused RBAC view for reviewing system roles and future permission assignments.',
        bullets: [
            'List operational roles used by the SaaS platform.',
            'Review role descriptions and intended permissions.',
            'Prepare for future permission matrix editing.',
        ],
        plannedApis: ['GET /admin/master-data/roles'],
    },
    '/admin/system-health': {
        title: 'System Health',
        description:
            'System Admin overview for platform API availability and operational health.',
        bullets: [
            'Show backend API availability and degraded services.',
            'Summarize request volume and error trends.',
            'Surface high-level system status for SaaS operations.',
        ],
        plannedApis: ['GET /admin/system-health'],
    },
    '/admin/system-health/api': {
        title: 'API Health',
        description:
            'System Admin diagnostics page for API and dependency health checks.',
        bullets: [
            'Display service health by API group.',
            'Track degraded dependencies and recent failures.',
            'Support quick triage before customer escalation.',
        ],
        plannedApis: ['GET /admin/system-health/api'],
    },
    '/admin/system-health/traffic': {
        title: 'Traffic / Usage',
        description:
            'Traffic analytics page for platform usage and request trends.',
        bullets: [
            'Chart request count, errors, and latency over time.',
            'Separate traffic by control plane module.',
            'Help System Admin understand SaaS load patterns.',
        ],
        plannedApis: ['GET /admin/system-health/traffic'],
    },
    '/admin/audit': {
        title: 'Audit & Security',
        description:
            'Security overview for platform-level audit events and session controls.',
        bullets: [
            'Summarize privileged admin activities.',
            'Review suspicious access patterns.',
            'Link to audit logs and forced logout tools.',
        ],
        plannedApis: ['GET /admin/audit/summary'],
    },
    '/admin/audit/logs': {
        title: 'Admin Audit Logs',
        description:
            'Audit log search for System Admin actions across SaaS tenants.',
        bullets: [
            'Search admin actions by actor, tenant, and time range.',
            'Inspect changes to tenants, master data, and security settings.',
            'Export audit evidence when backend supports it.',
        ],
        plannedApis: ['GET /admin/audit/logs'],
    },
    '/admin/audit/sessions': {
        title: 'Force Logout Sessions',
        description:
            'Security tool for revoking active sessions when accounts or devices are compromised.',
        bullets: [
            'Find active admin or manager sessions.',
            'Force logout selected users or all sessions for an account.',
            'Record session revocation events for audit.',
        ],
        plannedApis: [
            'GET /admin/audit/sessions',
            'POST /admin/audit/sessions/revoke',
        ],
    },
    '/admin/settings': {
        title: 'Settings',
        description: 'System Admin settings for platform-level configuration.',
        bullets: [
            'Configure global SaaS defaults.',
            'Review environment-level feature flags.',
            'Prepare future notification and security settings.',
        ],
        plannedApis: ['GET /admin/settings', 'PUT /admin/settings'],
    },
    '/manager/facility': {
        title: 'Facility Setup',
        description:
            'Manager overview for configuring parking buildings, topology, slots, and RFID card inventory.',
        bullets: [
            'Navigate tenant facility setup modules.',
            'Track parking topology readiness before operations start.',
            'Prepare bulk slot and RFID card setup workflows.',
        ],
        plannedApis: ['GET /manager/facility/summary'],
    },
    '/manager/facility/floors': {
        title: 'Floors',
        description:
            'Floor management page for creating and maintaining tenant parking floors.',
        bullets: [
            'List floors across tenant parkings.',
            'Create or edit floor code, name, display order, and active state.',
            'Prepare topology changes before assigning zones and slots.',
        ],
        plannedApis: [
            'GET /manager/parkings/{parkingId}/floors',
            'POST /manager/parkings/{parkingId}/floors',
            'PUT /manager/floors/{id}',
            'DELETE /manager/floors/{id}',
        ],
    },
    '/manager/facility/zones': {
        title: 'Zones',
        description:
            'Zone management page for vehicle-type capacity areas within floors.',
        bullets: [
            'List zones by parking and floor.',
            'Create or edit zone capacity, vehicle type, and status.',
            'Prepare slot allocation and violation tracking rules.',
        ],
        plannedApis: [
            'GET /manager/floors/{floorId}/zones',
            'POST /manager/floors/{floorId}/zones',
            'PUT /manager/zones/{id}',
            'DELETE /manager/zones/{id}',
        ],
    },
    '/manager/facility/slots/import': {
        title: 'Slot Import / Export',
        description:
            'Bulk slot setup page for importing and exporting slot inventory files.',
        bullets: [
            'Upload Excel files for slot creation.',
            'Download current slot inventory for offline edits.',
            'Show validation errors before committing imported slots.',
        ],
        plannedApis: [
            'POST /manager/slots/import',
            'GET /manager/slots/export',
        ],
    },
    '/manager/facility/rfid-cards': {
        title: 'RFID Cards',
        description:
            'RFID card inventory and assignment setup for hybrid card plus PWA workflows.',
        bullets: [
            'List card codes such as CARD-001.',
            'Track card active, lost, or in-use state.',
            'Prepare card assignment during staff check-in.',
        ],
        plannedApis: ['GET /manager/rfid-cards', 'POST /manager/rfid-cards'],
    },
    '/manager/staff-devices': {
        title: 'Staff & Devices',
        description:
            'Manager overview for staff accounts, kiosks, trusted devices, and emergency controls.',
        bullets: [
            'Mock page / API pending.',
            'This module will be implemented after Staff Accounts and Facility Setup.',
            'Summarize staff account readiness.',
            'Review kiosk and device binding status.',
            'Route managers to approval and kill switch workflows.',
        ],
        plannedApis: ['GET /manager/staff-devices/summary'],
    },
    '/manager/staff-devices/staff': {
        title: 'Staff Accounts',
        description:
            'Staff account administration for operational users at tenant parking sites.',
        bullets: [
            'Create staff with internal username or employee code.',
            'Toggle active state and red-flag permissions.',
            'Review staff assigned to kiosks or shifts.',
        ],
        plannedApis: [
            'GET /manager/staff',
            'POST /manager/staff',
            'PATCH /manager/staff/{id}/status',
        ],
    },
    '/manager/staff-devices/kiosks': {
        title: 'Kiosks / Gates',
        description:
            'Physical kiosk and gate management for tenant parking operations.',
        bullets: [
            'Mock page / API pending.',
            'This module will be implemented after Staff Accounts and Facility Setup.',
            'List gate booths and physical kiosk identities.',
            'Bind allowed staff to kiosk positions.',
            'Inspect currently trusted devices per kiosk.',
        ],
        plannedApis: ['GET /manager/kiosks', 'POST /manager/kiosks'],
    },
    '/manager/staff-devices/device-approvals': {
        title: 'Device Approvals',
        description:
            'Approval queue for unknown staff devices requesting kiosk access.',
        bullets: [
            'Mock page / API pending.',
            'This module will be implemented after Staff Accounts and Facility Setup.',
            'Review pending device requests from staff login.',
            'Approve temporary access or reject requests.',
            'Keep device approval history for audit.',
        ],
        plannedApis: [
            'GET /manager/device-requests',
            'POST /manager/device-requests/{id}/approve',
            'POST /manager/device-requests/{id}/reject',
        ],
    },
    '/manager/staff-devices/kill-switch': {
        title: 'Kill Switch',
        description:
            'Emergency controls for disabling risky staff accounts or device access.',
        bullets: [
            'Mock page / API pending.',
            'This module will be implemented after Staff Accounts and Facility Setup.',
            'Deactivate staff accounts immediately.',
            'Revoke trusted devices for a kiosk or staff account.',
            'Force logout operational sessions when needed.',
        ],
        plannedApis: [
            'POST /manager/staff/{id}/kill-switch',
            'POST /manager/devices/{id}/revoke',
        ],
    },
    '/manager/operations': {
        title: 'Operations',
        description:
            'Manager operations hub for monitoring sessions, logs, and exceptions.',
        bullets: [
            'Summarize active parking sessions.',
            'Surface live occupancy and operational alerts.',
            'Route managers to exception and log review pages.',
        ],
        plannedApis: ['GET /manager/operations/summary'],
    },
    '/manager/operations/live-monitor': {
        title: 'Live Monitor',
        description:
            'Real-time operational monitor for slots, occupancy, and gate activity.',
        bullets: [
            'Show live slot colors by status.',
            'Track active entry and exit events.',
            'Prepare future map and heatmap views.',
        ],
        plannedApis: ['GET /manager/operations/live-monitor'],
    },
    '/manager/operations/sessions': {
        title: 'Active Sessions',
        description: 'Active parking session list for manager supervision.',
        bullets: [
            'List vehicles currently parked.',
            'Filter active sessions by parking, zone, and vehicle type.',
            'Inspect session age and current billing state.',
        ],
        plannedApis: ['GET /manager/parking-sessions/active'],
    },
    '/manager/operations/logs': {
        title: 'Entry / Exit Logs',
        description:
            'Operational log review for staff-created entry and exit events.',
        bullets: [
            'Search entry and exit actions by plate or card.',
            'Review gate action history by staff member.',
            'Support future export for operations audit.',
        ],
        plannedApis: ['GET /manager/operations/logs'],
    },
    '/manager/operations/exceptions': {
        title: 'Exceptions',
        description:
            'Exception queue for lost tickets, wrong plates, and manual recovery.',
        bullets: [
            'Review staff-submitted exception actions.',
            'Track required reason and evidence images.',
            'Approve or audit red-flag operational events.',
        ],
        plannedApis: ['GET /manager/operations/exceptions'],
    },
    '/manager/pricing': {
        title: 'Pricing & Billing',
        description: 'Pricing and billing hub for tenant parking monetization.',
        bullets: [
            'Configure time rules and vehicle-type pricing.',
            'Manage monthly subscriptions and invoice flows.',
            'Track debt and payment reminders.',
        ],
        plannedApis: ['GET /manager/pricing/summary'],
    },
    '/manager/pricing/time-rules': {
        title: 'Time Rules',
        description:
            'Time-based pricing rules for grace periods, windows, and blocks.',
        bullets: [
            'Configure grace period and block pricing rules.',
            'Define day and night windows.',
            'Preview fee calculation behavior before activation.',
        ],
        plannedApis: [
            'GET /manager/pricing/time-rules',
            'PUT /manager/pricing/time-rules',
        ],
    },
    '/manager/pricing/matrix': {
        title: 'Pricing Matrix',
        description: 'Vehicle-type pricing matrix for tenant parking products.',
        bullets: [
            'Set prices by vehicle type and time rule.',
            'Review active and scheduled pricing versions.',
            'Validate pricing impact before publishing.',
        ],
        plannedApis: [
            'GET /manager/pricing/matrix',
            'PUT /manager/pricing/matrix',
        ],
    },
    '/manager/pricing/subscriptions': {
        title: 'Subscriptions',
        description:
            'Monthly pass and subscription management for tenant customers.',
        bullets: [
            'List active, expired, and cancelled subscriptions.',
            'Create, renew, or cancel monthly passes.',
            'Prepare reminders for expiring subscriptions.',
        ],
        plannedApis: [
            'GET /manager/subscriptions',
            'POST /manager/subscriptions',
        ],
    },
    '/manager/pricing/invoices': {
        title: 'Invoices',
        description:
            'Invoice history and billing records for tenant operations.',
        bullets: [
            'List generated invoices by customer and period.',
            'Track paid, unpaid, and cancelled invoice states.',
            'Prepare PDF download once backend supports it.',
        ],
        plannedApis: ['GET /manager/invoices'],
    },
    '/manager/pricing/debts': {
        title: 'Debt & Reminders',
        description:
            'Debt tracking and reminder workflow for unpaid subscriptions or invoices.',
        bullets: [
            'List unpaid subscription and invoice debt.',
            'Send reminders through future notification channels.',
            'Record adjustment notes for billing review.',
        ],
        plannedApis: [
            'GET /manager/debts',
            'POST /manager/debts/{id}/reminders',
        ],
    },
    '/manager/incidents': {
        title: 'Incidents & Violations',
        description:
            'Operations risk hub for incidents, violations, and red-flag actions.',
        bullets: [
            'Summarize recent operational incidents.',
            'Route managers to zone violations and red-flag action logs.',
            'Prepare audit views for exception-heavy shifts.',
        ],
        plannedApis: ['GET /manager/incidents/summary'],
    },
    '/manager/incidents/logs': {
        title: 'Incident Log',
        description:
            'Incident log for lost tickets, overtime, wrong plates, forced opens, and cancellations.',
        bullets: [
            'Search incident history by plate, staff, or type.',
            'Inspect reason, evidence, and resulting fee changes.',
            'Prepare management review for risky actions.',
        ],
        plannedApis: ['GET /manager/incidents/logs'],
    },
    '/manager/incidents/zone-violations': {
        title: 'Zone Violations',
        description:
            'Wrong-zone parking violations and actual slot correction workflow.',
        bullets: [
            'List vehicles detected in the wrong zone.',
            'Apply violation fees when policy requires it.',
            'Update actual slot assignment after review.',
        ],
        plannedApis: [
            'GET /manager/zone-violations',
            'PATCH /manager/zone-violations/{id}',
        ],
    },
    '/manager/incidents/red-flags': {
        title: 'Red Flag Actions',
        description:
            'Audit log for force open, ticket cancellation, plate edits, and sensitive staff actions.',
        bullets: [
            'Review red-flag actions by staff account.',
            'Check required reason and evidence image.',
            'Escalate suspicious operational patterns.',
        ],
        plannedApis: ['GET /manager/incidents/red-flags'],
    },
    '/manager/analytics': {
        title: 'Analytics',
        description:
            'Business intelligence hub for revenue, occupancy, and traffic trends.',
        bullets: [
            'Summarize high-level tenant performance.',
            'Navigate to revenue, occupancy, and traffic heatmap dashboards.',
            'Prepare exportable BI views for managers.',
        ],
        plannedApis: ['GET /manager/analytics/summary'],
    },
    '/manager/analytics/revenue': {
        title: 'Revenue',
        description:
            'Revenue dashboard for cash, cashless, and time-filtered parking income.',
        bullets: [
            'Track revenue by date, week, and month.',
            'Separate cash and cashless collections.',
            'Prepare shift and tenant-level reconciliation views.',
        ],
        plannedApis: ['GET /manager/analytics/revenue'],
    },
    '/manager/analytics/occupancy': {
        title: 'Occupancy',
        description:
            'Occupancy dashboard for availability, utilization, and vehicle-type mix.',
        bullets: [
            'Show occupancy donut chart by slot status.',
            'Filter occupancy by parking and vehicle type.',
            'Support capacity planning decisions.',
        ],
        plannedApis: ['GET /manager/analytics/occupancy'],
    },
    '/manager/analytics/traffic-heatmap': {
        title: 'Traffic Heatmap',
        description: 'Weekday and hourly heatmap for parking traffic patterns.',
        bullets: [
            'Show traffic intensity by weekday and hour.',
            'Filter by vehicle type and parking site.',
            'Identify peak entry and exit windows.',
        ],
        plannedApis: ['GET /manager/analytics/traffic-heatmap'],
    },
    '/manager/settings': {
        title: 'Settings',
        description:
            'Tenant manager settings for facility operations and module defaults.',
        bullets: [
            'Configure tenant-level operational defaults.',
            'Review feature flags for manager modules.',
            'Prepare notification and approval settings.',
        ],
        plannedApis: ['GET /manager/settings', 'PUT /manager/settings'],
    },
    '/staff/exit': {
        title: 'Exit Cashier',
        description:
            'Staff cashier page for completing parking sessions and collecting payment.',
        bullets: [
            'Search active sessions by plate or card code.',
            'Show entry image, current image placeholder, and bill amount.',
            'Complete session and release slot after payment confirmation.',
        ],
        plannedApis: [
            'GET /staff/parking-sessions/search',
            'POST /staff/parking-sessions/check-out',
        ],
    },
    '/staff/live-monitor': {
        title: 'Live Monitor',
        description:
            'Staff live slot monitor for read-only operational visibility.',
        bullets: [
            'Show slot map or table by availability state.',
            'Highlight occupied, assigned, and violation states.',
            'Support quick lookup during gate operations.',
        ],
        plannedApis: ['GET /staff/live-monitor'],
    },
    '/staff/exceptions': {
        title: 'Exceptions',
        description:
            'Staff exception workflow for lost tickets, fuzzy plate search, and manual recovery.',
        bullets: [
            'Submit exception action with reason and evidence.',
            'Request force-open or plate edit when permitted.',
            'Keep sensitive actions auditable for managers.',
        ],
        plannedApis: [
            'POST /staff/exceptions',
            'GET /staff/exceptions/actions',
        ],
    },
    '/staff/shift-handover': {
        title: 'Shift Handover',
        description:
            'Staff end-of-shift handover page for cash count and logout workflow.',
        bullets: [
            'Capture staff-counted cash total.',
            'Submit shift handover without showing system revenue total.',
            'Close the shift and return staff to login after submit.',
        ],
        plannedApis: ['POST /staff/shifts/handover'],
    },
} satisfies Record<string, MockModulePageConfig>;
