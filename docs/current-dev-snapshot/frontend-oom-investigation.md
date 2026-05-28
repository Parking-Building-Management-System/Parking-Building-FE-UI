# Frontend OOM Investigation

## Observed Symptoms

- Next dev server sometimes grows toward ~7GB RSS and crashes with:
  `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory`
- Logs seen during incidents:
  - `Fast Refresh had to perform a full reload due to a runtime error.`
  - `GET /manager/facility/maps 200`
  - `HEAD /manager/facility/maps 200`
  - `[DEP0205] DeprecationWarning: module.register() is deprecated. Use module.registerHooks() instead.`

## Process Audit

Initial audit found no active Next dev server listening on ports 3000/3001. A clean baseline was created by removing `.next` and starting exactly one `bun run dev` process.

Useful cleanup commands:

```bash
pkill -f "next dev"
pkill -f "next-server"
rm -rf .next
```

If `pkill -f "next dev"` is run from a shell command that contains that literal text, it can match the shell itself. Prefer checking with:

```bash
ps aux | grep -E "next|node" | grep -v grep | sort -k6 -nr | head -30
lsof -i :3000 -sTCP:LISTEN
```

## Reproduction Notes

Clean Turbopack dev server:

- Startup: parent `next dev` ~81MB RSS, `next-server` ~234MB RSS.
- First route compilation causes expected one-time memory growth.
- After requesting `/manager`, `/manager/facility/maps`, `/manager/staff-devices/staff`, and `/staff`, `next-server` stabilized around ~1.17GB RSS for 3 minutes.
- No repeated Fast Refresh full reload appeared in server logs during the test.
- Repeated `GET`/`HEAD` requests to `/manager/facility/maps` caused a temporary rise, then memory dropped back near the stable baseline.

This strongly narrows the observed OOM away from a deterministic app-side render/request loop in those routes. The remaining high-memory behavior is consistent with Next 16 dev compiler/tooling cache growth, especially after compiling many routes.

## Root Cause / Strong Narrowing

No app-level infinite loop was found:

- No map-page polling.
- No refetch while typing search.
- No repeated presign-download for empty/http URL map values.
- No render-time state updates.
- No query invalidation loop.
- No project call to `module.register()`.
- No recursive dev script or nested dev server script.

App-side multipliers were found and mitigated:

1. `ReactQueryDevtools` was always mounted in the root provider. This is useful during debugging but increases dev bundle/runtime memory for every route.
2. `AuthBootstrap` could run duplicate refresh/profile calls under React dev Strict Mode mount/unmount/remount behavior.
3. The sidebar had a global `refetchInterval: 60_000` device-approval query on every manager route.

## Fix Applied

- Removed always-mounted React Query Devtools from `QueryProvider`.
- Added a shared in-flight auth bootstrap promise so React dev Strict Mode does not duplicate refresh/profile calls.
- Removed sidebar polling and replaced it with a 5-minute `staleTime`.
- Added `bun run dev:webpack` as a fallback script:

```json
"dev:webpack": "next dev --webpack"
```

The default `bun run dev` remains unchanged.

## DEP0205

`[DEP0205] module.register()` is not app-caused. Repository search found no `module.register` usage in project code. The warning appears in both Turbopack and webpack Next dev modes, so it is currently a Next/dev-tooling warning.

## Verification

- `bun run lint`: passed.
- `bun run check-types`: passed.
- `bun run build`: passed.
- Clean `bun run dev`: route isolation passed with stable memory after compilation.
- `bun run dev:webpack`: starts and serves the tested routes.

## Remaining Risks

- Interactive browser Fast Refresh can still trigger full reloads if a separate runtime error exists in the browser console. The server-side route test did not reproduce that error.
- Next 16 dev compiler memory may still grow when many routes are compiled in one long-running session. Use `bun run dev:webpack` if Turbopack continues to grow, and restart stale dev servers before long sessions.
- Browser-only network loops should be checked in DevTools if the OOM reproduces with an authenticated browser session.

## Files Changed

- `package.json`
- `src/providers/query-provider.tsx`
- `src/components/auth/auth-bootstrap.tsx`
- `src/components/layout/sidebar.tsx`
- `docs/current-dev-snapshot/frontend-oom-investigation.md`
