# Fire Inspection Photo Upload UI

## Scope

- Route: `/staff/fire-inspection`
- Manager review route: `/manager/safety/inspections`
- Frontend is synced to the final backend photo upload contract in `fire-inspection-photo-upload-mvp.md`.
- Live upload was not exercised in this pass; use the manual smoke checklist below once the backend and storage are running.

## Final Backend Contract

Presign endpoint:

```http
POST /staff/fire-inspections/photos/presign-upload
```

Request:

```json
{
  "fileName": "inspection.jpg",
  "contentType": "image/jpeg"
}
```

Response:

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

The inspection submit request maps the uploaded object key to the confirmed final field name, `photoObjectKey`.

## Staff Upload Flow

1. Staff selects a due extinguisher.
2. Staff optionally selects a JPG, PNG, or WebP photo.
3. The UI validates type and size before submit.
4. On submit, if a file is selected:
   - Call `POST /staff/fire-inspections/photos/presign-upload`.
   - Upload the file to `uploadUrl` with `fetch` and the returned method, currently expected as `PUT`.
   - Include returned headers and ensure `Content-Type` is set to the selected file type when the response does not provide it.
   - No frontend app auth token is sent to `uploadUrl`; the presigned URL carries storage authorization.
   - Submit the inspection with `photoObjectKey`.
5. If no file is selected and legacy `Photo URL (optional)` is filled, submit `photoUrl`.

## Validation

- Allowed content types: `image/jpeg`, `image/png`, `image/webp`.
- Client max size: 5 MB.
- Friendly errors cover unsupported type, oversized file, `STORAGE_NOT_CONFIGURED`, upload failure, invalid/rejected photo object key, and inspection submit failure.

## Manager Log Display

- `GET /manager/fire-inspections/logs` returns `photoObjectKey`, `photoDisplayUrl`, and `photoUrlExpiresInSeconds` when an uploaded photo exists and storage can create a display URL.
- Manager logs prefer `photoDisplayUrl` and fall back to legacy `photoUrl`.
- If storage is unavailable while listing logs, rows can still contain `photoObjectKey` with `photoDisplayUrl: null`; the table then renders the normal no-photo state unless legacy `photoUrl` is present.
- The logs table renders a `View Photo` link only; it does not render full-size images inside rows.

## Manual Smoke Checklist

Staff:

- Sign in with a valid staff account and approved kiosk/device context.
- Open `/staff/fire-inspection` and select a due extinguisher.
- Select a JPG, PNG, or WebP file under 5 MB and confirm preview/file name render.
- Submit and confirm the browser calls presign, PUT upload, then inspection submit with `photoObjectKey`.
- Retry with storage disabled or unavailable and confirm the `STORAGE_NOT_CONFIGURED` message is friendly.
- Submit with legacy `Photo URL (optional)` and no selected file to confirm fallback still works.

Manager:

- Sign in with a manager account and open `/manager/safety/inspections`.
- Confirm rows with uploaded photos show `View Photo` from `photoDisplayUrl`.
- Confirm rows with only legacy `photoUrl` still show `View Photo`.
- Confirm rows without photos render normally.

## Limitations

- No live upload test was run in this FE sync pass.
- The legacy photo URL field remains as an advanced fallback for backward compatibility.
- Upload object cleanup after failed inspection submit is not implemented in the frontend scaffold.
