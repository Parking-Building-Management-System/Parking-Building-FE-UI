# Zustand store

Project dùng Zustand cho client/global state nhẹ. Hiện store quan trọng nhất là auth store.

## File chính

```txt
src/stores/use-auth-store.ts
```

Store này lưu session phía frontend:

- user hiện tại.
- trạng thái đã authenticated chưa.
- trạng thái app đang check auth.
- access token trong memory.

Zustand không phải security boundary. User có thể sửa state trong browser. Backend vẫn phải check JWT, role, permission và trusted device.

## State hiện tại

```ts
interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isCheckingAuth: boolean;
    jwtToken: string | null;
}
```

### `user`

Thông tin user từ `/auth/me`.

Type ở `src/service/user/type.ts`:

```ts
export interface UserProfile {
    id: string;
    tenantId: string;
    username: string;
    fullName: string;
    phone: string;
    roles: Role[];
    permissions: string[];
}
```

### `isAuthenticated`

Boolean cho UI biết user đã login chưa.

Hiện được set:

- `true` khi `setAuth(user)` có user hoặc `setSession(...)`.
- `false` khi `clearAuth()`.

### `isCheckingAuth`

Trạng thái app đang kiểm tra session.

Initial hiện là:

```ts
isCheckingAuth: true;
```

Nhưng project hiện chưa có `AuthBootstrap`, nên state này chưa được dùng đầy đủ để restore session sau F5.

### `jwtToken`

Access token trong memory.

Request interceptor trong `src/lib/api/axios-config.ts` đọc token này để gắn Bearer token.

Không lưu refresh token ở đây.

## Action hiện tại

### `setAuth(user)`

Set user và `isAuthenticated`.

```ts
setAuth: (user) =>
    set({
        user,
        isAuthenticated: !!user,
        isCheckingAuth: false,
    });
```

### `setJwtToken(token)`

Set access token.

Login flow đang gọi action này trước khi gọi `/auth/me`.

```ts
setJwtToken(auth.accessToken);
```

### `setCheckingAuth(isCheckingAuth)`

Set trạng thái app đang check auth.

Hữu ích khi implement AuthBootstrap.

### `setSession({ user, jwtToken })`

Set trọn session sau khi login hoặc refresh thành công:

```ts
setSession({
    user,
    jwtToken,
});
```

Action này set:

- `user`
- `jwtToken`
- `isAuthenticated: true`
- `isCheckingAuth: false`

### `clearAuth()`

Xóa session frontend:

```ts
clearAuth: () =>
    set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
        jwtToken: null,
    });
```

`apiClient` gọi `clearAuth()` khi refresh token thất bại.

## Dùng store trong component

Nên select đúng field cần dùng để tránh rerender không cần thiết.

Tốt:

```tsx
const user = useAuthStore((state) => state.user);
```

Tốt:

```tsx
const setSession = useAuthStore((state) => state.setSession);
```

Không nên destructure cả store nếu component chỉ cần một field:

```tsx
const { user, jwtToken, setSession, clearAuth } = useAuthStore();
```

Cách này dễ làm component rerender khi bất kỳ field nào đổi.

## Store đang được dùng ở đâu

- `src/app/auth/login/page.tsx`: dùng `setJwtToken`, `setSession`.
- `src/lib/api/axios-config.ts`: đọc `jwtToken`, gọi `setJwtToken`, `clearAuth`.
- `src/app/(protected)/layout.tsx`: đọc `user` để hiển thị tên.
- `src/components/role-welcome-card.tsx`: đọc `user` để hiển thị profile.

## Sidebar theo role

Khi làm sidebar thật, nên đọc `user.roles` từ store rồi filter menu.

Template:

```ts
const sidebarItems = [
    { title: 'Users', href: '/admin/users', roles: ['SYSTEM_ADMIN'] },
];

const visibleItems = sidebarItems.filter((item) =>
    item.roles.some((role) => user?.roles.includes(role)),
);
```

Khi backend permissions ổn định, permission-based UI sẽ tốt hơn role-based UI cho quyền chi tiết.

## Không dùng Zustand cho gì

Không dùng Zustand làm:

- Server authorization.
- Nơi lưu refresh token.
- Nơi lưu secret.
- Nguồn kiểm tra quyền duy nhất.
- Persist auth token dài hạn nếu chưa được review security.

Frontend chỉ hide UI/redirect. Backend mới là nơi reject request trái quyền.

## F5 và memory store

Store hiện không dùng persist middleware. Khi reload/F5:

- `user` về `null`.
- `jwtToken` về `null`.
- `isAuthenticated` về `false`.

Để restore session, cần AuthBootstrap gọi `refreshApi()` rồi `getMyProfileApi()`.

## Common errors

### Destructure cả store gây rerender nhiều

Nên dùng selector từng field.

### Lưu refresh token vào store/localStorage

Sai. Refresh token phải ở HttpOnly cookie.

### F5 mất store

Đây là behavior mặc định của memory store. Cần AuthBootstrap nếu muốn khôi phục session sau reload.

### Tin Zustand là bảo mật

Sai. Người dùng có thể chỉnh state trong browser. Backend phải kiểm tra role/permission.
