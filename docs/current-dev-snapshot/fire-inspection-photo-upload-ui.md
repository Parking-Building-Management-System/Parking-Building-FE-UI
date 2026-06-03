# Fire Inspection Photo Upload UI

## Scope

- Route: `/staff/fire-inspection`
- Manager review route: `/manager/safety/inspections`
- This is a frontend scaffold for the backend photo upload work in progress.
- Live upload was not exercised in this pass because the backend endpoint is not confirmed ready.

## Expected Backend Contract

Assumed presign endpoint:

```http
POST /staff/fire-inspections/photos/presign-upload
```

Expected request:

```json
{
  "fileName": "inspection.jpg",
  "contentType": "image/jpeg"
}
```

Expected response:

```json
{
  "uploadUrl": "https://storage.example/upload-url",
  "objectKey": "tenants/.../inspection.jpg",
  "method": "PUT",
  "headers": {
    "Content-Type": "image/jpeg"
  },
  "expiresInSeconds": 900
}
```

The inspection submit request currently maps the uploaded object key to `photoObjectKey`. If the final backend field name differs, update the mapper in `src/features/staff/fire-inspection.tsx`.

## Staff Upload Flow

1. Staff selects a due extinguisher.
2. Staff optionally selects a JPG, PNG, or WebP photo.
3. The UI validates type and size before submit.
4. On submit, if a file is selected:
   - Call `POST /staff/fire-inspections/photos/presign-upload`.
   - Upload the file to `uploadUrl` with `fetch` and the returned method, currently expected as `PUT`.
   - Include returned headers plus `Content-Type`; no frontend auth token is sent to `uploadUrl`.
   - Submit the inspection with `photoObjectKey`.
5. If no file is selected and legacy `Photo URL (optional)` is filled, submit `photoUrl`.

## Validation

- Allowed content types: `image/jpeg`, `image/png`, `image/webp`.
- Client max size: 5 MB.
- Friendly errors cover unsupported type, oversized file, storage not configured, upload failure, and inspection submit failure.

## Manager Log Display

- `GET /manager/fire-inspections/logs` is expected to return `photoDisplayUrl` when an uploaded photo exists.
- Manager logs prefer `photoDisplayUrl` and fall back to legacy `photoUrl`.
- The logs table renders a `View Photo` link only; it does not render full-size images inside rows.

## Contract Sync Required

- Check final backend docs against `fire-inspection-photo-upload-mvp.md` before live smoke.
- Confirm the final submit field name for uploaded photos. Current scaffold uses `photoObjectKey`.
- Confirm whether `photoDisplayUrl` is the final manager log response field.
- Confirm whether presign response `headers` must be forwarded exactly or merged with `Content-Type`.

## Limitations

- No live upload test was run.
- The legacy photo URL field remains as an advanced fallback until backend upload is finalized.
- Upload object cleanup after failed inspection submit is not implemented in the frontend scaffold.
