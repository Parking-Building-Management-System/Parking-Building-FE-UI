# 06 - Data Flow and State Plan

## Current Data Flow

- Data fetching: Axios service functions plus TanStack Query `useQuery`/`useMutation`.
- Forms: React Hook Form + Zod in login, tenant create, vehicle type dialog, zone create.
- Auth state: Zustand store `src/stores/use-auth-store.ts`.
- User/role/tenant context: `UserProfile` in auth store includes `tenantId`, `roles`, `permissions`.
- Dashboard/layout current user: sidebar and role card read Zustand directly.
- Optimistic update: MISSING. Mutations invalidate queries after success.
- Cache invalidation: Present in admin tenant/vehicle and manager facility mutations via `queryClient.invalidateQueries`.
- Toast/error: Sonner toasts used; no centralized error boundary.
- Loading skeletons: Present in admin/manager data pages.
- Empty states: Present in tenant, master data, parking, topology, slot tables.
- Reusable table component: shadcn `Table` primitives exist; no reusable data-table abstraction.
- Reusable modal/form pattern: Dialog/Form primitives exist; no domain-level form/modal abstraction.

## Concern Table

| Concern            | Current                               | Target                                                                       | Files                                                             | Risk                           | Suggested Phase    |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------ | ------------------ |
| Data fetching      | TanStack Query + service functions    | Keep; enforce service-first convention                                       | `src/service/**`, `src/providers/query-provider.tsx`              | Low                            | PHASE_0_FOUNDATION |
| API client         | Central Axios with interceptors       | Keep; clarify interceptor typing and error codes                             | `src/lib/api/axios-config.ts`                                     | Medium                         | PHASE_0_FOUNDATION |
| Form state         | RHF + Zod                             | Keep; schemas near DTO/domain                                                | `src/app/auth/login/page.tsx`, `src/service/**/type.ts`           | Low                            | PHASE_1_CRUD_BASIC |
| Auth state         | Memory Zustand                        | Keep access token memory, add bootstrap                                      | `src/stores/use-auth-store.ts`, `src/app/providers.tsx`           | High                           | PHASE_0_FOUNDATION |
| Tenant context     | In `user.tenantId`, not sent manually | Backend JWT/session-owned tenant; no FE tenantId for manager/staff/user APIs | `src/service/user/type.ts`, manager docs                          | High if backend expects header | PHASE_0_FOUNDATION |
| Role guard         | MISSING                               | Route-to-role metadata and protected layout guard                            | `src/app/(protected)/layout.tsx`, `src/config/navigation.ts`      | High                           | PHASE_0_FOUNDATION |
| Query keys         | Domain query key objects              | Continue with stable key factories                                           | `src/service/admin/api.ts`, `src/service/manager/facility-api.ts` | Low                            | PHASE_1_CRUD_BASIC |
| Cache invalidation | Manual invalidate after mutation      | Continue; document per module                                                | Feature components                                                | Medium                         | PHASE_1_CRUD_BASIC |
| Loading states     | Skeletons in API pages                | Required for all async pages                                                 | `src/features/admin/**`, `src/features/manager/**`                | Medium                         | PHASE_1_CRUD_BASIC |
| Error states       | Toast only mostly                     | Toast + inline retry/error panels for core CRUD                              | Feature components                                                | Medium                         | PHASE_1_CRUD_BASIC |
| Tables             | Raw shadcn table primitives           | Reusable data table only when duplication grows                              | `src/components/ui/table.tsx`                                     | Low                            | PHASE_1_CRUD_BASIC |
| Modals/forms       | Repeated Dialog/Form usage            | Keep local forms until repetition stabilizes                                 | `src/features/admin/**`, `src/features/manager/**`                | Low                            | PHASE_1_CRUD_BASIC |

## Recommended Conventions

- API client: use `apiClient` for all JSON APIs; raw Axios only for refresh or binary exceptions when justified.
- Query keys: `domainQueryKeys.resource` and `domainQueryKeys.resourceList(params)` as already used.
- DTO/type location: `src/service/<domain>/type.ts`; API functions in `src/service/<domain>/api.ts`; re-export in `index.ts`.
- Form validation: Zod schemas near service type when shared, local component schema when UI-only.
- Error handling: convert `ApiError` to readable copy with a shared helper like current `getErrorMessage`; add inline empty/error states on tables.
- Loading/empty state: every list/detail page must have skeleton/loading and empty state.
- Role guard: central route-role mapping; protected layout checks auth state, role, and redirects.
- Tenant handling: do not send tenantId for Manager/Staff/User requests. Tenant should come from backend auth/session/JWT. System Admin APIs can be global.
