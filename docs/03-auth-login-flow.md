# Auth và login flow

Tài liệu này mô tả flow login hiện tại đúng theo codebase.

## File chính cần biết

- Login page: `src/app/auth/login/page.tsx`
- Type/schema login: `src/service/user/type.ts`
- API login/auth: `src/service/user/api.ts`
- Device fingerprint: `src/lib/auth/device-fingerprint.ts`
- Auth store: `src/stores/use-auth-store.ts`
- Axios config/interceptor: `src/lib/api/axios-config.ts`
- Protected layout: `src/app/(protected)/layout.tsx`

## Login flow hiện tại

Flow trong `src/app/auth/login/page.tsx`:

1. User nhập username/password ở login page.
2. React Hook Form dùng `loginFormSchema` để validate.
3. Mutation gọi `getDeviceFingerprint(values.username)` và `getDeviceLabel(values.username)`.
4. Tạo `LoginRequest`.
5. Gọi `loginApi(payload)`.
6. Nếu backend trả `authenticated` và `accessToken`, gọi `setJwtToken(auth.accessToken)`.
7. Gọi `getMyProfileApi()` để lấy `/auth/me`.
8. Gọi `setSession({ user, jwtToken: auth.accessToken })`.
9. Toast success.
10. Redirect theo role bằng `router.replace(getDefaultRouteByRoles(user.roles))`.

Code rút gọn theo hiện trạng:

```tsx
const payload: LoginRequest = {
    ...values,
    deviceFingerprint: getDeviceFingerprint(values.username),
    deviceLabel: getDeviceLabel(values.username),
};

const auth = await loginApi(payload);
setJwtToken(auth.accessToken);

const user = await getMyProfileApi();
```

Điểm quan trọng: phải set access token trước khi gọi `/auth/me`, vì request interceptor trong `apiClient` đọc token từ Zustand để gắn `Authorization: Bearer <token>`.

## Form login

File `src/service/user/type.ts` có 2 schema:

```ts
export const loginSchema = z.object({
    username: z.string().min(1, {
        message: 'Username is required.',
    }),
    password: z.string().min(1, {
        message: 'Password is required.',
    }),
    deviceFingerprint: z.string().min(1, {
        message: 'Device fingerprint is required.',
    }),
    deviceLabel: z.string().optional(),
});

export const loginFormSchema = loginSchema.pick({
    username: true,
    password: true,
});
```

Form chỉ quản lý `username` và `password`. `deviceFingerprint` và `deviceLabel` không phải hidden field cho user sửa. Chúng được tạo trong mutation.

## API auth

File `src/service/user/api.ts` hiện có:

- `loginApi(data: LoginRequest)` gọi `POST /auth/login`.
- `refreshApi()` gọi `POST /auth/refresh` bằng raw axios.
- `getMyProfileApi()` gọi `GET /auth/me`.
- `logoutApi()` gọi `POST /auth/logout`.
- `logoutAllApi()` gọi `POST /auth/logout-all`.

`refreshApi()` dùng raw axios để tránh interceptor recursion.

## Role redirect

Trong login page có function:

```ts
const getDefaultRouteByRoles = (roles: Role[]) => {
    if (roles.includes('SYSTEM_ADMIN')) return '/admin';
    if (roles.includes('PARKING_MANAGER')) return '/manager';
    if (roles.includes('STAFF')) return '/staff';
    if (roles.includes('PARKING_USER')) return '/driver';
    return '/';
};
```

Mapping chuẩn:

```txt
SYSTEM_ADMIN    -> /admin
PARKING_MANAGER -> /manager
STAFF           -> /staff
PARKING_USER    -> /driver
```

Role lấy từ `/auth/me`, không lấy cứng từ form login.

## Device fingerprint

File:

```txt
src/lib/auth/device-fingerprint.ts
```

Helper này có hai flow.

### Demo seed users

Nếu username match demo account, frontend trả fingerprint seed đã biết:

```txt
system.admin@smartpark.local -> seed-system-admin-device
manager@demo-parking.local   -> seed-manager-device
staff@demo-parking.local     -> seed-staff-device
driver@demo-parking.local    -> seed-driver-device
```

Label hiện tại:

```txt
system.admin@smartpark.local -> Seed System Admin Device
manager@demo-parking.local   -> Seed Parking Manager Device
staff@demo-parking.local     -> Seed Staff Device
driver@demo-parking.local    -> Seed Parking User Device
```

Username được normalize bằng `trim().toLowerCase()`, nên khác chữ hoa/thường vẫn match nếu email giống.

### Real users

Nếu username không match demo account:

- Tạo fingerprint bằng `crypto.randomUUID()` nếu browser hỗ trợ.
- Nếu không có `crypto.randomUUID()`, fallback bằng timestamp + random string.
- Lưu vào `localStorage` key `smartpark_device_fingerprint`.
- Lần sau reuse fingerprint cũ cùng browser.

Device label cũng được lưu vào `localStorage` key `smartpark_device_label`.

Lưu ý: code hiện tại dùng platform/userAgent để tạo label hiển thị, không dùng làm trust boundary. Backend mới là nơi quyết định device có thuộc user/tenant và đã được approve hay chưa.

## Access token và refresh token

### Access token

Access token hiện được lưu trong Zustand memory:

```txt
src/stores/use-auth-store.ts -> jwtToken
```

Request interceptor trong `src/lib/api/axios-config.ts` đọc:

```ts
const token = useAuthStore.getState().jwtToken;
```

Sau đó gắn header:

```ts
config.headers['Authorization'] = `Bearer ${token}`;
```

### Refresh token

Refresh token không lưu trong Zustand/localStorage. Backend quản lý refresh token bằng HttpOnly cookie.

`apiClient` bật:

```ts
withCredentials: true;
```

Để browser gửi cookie khi gọi backend.

## Axios interceptor refresh 401

File:

```txt
src/lib/api/axios-config.ts
```

Khi API trả HTTP 401:

1. Nếu request đó là `/auth/refresh`, clear token và reject lỗi hết phiên.
2. Nếu request khác và chưa retry, gọi raw axios `POST /auth/refresh`.
3. Lấy `accessToken` mới.
4. `setJwtToken(newToken)`.
5. Retry request ban đầu với Bearer token mới.
6. Nếu refresh fail, `clearAuth()`.

Code có queue `failedQueue` để xử lý nhiều request cùng bị 401 trong lúc refresh đang chạy.

## Reload/F5 hiện tại

Zustand store đang lưu in-memory, không persist. Khi F5:

- `jwtToken` reset về `null`.
- `user` reset về `null`.
- `isCheckingAuth` ban đầu là `true`.

Project hiện chưa có `AuthBootstrap` trong `src/app/providers.tsx` hoặc nơi khác. Vì vậy reload protected page có thể mất user state cho đến khi team implement bootstrap flow.

Flow nên có sau này:

```txt
app reload
  -> AuthBootstrap gọi refreshApi()
  -> setJwtToken(new access token)
  -> getMyProfileApi()
  -> setSession({ user, jwtToken })
```

## Common errors

### Login xong `/me` bị 401

Thường do chưa gọi `setJwtToken(auth.accessToken)` trước `getMyProfileApi()`.

Kiểm tra Network tab request `/auth/me` có header:

```txt
Authorization: Bearer ...
```

### Role redirect sai path

Kiểm tra `getDefaultRouteByRoles` trong login page và role backend trả từ `/auth/me`.

### Demo username không match fingerprint

Email demo phải match mapping trong `device-fingerprint.ts`. Nếu nhập username khác, frontend sẽ tạo UUID thật trong localStorage và backend có thể coi là device chưa approve.

### F5 mất user

Đây là hiện trạng dễ hiểu vì Zustand memory reset. Cần implement AuthBootstrap nếu muốn giữ session sau reload.

### Cookie refresh không gửi

Kiểm tra:

- `withCredentials: true` ở frontend.
- Backend CORS allow credentials.
- Cookie SameSite/Secure phù hợp môi trường local/prod.
- Domain/port frontend và backend.

### Lưu refresh token vào localStorage

Không làm. Refresh token phải là HttpOnly cookie do backend quản lý.
